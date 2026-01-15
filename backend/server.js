require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

const BUCKET = process.env.S3_BUCKET_NAME;
const REGION = process.env.S3_REGION || 'us-east-1';
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

const app = express();
const PORT = process.env.PORT || 5000;
// S3 client
const s3 = new S3Client({
  region: REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: FORCE_PATH_STYLE || undefined,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helpers
const requireBucket = () => {
  if (!BUCKET) {
    throw new Error('S3_BUCKET_NAME is not configured');
  }
  return BUCKET;
};

const streamToString = async (stream) => {
  if (!stream) return '';
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
};

const escapeCsv = (value) => {
  const str = value === undefined || value === null ? '' : String(value);
  if (str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  if (str.includes(',') || str.includes('\n')) {
    return `"${str}"`;
  }
  return str;
};

/**
 * Get the latest CSV file in the data directory
 */
const getLatestCsvFile = async () => {
  const bucket = requireBucket();
  const resp = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'data_',
    })
  );

  const items = resp.Contents || [];
  const sorted = items
    .filter((obj) => obj.Key && obj.Key.endsWith('.csv'))
    .sort((a, b) => (b.LastModified || 0) - (a.LastModified || 0));

  return sorted.length > 0 ? sorted[0].Key : null;
};

/**
 * Create a new CSV file if it doesn't exist, or get the latest one
 */
const ensureCsvKey = async () => {
  const latestKey = await getLatestCsvFile();
  if (latestKey) return latestKey;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `data_${timestamp}.csv`;
};

const fetchCsv = async (key) => {
  const bucket = requireBucket();
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    const body = await streamToString(resp.Body);
    return body;
  } catch (err) {
    if (err.name === 'NoSuchKey') return null;
    throw err;
  }
};

/**
 * Append data to CSV file
 */
const appendToCSV = async (data) => {
  const bucket = requireBucket();
  const key = await ensureCsvKey();

  const dataWithMeta = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...data,
  };

  const existingCsv = await fetchCsv(key);

  let headers = Object.keys(dataWithMeta);
  let rows = [];

  if (existingCsv) {
    const lines = existingCsv.split('\n').filter((l) => l.trim() !== '');
    if (lines.length > 0) {
      const existingHeaders = lines[0].split(',');
      headers = Array.from(new Set([...existingHeaders, ...headers]));
      rows = lines.slice(1).map((line) => {
        const values = line.split(',');
        return headers.reduce((acc, h, idx) => {
          acc[h] = values[idx] || '';
          return acc;
        }, {});
      });
    }
  }

  // Normalize rows to the combined headers
  const normalizedRows = rows.map((row) =>
    headers.reduce((acc, h) => {
      acc[h] = row[h] || '';
      return acc;
    }, {})
  );

  const newRow = headers.reduce((acc, h) => {
    acc[h] = dataWithMeta[h] || '';
    return acc;
  }, {});

  const csvLines = [
    headers.join(','),
    ...normalizedRows.map((row) =>
      headers.map((h) => escapeCsv(row[h])).join(',')
    ),
    headers.map((h) => escapeCsv(newRow[h])).join(','),
  ].join('\n');

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: csvLines,
      ContentType: 'text/csv',
    })
  );

  return { success: true, file: key, data: dataWithMeta };
};

/**
 * POST endpoint to receive and save data
 */
app.post('/api/save-data', async (req, res) => {
  try {
    const data = req.body;
    
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided'
      });
    }
    
    const result = await appendToCSV(data);
    
    res.status(200).json({
      success: true,
      message: 'Data saved successfully',
      file: result.file,
      data: result.data
    });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({
      success: false,
      error: 'Error saving data',
      details: error.message
    });
  }
});

/**
 * GET endpoint to list all CSV files
 */
app.get('/api/files', async (req, res) => {
  try {
    const bucket = requireBucket();
    const resp = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: 'data_' })
    );

    const files = (resp.Contents || [])
      .filter((obj) => obj.Key && obj.Key.endsWith('.csv'))
      .map((obj) => ({
        name: obj.Key,
        size: obj.Size || 0,
        created: obj.LastModified || null,
        modified: obj.LastModified || null,
      }))
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Error listing files',
      details: error.message,
    });
  }
});

/**
 * GET endpoint to download a specific CSV file
 */
app.get('/api/download/:fileName', async (req, res) => {
  try {
    const bucket = requireBucket();
    const { fileName } = req.params;

    const resp = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: fileName })
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    if (resp.Body && resp.Body.pipe) {
      resp.Body.pipe(res);
    } else {
      const buffer = await streamToString(resp.Body);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    const status = error.name === 'NoSuchKey' ? 404 : 500;
    res.status(status).json({
      success: false,
      error: status === 404 ? 'File not found' : 'Error downloading file',
      details: error.message,
    });
  }
});

/**
 * GET endpoint to get the latest CSV file
 */
app.get('/api/latest', async (req, res) => {
  try {
    const latestFile = await getLatestCsvFile();
    
    if (!latestFile) {
      return res.json({
        file: null,
        message: 'No CSV files found yet'
      });
    }
    
    res.json({
        file: latestFile,
        path: `/api/download/${latestFile}`
    });
  } catch (error) {
    console.error('Error getting latest file:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting latest file',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    bucket: BUCKET || null
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🪣 S3 bucket: ${BUCKET || 'not configured'}`);
  console.log(`📍 S3 region: ${REGION}`);
  console.log(`🔑 AWS credentials: ${process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'not configured'}`);
  console.log(`🌐 S3 endpoint: ${S3_ENDPOINT || 'default (AWS)'}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST   /api/save-data      - Save data to CSV`);
  console.log(`  GET    /api/files          - List all CSV files`);
  console.log(`  GET    /api/latest         - Get the latest CSV file`);
  console.log(`  GET    /api/download/:file - Download a specific CSV file`);
  console.log(`  GET    /api/health         - Health check`);
});

module.exports = app;

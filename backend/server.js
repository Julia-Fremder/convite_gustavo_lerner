const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Get the latest CSV file in the data directory
 */
const getLatestCsvFile = () => {
  if (!fs.existsSync(DATA_DIR)) return null;
  
  const files = fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.csv'))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(DATA_DIR, a));
      const statB = fs.statSync(path.join(DATA_DIR, b));
      return statB.mtime - statA.mtime; // Most recent first
    });
  
  return files.length > 0 ? files[0] : null;
};

/**
 * Create a new CSV file if it doesn't exist, or get the latest one
 */
const ensureCsvFile = () => {
  const latestFile = getLatestCsvFile();
  
  if (latestFile) {
    return path.join(DATA_DIR, latestFile);
  }
  
  // Create new CSV file with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fileName = `data_${timestamp}.csv`;
  return path.join(DATA_DIR, fileName);
};

/**
 * Append data to CSV file
 */
const appendToCSV = async (data) => {
  const csvPath = ensureCsvFile();
  
  // Add timestamp and unique ID to data
  const dataWithMeta = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Check if file exists and has content
  const fileExists = fs.existsSync(csvPath);
  const headers = Object.keys(dataWithMeta);
  
  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: headers.map(header => ({ id: header, title: header })),
    append: fileExists,
    encoding: 'utf8'
  });
  
  await csvWriter.writeRecords([dataWithMeta]);
  
  return { success: true, file: path.basename(csvPath), data: dataWithMeta };
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
app.get('/api/files', (req, res) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(DATA_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);
    
    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Error listing files',
      details: error.message
    });
  }
});

/**
 * GET endpoint to download a specific CSV file
 */
app.get('/api/download/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(DATA_DIR, fileName);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(DATA_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Error downloading file',
      details: error.message
    });
  }
});

/**
 * GET endpoint to get the latest CSV file
 */
app.get('/api/latest', (req, res) => {
  try {
    const latestFile = getLatestCsvFile();
    
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
    latestFile: getLatestCsvFile()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST   /api/save-data      - Save data to CSV`);
  console.log(`  GET    /api/files          - List all CSV files`);
  console.log(`  GET    /api/latest         - Get the latest CSV file`);
  console.log(`  GET    /api/download/:file - Download a specific CSV file`);
  console.log(`  GET    /api/health         - Health check`);
});

module.exports = app;

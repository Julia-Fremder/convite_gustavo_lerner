import { useState, useEffect } from 'react';
import { contentAPI } from '../services/apiClient';

const useContent = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getContent = async () => {
      try {
        setLoading(true);
        const data = await contentAPI.fetch();
        setContent(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    getContent();
  }, []);

  return { content, loading, error };
};

export default useContent;

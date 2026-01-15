import { useState, useEffect } from 'react';

const useContent = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getContent = async () => {
      try {
        setLoading(true);
        const response = await fetch('/content.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        const data = await response.json();
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

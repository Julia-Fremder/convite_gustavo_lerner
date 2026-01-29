import { useState, useEffect } from 'react';

const STORAGE_KEY = 'userEmail';

const useLocalStorage = () => {
  // State to store the email
  const [email, setEmail] = useState(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item || '';
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return '';
    }
  });

  // Update localStorage whenever email changes
  useEffect(() => {
    try {
      if (email && email.trim()) {
        window.localStorage.setItem(STORAGE_KEY, email);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }, [email]);

  return [email, setEmail];
};

export default useLocalStorage;

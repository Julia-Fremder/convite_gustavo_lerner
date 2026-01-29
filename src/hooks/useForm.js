import { useState, useCallback } from 'react';

const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prevTouched) => ({
      ...prevTouched,
      [name]: true,
    }));
  }, []);

  const handleSubmit = useCallback(
    (onSubmit) => async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values]
  );

  const setFieldValue = useCallback((fieldName, fieldValue) => {
    setValues((prevValues) => ({
      ...prevValues,
      [fieldName]: fieldValue,
    }));
  }, []);

  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: errorMessage,
    }));
  }, []);

  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched((prevTouched) => ({
      ...prevTouched,
      [fieldName]: isTouched,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const resetField = useCallback((fieldName) => {
    setValues((prevValues) => ({
      ...prevValues,
      [fieldName]: initialValues[fieldName] || '',
    }));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[fieldName];
      return newErrors;
    });
    setTouched((prevTouched) => {
      const newTouched = { ...prevTouched };
      delete newTouched[fieldName];
      return newTouched;
    });
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    resetField,
    setValues,
    setErrors,
    setTouched,
  };
};

export default useForm;

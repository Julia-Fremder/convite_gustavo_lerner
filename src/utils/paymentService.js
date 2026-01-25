const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok || !data.success) {
    const message = data.error || data.details || 'Request failed';
    throw new Error(message);
  }
  return data;
};

export const requestPixPayment = async ({ amount, description, txId }) => {
  const response = await fetch(`${apiBaseUrl}/api/pix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, description, txId }),
  });

  return handleResponse(response);
};

export const requestMbwayPayment = async ({ amount, phone, description, txId }) => {
  const response = await fetch(`${apiBaseUrl}/api/mbway`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, phone, description, txId }),
  });

  return handleResponse(response);
};

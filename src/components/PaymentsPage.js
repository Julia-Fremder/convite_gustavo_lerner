import React, { useEffect, useMemo, useState } from 'react';
import { fetchPayments, updatePaymentStatus } from '../utils/paymentService';

const statusOptions = [
  { value: 'pending', label: 'Pendente' },
  { value: 'received', label: 'Recebido' },
];

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSaving, setStatusSaving] = useState('');

  const fetchAll = useMemo(
    () => async () => {
      try {
        setLoading(true);
        setError('');
        const { payments: data } = await fetchPayments();
        setPayments(data || []);
      } catch (err) {
        setError(err.message || 'Erro ao carregar pagamentos');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleFieldChange = (id, field, value) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (id) => {
    const payment = payments.find((p) => p.id === id);
    if (!payment) return;

    try {
      setStatusSaving(id);
      setError('');
      const { payment: updated } = await updatePaymentStatus(id, {
        status: payment.status,
        message: payment.message,
      });
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(err.message || 'Erro ao atualizar pagamento');
    } finally {
      setStatusSaving('');
    }
  };

  if (loading) {
    return <p>Carregando pagamentos...</p>;
  }

  return (
    <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
      <h2 style={{ margin: '20px 0' }}>Pagamentos gerados</h2>
      {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
        <p style={{ color: '#555' }}>Clique em "Salvar" para confirmar alterações no status.</p>
        <button onClick={fetchAll} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer' }}>Atualizar lista</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #eee' }}>
          <thead style={{ background: '#f7f7f7' }}>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Valor</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Mensagem</th>
              <th style={thStyle}>Criado em</th>
              <th style={thStyle}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{p.email}</td>
                <td style={tdStyle}>{p.payment_type}</td>
                <td style={tdStyle}>{Number(p.amount).toFixed(2)}</td>
                <td style={tdStyle}>
                  <select
                    value={p.status}
                    onChange={(e) => handleFieldChange(p.id, 'status', e.target.value)}
                    style={selectStyle}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  <textarea
                    value={p.message || ''}
                    rows={2}
                    onChange={(e) => handleFieldChange(p.id, 'message', e.target.value)}
                    style={{ ...textareaStyle, minWidth: '200px' }}
                    placeholder="Mensagem opcional"
                  />
                </td>
                <td style={tdStyle}>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={statusSaving === p.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#4caf50',
                      color: '#fff',
                      cursor: statusSaving === p.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {statusSaving === p.id ? 'Salvando...' : 'Salvar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '10px',
  textAlign: 'left',
  borderBottom: '1px solid #e0e0e0',
  fontSize: '14px',
  color: '#555',
};

const tdStyle = {
  padding: '10px',
  fontSize: '14px',
  verticalAlign: 'top',
};

const selectStyle = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  minWidth: '130px',
};

const textareaStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '14px',
  resize: 'vertical',
};

export default PaymentsPage;

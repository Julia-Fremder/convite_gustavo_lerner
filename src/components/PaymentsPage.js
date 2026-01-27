import { useEffect, useMemo, useState } from 'react';
import { paymentAPI } from '../services/apiClient';
import './PaymentsPage.css';

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
        const data = await paymentAPI.list();
        setPayments(data.payments || []);
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
      const { payment: updated } = await paymentAPI.update(id, {
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
    <div className="payments-container">
      <h2 className="payments-title">Pagamentos gerados</h2>
      {error && <p className="payments-error">{error}</p>}
      <div className="payments-controls">
        <p className="payments-hint">Clique em "Salvar" para confirmar alterações no status.</p>
        <button onClick={fetchAll} className="refresh-button">Atualizar lista</button>
      </div>
      <div className="table-wrapper">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Mensagem</th>
              <th>Criado em</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.email}</td>
                <td>{p.payment_type}</td>
                <td>{Number(p.amount).toFixed(2)}</td>
                <td>
                  <select
                    value={p.status}
                    onChange={(e) => handleFieldChange(p.id, 'status', e.target.value)}
                    className="status-select"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <textarea
                    value={p.message || ''}
                    rows={2}
                    onChange={(e) => handleFieldChange(p.id, 'message', e.target.value)}
                    className="message-input"
                    placeholder="Mensagem opcional"
                  />
                </td>
                <td>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</td>
                <td>
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={statusSaving === p.id}
                    className="save-button"
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

export default PaymentsPage;

import { useCallback, useEffect, useMemo, useState } from 'react';
import useContent from '../hooks/useContent';
import useLocalStorage from '../hooks/useLocalStorage';
import { paymentAPI } from '../services/apiClient';
import GiftCard from './GiftCard';
import './GiftlistSection.css';
import '../components/Modal.css';

const GiftlistSection = () => {
  const { content, loading, error } = useContent();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedEur, setSelectedEur] = useState({}); // { [giftId]: quantity }
  const [selectedBrl, setSelectedBrl] = useState({}); // { [giftId]: quantity }
  const [eurDisabled, setEurDisabled] = useState(false);
  const [brlDisabled, setBrlDisabled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [storedEmail, setStoredEmail] = useLocalStorage();
  const [userEmail, setUserEmail] = useState(storedEmail || '');
  const [userMessage, setUserMessage] = useState('');
  const [userPayments, setUserPayments] = useState([]);

  const presentsEur = content?.presents_eur || [];
  const presentsBrl = content?.presents_brl || [];

  useEffect(() => {
    setEurDisabled(Object.keys(selectedBrl).length > 0);
    setBrlDisabled(Object.keys(selectedEur).length > 0);
  }, [selectedBrl, selectedEur]);

  useEffect(() => {
    if (userEmail) return;
    try {
      const saved = window.localStorage.getItem('answerForm_email');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setUserEmail(parsed);
          setStoredEmail(parsed);
        }
      }
    } catch (_error) {
      // ignore
    }
  }, [userEmail, setStoredEmail]);

  useEffect(() => {
    setStoredEmail(userEmail || '');
  }, [userEmail, setStoredEmail]);

  const refreshUserPayments = useCallback(async (email) => {
    if (!email) return;
    try {
      const data = await paymentAPI.list(email);
      setUserPayments(data.payments || []);
    } catch (_error) {
      throw ('Não foi possível carregar seus pagamentos.');
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      refreshUserPayments(userEmail);
    }
  }, [userEmail, refreshUserPayments]);

  const totalSelected = useMemo(() => {
    const quantities = Object.keys(selectedEur).length ? selectedEur : selectedBrl;
    const presents = Object.keys(selectedEur).length ? presentsEur : presentsBrl;
    return Object.entries(quantities).reduce((sum, [giftId, qty]) => {
      const gift = presents.find(p => p.id === giftId);
      return sum + (gift ? Number(gift.price || 0) * qty : 0);
    }, 0);
  }, [selectedEur, selectedBrl, presentsEur, presentsBrl]);

  const updateQuantity = (gift, currency, change) => {
    if (currency === 'EUR' && eurDisabled) return;
    if (currency === 'BRL' && brlDisabled) return;

    if (currency === 'EUR') {
      setSelectedEur((prev) => {
        const currentQty = prev[gift.id] || 0;
        const newQty = Math.max(0, currentQty + change);
        const updated = { ...prev };
        if (newQty === 0) {
          delete updated[gift.id];
        } else {
          updated[gift.id] = newQty;
        }
        return updated;
      });
      if (change > 0) setSelectedBrl({});
    } else {
      setSelectedBrl((prev) => {
        const currentQty = prev[gift.id] || 0;
        const newQty = Math.max(0, currentQty + change);
        const updated = { ...prev };
        if (newQty === 0) {
          delete updated[gift.id];
        } else {
          updated[gift.id] = newQty;
        }
        return updated;
      });
      if (change > 0) setSelectedEur({});
    }

    setPaymentResult(null);
    setMessage('');
  };

  const clearSelections = () => {
    setSelectedEur({});
    setSelectedBrl({});
    setPaymentResult(null);
    setMessage('');
    setEurDisabled(false);
    setBrlDisabled(false);
  };

  const registerPayment = async ({ method, amount, description, txId, items, phone }) => {
    try {
      await paymentAPI.create({
        email: userEmail.trim(),
        amount,
        paymentType: method,
        message: userMessage || undefined,
        description,
        txId,
        raw: { items, phone },
      });
    } catch (err) {
      // Surface a warning but do not block user from seeing the payment data
      setMessage(err.message || 'Pagamento gerado, mas não foi possível registrar no banco.');
    }
  };

  const handleMbway = async (items) => {
    try {
      setIsProcessing(true);
      setMessage('');
      setPaymentResult(null);

      const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
      const desc = items.map((i) => `${i.title} (${i.quantity}x)`).join(' | ');
      const phone = items[0]?.phone; // Payment destination (from gift item)

      const result = await paymentAPI.generateMbway({
        amount: total,
        phone,
        description: desc,
        txId: `MBW-${items.length}-${Date.now()}`,
      });

      await registerPayment({
        method: 'MBWay',
        amount: total,
        description: desc,
        txId: result.txId,
        items,
        phone,
      });

      setPaymentResult({
        method: 'MBWay',
        title: desc,
        amount: total,
        phone,
        ...result
      });
      refreshUserPayments(userEmail);
    } catch (err) {
      setMessage(err.message || 'Erro ao gerar pagamento MBWay');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePix = async (items) => {
    try {
      setIsProcessing(true);
      setMessage('');
      setPaymentResult(null);

      const total = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
      const desc = items.map((i) => `${i.title} (${i.quantity}x)`).join(' | ');

      const result = await paymentAPI.generatePix({
        amount: total,
        description: desc,
        txId: `PIX-${items.length}-${Date.now()}`,
      });

      await registerPayment({
        method: 'PIX',
        amount: total,
        description: desc,
        txId: result.txId,
        items,
      });

      setPaymentResult({ method: 'PIX', title: desc, amount: total, ...result });
      refreshUserPayments(userEmail);
    } catch (err) {
      setMessage(err.message || 'Erro ao gerar pagamento PIX');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!Object.keys(selectedEur).length && !Object.keys(selectedBrl).length) {
      setMessage('Selecione ao menos um presente.');
      return;
    }
    if (!userEmail.trim()) {
      setMessage('Informe um email para gerar o pagamento.');
      return;
    }
    setMessage('');
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    const quantities = Object.keys(selectedEur).length ? selectedEur : selectedBrl;
    const presents = Object.keys(selectedEur).length ? presentsEur : presentsBrl;
    
    const items = Object.entries(quantities).map(([giftId, qty]) => {
      const gift = presents.find(p => p.id === giftId);
      return { ...gift, quantity: qty };
    });
    
    if (!items.length) return;

    setShowConfirmModal(false);
    if (Object.keys(selectedEur).length) {
      await handleMbway(items);
    } else {
      await handlePix(items);
    }
  };

  if (loading) {
    return <p>Carregando presentes...</p>;
  }

  if (error) {
    return <p>Erro ao carregar presentes: {error}</p>;
  }

  return (
    <section className="giftlist-section">
      <h2>Presentes</h2>
      <div className="giftlist-container">
      <div className="giftlist-subsection">
        <h3>Opção Brasil (BRL / PIX)</h3>
        <div className="gift-card-grid">
          {presentsBrl.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              quantity={selectedBrl[gift.id] || 0}
              disabled={brlDisabled}
              currency="BRL"
              isProcessing={isProcessing}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>
        </div>
      </div>


      <div className="giftlist-divider"></div>

      <div className="giftlist-container">
        <div className="giftlist-subsection">
          <h3>Opção Portugal (EUR / MBWay)</h3>
          <div className="gift-card-grid">
            {presentsEur.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                quantity={selectedEur[gift.id] || 0}
                disabled={eurDisabled}
                currency="EUR"
                isProcessing={isProcessing}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </div>
        </div>

        <div className="giftlist-footer">
          <div className="giftlist-summary">
            <strong>Selecionados:</strong> {Object.values(selectedEur).reduce((a, b) => a + b, 0) + Object.values(selectedBrl).reduce((a, b) => a + b, 0)} | Total:{' '}
            {Object.keys(selectedEur).length ? '€' : Object.keys(selectedBrl).length ? 'R$' : ''} {totalSelected.toFixed(2)}
          </div>
          <div className="giftlist-footer-actions">
            <button
              type="button"
              className="giftlist-btn secondary"
              onClick={clearSelections}
              disabled={isProcessing || (!Object.keys(selectedEur).length && !Object.keys(selectedBrl).length)}
            >
              Limpar
            </button>
            <button
              type="button"
              className="giftlist-btn primary pagar-btn"
              onClick={handleOpenConfirm}
              disabled={isProcessing || (!Object.keys(selectedEur).length && !Object.keys(selectedBrl).length)}
            >
              Pagar
            </button>
          </div>
        </div>
      </div>

      {message && <p className="giftlist-message error">{message}</p>}

      {paymentResult && (
        <div className="giftlist-payment-result">
          <h4>{paymentResult.method} gerado para: {paymentResult.title}</h4>
          <p>Valor: {paymentResult.method === 'MBWay' ? '€' : 'R$'} {Number(paymentResult.amount).toFixed(2)}</p>
          {paymentResult.phone && <p>Telefone: {paymentResult.phone}</p>}
          {paymentResult.txId && <p>ID: {paymentResult.txId}</p>}
          {paymentResult.payload && (
            <div className="giftlist-payload">
              <p>Payload:</p>
              <code>{paymentResult.payload}</code>
            </div>
          )}
          {paymentResult.qrCode && (
            <div className="giftlist-qr">
              <img src={paymentResult.qrCode} alt={`QR para ${paymentResult.method}`} />
            </div>
          )}
        </div>
      )}

      {userEmail && userPayments.length > 0 && (
        <div className="giftlist-payment-result giftlist-payment-result--with-margin">
          <h4>{userEmail}</h4>
          <table className="giftlist-payments-list">
            <thead>
              <th>
                <td>Valor</td>
                <td>Presente(s)</td>
                <td>Data</td>
              </th>
            </thead>
            {userPayments.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.payment_type}</strong> — {Number(p.amount).toFixed(2)} ({p.status})
                </td>
                <td>{p.description ? ` • ${p.description}` : ''}</td>
                <td>
                  {p.created_at ? ` • ${new Date(p.created_at).toLocaleString('pt-BR')}` : ''}</td>
              </tr>
            ))}
          </table>
        </div>
      )}

      {userPayments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .filter((p) => {
          const isReceived = p.status === 'received';
          const statusLabel = isReceived ?? 'Presente Confirmado';
          return (
            <section
              key={p.id}
              className={`giftlist-confirmed-section ${isReceived ? 'giftlist-confirmed-section--received' : 'giftlist-confirmed-section--pending'}`}
            >
              <h3>{statusLabel}</h3>
              <div className="giftlist-confirmed-section__content">
                <p className="giftlist-confirmed-section__header">{p.payment_type}</p>
                <p className="giftlist-confirmed-section__value">
                  <strong>Valor:</strong> {Number(p.amount).toFixed(2)}
                </p>
                <p className="giftlist-confirmed-section__status">
                  <strong>Status:</strong> {p.status}
                </p>
                {p.description && (
                  <p className="giftlist-confirmed-section__description">
                    <strong>Presente:</strong> {p.description}
                  </p>
                )}
                {p.message && (
                  <div className="giftlist-confirmed-section__message">
                    <p>"{p.message}"</p>
                  </div>
                )}
                {p.created_at && (
                  <p className="giftlist-confirmed-section__date">
                    {isReceived ? 'Confirmado em' : 'Gerado em'}: {new Date(p.created_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </section>
          );
        })}

      <img
        src="/assets/images/obrigado.gif"
        alt="obrigado"
      />

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>Confirmar presentes</h4>
            <div className="confirm-guests">
              <strong>Itens selecionados:</strong>
              <ul>
                {(() => {
                  const quantities = Object.keys(selectedEur).length ? selectedEur : selectedBrl;
                  const presents = Object.keys(selectedEur).length ? presentsEur : presentsBrl;
                  const currency = Object.keys(selectedEur).length ? 'EUR' : 'BRL';
                  
                  return Object.entries(quantities).map(([giftId, qty]) => {
                    const gift = presents.find(p => p.id === giftId);
                    if (!gift) return null;
                    const itemTotal = Number(gift.price) * qty;
                    return (
                      <li key={giftId}>
                        {gift.title} ({qty}x) — {currency === 'EUR' ? '€' : 'R$'} {itemTotal.toFixed(2)}
                      </li>
                    );
                  });
                })()}
              </ul>
              <p>
                <strong>Total:</strong> {Object.keys(selectedEur).length ? '€' : 'R$'} {totalSelected.toFixed(2)}
              </p>
            </div>
            <div className="modal-form-group">
              <div>
                <label>Email (obrigatório)</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label>Mensagem (opcional)</label>
                <textarea
                  placeholder="Mensagem para identificarmos o presente"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  disabled={isProcessing}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-button primary"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Gerando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentResult && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>{paymentResult.method} gerado</h4>
            <div className="payment-details">
              <p><strong>Itens:</strong> {paymentResult.title}</p>
              <p><strong>Valor:</strong> {paymentResult.method === 'MBWay' ? '€' : 'R$'} {Number(paymentResult.amount).toFixed(2)}</p>
              {paymentResult.phone && <p><strong>Telefone Destino:</strong> {paymentResult.phone}</p>}
              {paymentResult.txId && <p><strong>ID Transação:</strong> {paymentResult.txId}</p>}
            </div>
            {paymentResult.qrCode && (
              <div className="payment-qr">
                <p>Escaneie o código QR:</p>
                <img src={paymentResult.qrCode} alt={`QR para ${paymentResult.method}`} />
              </div>
            )}
            {paymentResult.payload && (
              <div className="payment-payload">
                <p><strong>Payload:</strong></p>
                <code>{paymentResult.payload}</code>
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-button primary"
                onClick={() => {
                  setPaymentResult(null);
                  clearSelections();
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GiftlistSection;

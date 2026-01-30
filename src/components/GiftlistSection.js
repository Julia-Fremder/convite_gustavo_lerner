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
  const [showReceivedDetails, setShowReceivedDetails] = useState(true);

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

  const totalSelectedEur = useMemo(() => {
    return Object.entries(selectedEur).reduce((sum, [giftId, qty]) => {
      const gift = presentsEur.find(p => p.id === giftId);
      return sum + (gift ? Number(gift.price || 0) * qty : 0);
    }, 0);
  }, [selectedEur, presentsEur]);

  const totalSelectedBrl = useMemo(() => {
    return Object.entries(selectedBrl).reduce((sum, [giftId, qty]) => {
      const gift = presentsBrl.find(p => p.id === giftId);
      return sum + (gift ? Number(gift.price || 0) * qty : 0);
    }, 0);
  }, [selectedBrl, presentsBrl]);

  const totalSelected = useMemo(() => {
    return Object.keys(selectedEur).length ? totalSelectedEur : totalSelectedBrl;
  }, [selectedEur, totalSelectedEur, totalSelectedBrl]);

  const totalReceivedEur = useMemo(() => {
    return (userPayments || [])
      .filter((p) => p.status === 'received' && p.payment_type === 'MBWay')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [userPayments]);

  const totalReceivedBrl = useMemo(() => {
    return (userPayments || [])
      .filter((p) => p.status === 'received' && p.payment_type === 'PIX')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [userPayments]);

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
    setMessage('');
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!userEmail.trim()) {
      setMessage('Informe um email para gerar o pagamento.');
      return;
    }

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

        <div className="giftlist-footer">
          <div className="giftlist-summary">
            <strong>Selecionados:</strong> {Object.values(selectedBrl).reduce((a, b) => a + b, 0)} | Total: R$ {totalSelectedBrl.toFixed(2)}
          </div>
          <div className="giftlist-footer-actions">
            <button
              type="button"
              className="giftlist-btn secondary"
              onClick={() => setSelectedBrl({})}
              disabled={isProcessing || !Object.keys(selectedBrl).length}
            >
              Limpar
            </button>
            <button
              type="button"
              className="giftlist-btn primary pagar-btn"
              onClick={handleOpenConfirm}
              disabled={isProcessing || !Object.keys(selectedBrl).length}
            >
              Pagar
            </button>
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
            <strong>Selecionados:</strong> {Object.values(selectedEur).reduce((a, b) => a + b, 0)} | Total: € {totalSelectedEur.toFixed(2)}
          </div>
          <div className="giftlist-footer-actions">
            <button
              type="button"
              className="giftlist-btn secondary"
              onClick={() => setSelectedEur({})}
              disabled={isProcessing || !Object.keys(selectedEur).length}
            >
              Limpar
            </button>
            <button
              type="button"
              className="giftlist-btn primary pagar-btn"
              onClick={handleOpenConfirm}
              disabled={isProcessing || !Object.keys(selectedEur).length}
            >
              Pagar
            </button>
          </div>
        </div>
      </div>

      {message && <p className="giftlist-message error">{message}</p>}

      {/* Show only pending or confirmed; hide canceled */}
      {userPayments
        .filter((p) => p.status === 'pending' || p.status === 'received')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((p) => {
          const isReceived = p.status === 'received';

          if (!isReceived) {
            // Render pending as a compact inline widget with close/cancel
            return (
              <div key={p.id} className="pending-widget">
                <span className="pending-widget__label">Pagamento pendente (será confirmado manualmente)</span>
                <span className="pending-widget__info">
                  {p.payment_type} • {Number(p.amount).toFixed(2)}
                  {p.description ? ` • ${p.description}` : ''}
                </span>
                <button
                  className="pending-widget__close"
                  title="Cancelar pagamento"
                  onClick={async () => {
                    try {
                      await paymentAPI.update(p.id, { status: 'canceled' });
                      setUserPayments((prev) => prev.filter((x) => x.id !== p.id));
                      // Refresh from server to ensure consistency
                      refreshUserPayments(userEmail);
                    } catch (err) {
                      setMessage(err.message || 'Não foi possível cancelar o pagamento.');
                    }
                  }}
                >
                  ×
                </button>
              </div>
            );
          }

          // Received: show details unless closed; close does not change status
          return showReceivedDetails ? (
            <section
              key={p.id}
              className={`giftlist-confirmed-section giftlist-confirmed-section--received`}
            >
              <div className="received-header">
                <h3>Presente Confirmado</h3>
                <button
                  type="button"
                  className="received-close-btn"
                  title="Fechar"
                  onClick={() => setShowReceivedDetails(false)}
                >
                  ×
                </button>
              </div>
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
                    Confirmado em: {new Date(p.created_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </section>
          ) : null;
        })}

      {/* Summary note: show total received in small letters under gift section */}
      {(totalReceivedEur > 0 || totalReceivedBrl > 0) && (
        <p className="total-received-note">
          Total recebido:
          {totalReceivedBrl > 0 && (
            <span> R$ {totalReceivedBrl.toFixed(2)}</span>
          )}
          {totalReceivedEur > 0 && (
            <span> • € {totalReceivedEur.toFixed(2)}</span>
          )}
        </p>
      )}

      <img
        src={`${process.env.PUBLIC_URL || ''}/assets/images/obrigado.gif`}
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

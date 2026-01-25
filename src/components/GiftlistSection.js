import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useContent from '../hooks/useContent';
import useLocalStorage from '../hooks/useLocalStorage';
import { requestPixPayment, requestMbwayPayment, createPaymentRecord, fetchPayments } from '../utils/paymentService';
import './GiftlistSection.css';
import '../components/Modal.css';

const GiftlistSection = () => {
  const { content, loading, error } = useContent();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedEur, setSelectedEur] = useState([]);
  const [selectedBrl, setSelectedBrl] = useState([]);
  const [eurDisabled, setEurDisabled] = useState(false);
  const [brlDisabled, setBrlDisabled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [storedEmail, setStoredEmail] = useLocalStorage('giftlist_email', '');
  const [userEmail, setUserEmail] = useState(storedEmail || '');
  const [userMessage, setUserMessage] = useState('');
  const [userPayments, setUserPayments] = useState([]);

  const presentsEur = content?.presents_eur || [];
  const presentsBrl = content?.presents_brl || [];

  useEffect(() => {
    setEurDisabled(selectedBrl.length > 0);
    setBrlDisabled(selectedEur.length > 0);
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
    } catch (err) {
      // ignore
    }
  }, [userEmail, setStoredEmail]);

  useEffect(() => {
    setStoredEmail(userEmail || '');
  }, [userEmail, setStoredEmail]);

  const refreshUserPayments = useCallback(async (email) => {
    if (!email) return;
    try {
      const { payments } = await fetchPayments({ email });
      setUserPayments(payments || []);
    } catch (err) {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      refreshUserPayments(userEmail);
    }
  }, [userEmail, refreshUserPayments]);

  const totalSelected = useMemo(() => {
    const list = selectedEur.length ? selectedEur : selectedBrl;
    return list.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [selectedEur, selectedBrl]);

  const toggleSelect = (gift, currency) => {
    if (currency === 'EUR' && eurDisabled) return;
    if (currency === 'BRL' && brlDisabled) return;

    if (currency === 'EUR') {
      setSelectedEur((prev) =>
        prev.find((g) => g.id === gift.id)
          ? prev.filter((g) => g.id !== gift.id)
          : [...prev, gift]
      );
      setSelectedBrl([]);
    } else {
      setSelectedBrl((prev) =>
        prev.find((g) => g.id === gift.id)
          ? prev.filter((g) => g.id !== gift.id)
          : [...prev, gift]
      );
      setSelectedEur([]);
    }

    setPaymentResult(null);
    setMessage('');
  };

  const clearSelections = () => {
    setSelectedEur([]);
    setSelectedBrl([]);
    setPaymentResult(null);
    setMessage('');
    setEurDisabled(false);
    setBrlDisabled(false);
  };

  const registerPayment = async ({ method, amount, description, txId, items, phone, userPhoneNotification }) => {
    try {
      await createPaymentRecord({
        email: userEmail.trim(),
        amount,
        paymentType: method,
        message: userMessage || undefined,
        description,
        txId,
        raw: { items, phone, userPhoneNotification },
      });
    } catch (err) {
      // Surface a warning but do not block user from seeing the payment data
      setMessage(err.message || 'Pagamento gerado, mas não foi possível registrar no banco.');
    }
  };

  const handleMbway = async (items, userPhoneNotification = null) => {
    try {
      setIsProcessing(true);
      setMessage('');
      setPaymentResult(null);

      const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const desc = items.map((i) => i.title).join(' | ');
      const phone = items[0]?.phone; // Payment destination (from gift item)

      const result = await requestMbwayPayment({
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
        userPhoneNotification,
      });

      setPaymentResult({ 
        method: 'MBWay', 
        title: desc, 
        amount: total, 
        phone,
        userPhone: userPhoneNotification,
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

      const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const desc = items.map((i) => i.title).join(' | ');

      const result = await requestPixPayment({
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
    if (!selectedEur.length && !selectedBrl.length) {
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
    const items = selectedEur.length ? selectedEur : selectedBrl;
    if (!items.length) return;

    setShowConfirmModal(false);
    if (selectedEur.length) {
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

  const renderGiftCard = (gift, isSelected, disabled, currency) => (
    <div
      className={`gift-card ${isSelected ? 'gift-card--selected' : ''} ${disabled ? 'gift-card--disabled' : ''}`}
      key={gift.id}
    >
      {gift.img && (
        <img src={gift.img} alt={gift.title} className="gift-card__img" />
      )}
      <div className="gift-card__body">
        <h4>{gift.title}</h4>
        {gift.description && <p className="gift-card__desc">{gift.description}</p>}
        <div className="gift-card__footer">
          <p className="gift-card__price">
            {currency === 'EUR' ? '€' : 'R$'} {Number(gift.price).toFixed(2)}
          </p>
          <input
            type="checkbox"
            className="gift-card__checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(gift, currency)}
            disabled={disabled || isProcessing}
            title={disabled ? 'Indisponível (outro grupo selecionado)' : ''}
          />
        </div>
      </div>
    </div>
  );

  return (
    <section className="giftlist-section">
      <h3>Presentes</h3>
      <p>Não é preciso se preocupar com isso!</p>
      <p>Mas sabemos que muitos vão querer nos presentear na mesma.</p>
      <p>Enquanto não conseguimos montar uma lista virtual bonitinha, deixamos aqui duas possibilidades.</p>
      <p><strong>Lembrem de deixar uma msg no detalhe do pix ou mbWay!!!</strong></p>
      <p>Ou enviem mensagem para mensagens.2026.03.16@gmail.com</p>

      <div className="giftlist-container">
        <div className="giftlist-subsection">
          <h3>Opção Portugal (EUR / MBWay)</h3>
          <div className="gift-card-grid">
            {presentsEur.map((gift) =>
              renderGiftCard(
                gift,
                !!selectedEur.find((g) => g.id === gift.id),
                eurDisabled,
                'EUR'
              )
            )}
          </div>
        </div>

        <div className="giftlist-divider"></div>

        <div className="giftlist-subsection">
          <h3>Opção Brasil (BRL / PIX)</h3>
          <div className="gift-card-grid">
            {presentsBrl.map((gift) =>
              renderGiftCard(
                gift,
                !!selectedBrl.find((g) => g.id === gift.id),
                brlDisabled,
                'BRL'
              )
            )}
          </div>
        </div>

        <div className="giftlist-footer">
          <div className="giftlist-summary">
            <strong>Selecionados:</strong> {selectedEur.length + selectedBrl.length} | Total:{' '}
            {selectedEur.length ? '€' : selectedBrl.length ? 'R$' : ''} {totalSelected.toFixed(2)}
          </div>
          <div className="giftlist-footer-actions">
            <button
              type="button"
              className="giftlist-btn secondary"
              onClick={clearSelections}
              disabled={isProcessing || (!selectedEur.length && !selectedBrl.length)}
            >
              Limpar seleção
            </button>
            <button
              type="button"
              className="giftlist-btn primary pagar-btn"
              onClick={handleOpenConfirm}
              disabled={isProcessing || (!selectedEur.length && !selectedBrl.length)}
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
        <div className="giftlist-payment-result" style={{ marginTop: '20px' }}>
          <h4>Pagamentos para {userEmail}</h4>
          <ul style={{ textAlign: 'left', paddingLeft: '18px', color: '#58450a' }}>
            {userPayments.map((p) => (
              <li key={p.id} style={{ marginBottom: '8px' }}>
                <strong>{p.payment_type}</strong> — {Number(p.amount).toFixed(2)} ({p.status})
                {p.description ? ` • ${p.description}` : ''}
                {p.created_at ? ` • ${new Date(p.created_at).toLocaleString('pt-BR')}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {userPayments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((p) => {
          const isReceived = p.status === 'received';
          const borderColor = isReceived ? '#4caf50' : '#f6c343';
          const gradient = isReceived
            ? 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 100%)'
            : 'linear-gradient(135deg, #fff8e1 0%, #ffeaa7 100%)';
          const headingColor = isReceived ? '#2d5a2d' : '#8a6d1a';
          const statusLabel = isReceived ? 'Presente Confirmado' : 'Pagamento Pendente';
          return (
            <div
              key={p.id}
              className="giftlist-confirmed-section"
              style={{
                marginTop: '30px',
                padding: '30px 20px',
                background: gradient,
                borderRadius: '8px',
                border: `2px solid ${borderColor}`,
                boxShadow: isReceived
                  ? '0 6px 16px rgba(76, 175, 80, 0.15)'
                  : '0 6px 16px rgba(246, 195, 67, 0.25)',
              }}
            >
              <h3 style={{ color: headingColor, marginBottom: '16px', textAlign: 'center', fontSize: '24px' }}>
                {statusLabel}
              </h3>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: `6px solid ${borderColor}` }}>
                <p style={{ margin: '0 0 12px 0', fontWeight: '700', color: headingColor, fontSize: '18px' }}>
                  {p.payment_type}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#58450a' }}>
                  <strong>Valor:</strong> {Number(p.amount).toFixed(2)}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#777' }}>
                  <strong>Status:</strong> {p.status}
                </p>
                {p.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#666' }}>
                    <strong>Presente:</strong> {p.description}
                  </p>
                )}
                {p.message && (
                  <div style={{ background: '#faf8f4', padding: '16px', borderRadius: '6px', borderLeft: '4px solid #BFA14A', marginBottom: '12px' }}>
                    <p style={{ margin: '0', fontSize: '15px', color: '#58450a', fontStyle: 'italic' }}>
                      "{p.message}"
                    </p>
                  </div>
                )}
                {p.created_at && (
                  <p style={{ margin: '0', fontSize: '13px', color: '#999' }}>
                    {isReceived ? 'Confirmado em' : 'Gerado em'}: {new Date(p.created_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
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
                {(selectedEur.length ? selectedEur : selectedBrl).map((gift) => (
                  <li key={gift.id}>
                    {gift.title} — {gift.currency === 'EUR' ? '€' : 'R$'} {Number(gift.price).toFixed(2)}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: '10px' }}>
                <strong>Total:</strong> {selectedEur.length ? '€' : 'R$'} {totalSelected.toFixed(2)}
              </p>
            </div>
            <div style={{ marginBottom: '12px', display: 'grid', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Email (obrigatório)</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Mensagem (opcional)</label>
                <textarea
                  placeholder="Mensagem para identificarmos o presente"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  disabled={isProcessing}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
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
              {paymentResult.userPhone && <p><strong>Notificação em:</strong> {paymentResult.userPhone}</p>}
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

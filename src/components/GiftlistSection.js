import React, { useMemo, useState } from 'react';
import useContent from '../hooks/useContent';
import { requestPixPayment, requestMbwayPayment } from '../utils/paymentService';

const GiftlistSection = () => {
  const { content, loading, error } = useContent();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [selectedEur, setSelectedEur] = useState([]);
  const [selectedBrl, setSelectedBrl] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const presentsEur = content?.presents_eur || [];
  const presentsBrl = content?.presents_brl || [];

  const eurDisabled = selectedBrl.length > 0;
  const brlDisabled = selectedEur.length > 0;

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
  };

  const handleMbway = async (items) => {
    try {
      setIsProcessing(true);
      setMessage('');
      setPaymentResult(null);

      const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const desc = items.map((i) => i.title).join(' | ');
      const phone = items[0]?.phone;

      const result = await requestMbwayPayment({
        amount: total,
        phone,
        description: desc,
        txId: `MBW-${items.length}-${Date.now()}`,
      });

      setPaymentResult({ method: 'MBWay', title: desc, amount: total, phone, ...result });
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

      setPaymentResult({ method: 'PIX', title: desc, amount: total, ...result });
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
    setMessage('');
    setShowConfirmModal(true);
  };

  const handleConfirmPayment = async () => {
    const items = selectedEur.length ? selectedEur : selectedBrl;
    if (!items.length) return;

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
                brlDisabled,
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
                eurDisabled,
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
              {paymentResult.phone && <p><strong>Telefone:</strong> {paymentResult.phone}</p>}
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

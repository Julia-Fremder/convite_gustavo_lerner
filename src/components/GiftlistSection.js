import React, { useState } from 'react';
import useContent from '../hooks/useContent';
import { requestPixPayment, requestMbwayPayment } from '../utils/paymentService';

const GiftlistSection = () => {
  const { content, loading, error } = useContent();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const presentsEur = content?.presents_eur || [];
  const presentsBrl = content?.presents_brl || [];

  const handleMbway = async (gift) => {
    try {
      setIsProcessing(true);
      setMessage('');
      setPaymentResult(null);

      const result = await requestMbwayPayment({
        amount: gift.price,
        phone: gift.phone,
        description: gift.title,
        txId: `MBW-${gift.id}`,
      });

      setPaymentResult({ method: 'MBWay', title: gift.title, ...result });
    } catch (err) {
      setMessage(err.message || 'Erro ao gerar pagamento MBWay');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePix = async (gift) => {
    try {
      setIsProcessing(true);
      setMessage('');
      setPaymentResult(null);

      const result = await requestPixPayment({
        amount: gift.price,
        description: gift.title,
        txId: `PIX-${gift.id}`,
      });

      setPaymentResult({ method: 'PIX', title: gift.title, ...result });
    } catch (err) {
      setMessage(err.message || 'Erro ao gerar pagamento PIX');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <p>Carregando presentes...</p>;
  }

  if (error) {
    return <p>Erro ao carregar presentes: {error}</p>;
  }

  const renderGiftCard = (gift, actionLabel, onAction) => (
    <div className="gift-card" key={gift.id}>
      {gift.img && (
        <img src={gift.img} alt={gift.title} className="gift-card__img" />
      )}
      <div className="gift-card__body">
        <h4>{gift.title}</h4>
        {gift.description && <p className="gift-card__desc">{gift.description}</p>}
        <p className="gift-card__price">
          {gift.currency === 'EUR' ? '€' : 'R$'} {Number(gift.price).toFixed(2)}
        </p>
        <button
          type="button"
          className="gift-card__btn"
          onClick={() => onAction(gift)}
          disabled={isProcessing}
        >
          {isProcessing ? 'Gerando...' : actionLabel}
        </button>
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

      <div className="giftlist-subsection">
        <h3>Opção Portugal (EUR / MBWay)</h3>
        <div className="gift-card-grid">
          {presentsEur.map((gift) => renderGiftCard(gift, 'Pagar com MBWay', handleMbway))}
        </div>
      </div>

      <div className="giftlist-subsection">
        <h3>Opção Brasil (BRL / PIX)</h3>
        <div className="gift-card-grid">
          {presentsBrl.map((gift) => renderGiftCard(gift, 'Pagar com PIX', handlePix))}
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
    </section>
  );
};

export default GiftlistSection;

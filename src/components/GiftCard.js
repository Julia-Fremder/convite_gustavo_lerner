import './GiftCard.css';

const GiftCard = ({ gift, quantity, disabled, currency, isProcessing, onUpdateQuantity }) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  const isSelected = quantity > 0;
  const totalPrice = Number(gift.price) * quantity;

  return (
    <section
      className={`gift-card ${isSelected ? 'gift-card--selected' : ''} ${disabled ? 'gift-card--disabled' : ''}`}
    >
      <header className="gift-card__header">
      {gift.img && (
        <img src={`${publicUrl}${gift.img}`} alt={gift.title} className="gift-card__img" />
      )}
      </header>
      <div className="gift-card__body">
        <h4>{gift.title}</h4>
        {gift.description && <p className="gift-card__desc">{gift.description}</p>}
      </div>
      <div className="gift-card__footer">
        <p className="gift-card__price">
          {currency === 'EUR' ? '€' : 'R$'} {Number(gift.price).toFixed(2)}
        </p>
        <div className="gift-card__quantity-controls">
          <button
            type="button"
            className="gift-card__quantity-btn"
            onClick={() => onUpdateQuantity(gift, currency, -1)}
            disabled={disabled || isProcessing || quantity === 0}
            title="Diminuir quantidade"
          >
            −
          </button>
          <span className="gift-card__quantity-display">{quantity}</span>
          <button
            type="button"
            className="gift-card__quantity-btn gift-card__quantity-btn--add"
            onClick={() => onUpdateQuantity(gift, currency, 1)}
            disabled={disabled || isProcessing}
            title={disabled ? 'Só é possível selecionar mais de um item de uma mesma lista' : 'Adicionar'}
          >
            +
          </button>
        </div>
      </div>
    </section>
  );
};

export default GiftCard;

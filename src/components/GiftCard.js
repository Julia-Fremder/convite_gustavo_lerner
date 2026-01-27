import './GiftCard.css';

const GiftCard = ({ gift, isSelected, disabled, currency, isProcessing, onToggleSelect }) => {
  return (
    <section
      className={`gift-card ${isSelected ? 'gift-card--selected' : ''} ${disabled ? 'gift-card--disabled' : ''}`}
    >
      <header className="gift-card__header">
      {gift.img && (
        <img src={gift.img} alt={gift.title} className="gift-card__img" />
      )}
      </header>
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
            onChange={() => onToggleSelect(gift, currency)}
            disabled={disabled || isProcessing}
            title={disabled ? 'Só é possível selecionar mais de um item de uma mesma lista' : ''}
          />
        </div>
      </div>
    </section>
  );
};

export default GiftCard;

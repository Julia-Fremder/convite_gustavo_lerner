import { MdClose } from 'react-icons/md';
import './AgeCheckModal.css';

const AgeCheckModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleYes = () => {
    onConfirm(true); // Guest is up to 10 years old
  };

  const handleNo = () => {
    onConfirm(false); // Guest is older than 10
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>ATENÇÃO</h3>
          <button 
            className="modal-close-btn" 
            onClick={() => onClose()}
            title="Fechar"
          >
            <MdClose size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <p>É criança e terá 10 anos ou menos no dia 16/03/26?</p>
        </div>

        <div className="modal-footer">
          <button 
            className="modal-btn modal-btn-secondary"
            onClick={handleNo}
          >
            Não
          </button>
          <button 
            className="modal-btn modal-btn-primary"
            onClick={handleYes}
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeCheckModal;

import React, { useCallback, useEffect } from 'react';
import { MdDelete, MdAdd } from 'react-icons/md';
import useLocalStorage from '../hooks/useLocalStorage';
import useForm from '../hooks/useForm';
import AgeCheckModal from './AgeCheckModal';
import {
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  validateForm,
} from '../utils/formHelpers';

const AnswerForm = ({ plateOptions = [] }) => {
  const [storedMainName, setStoredMainName] = useLocalStorage('answerForm_mainName', '');
  const [storedGuests, setStoredGuests] = useLocalStorage('answerForm_guests', [
    { id: 1, name: '', plate: '', isChild: false }
  ]);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState('');
  const [draggedId, setDraggedId] = React.useState(null);
  const [showAgeModal, setShowAgeModal] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const form = useForm({
    mainName: storedMainName,
    guests: storedGuests,
  });

  const { mainName, guests } = form.values;

  // Sync form values to localStorage
  useEffect(() => {
    setStoredMainName(mainName);
    setStoredGuests(guests);
  }, [mainName, guests, setStoredMainName, setStoredGuests]);

  const handleMainNameChange = useCallback((e) => {
    const name = e.target.value;
    // Update main name through form
    form.handleChange(e);
    // Update first guest name if it hasn't been customized
    if (guests.length > 0 && (guests[0].name === '' || guests[0].name === mainName)) {
      const updatedGuests = [...guests];
      updatedGuests[0].name = name;
      form.setFieldValue('guests', updatedGuests);
    }
  }, [mainName, guests, form]);

  const handleGuestChange = useCallback((id, field, value) => {
    const updatedGuests = guests.map(guest =>
      guest.id === id ? { ...guest, [field]: value } : guest
    );
    form.setFieldValue('guests', updatedGuests);
  }, [guests, form]);

  const openAgeCheckModal = () => {
    setShowAgeModal(true);
  };

  const handleAgeCheckConfirm = useCallback((isUnder10) => {
    const newId = guests.length;
    const updatedGuests = [...guests, { id: newId, name: '', plate: '', isChild: isUnder10 }];
    form.setFieldValue('guests', updatedGuests);
    setShowAgeModal(false);
  }, [guests, form]);

  const addGuest = () => {
    openAgeCheckModal();
  };

  const removeGuest = (id) => {
    const updatedGuests = guests.filter(guest => guest.id !== id);
    form.setFieldValue('guests', updatedGuests);
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    const { mainName: name, guests: guestsList } = form.values;
    const validation = validateForm(name, guestsList);

    if (!validation.isValid) {
      form.setFieldError('mainName', validation.error);
      setMessageType('error');
      setMessage(validation.error);
      return;
    }

    setMessage('');
    setMessageType('');
    setShowConfirmModal(true);
  };

  const onSubmit = async (values) => {
    const { mainName: name, guests: guestsList } = values;
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
    
    const validation = validateForm(name, guestsList);
    if (!validation.isValid) {
      form.setFieldError('mainName', validation.error);
      setMessageType('error');
      setMessage(validation.error);
      return;
    }

    setMessage('');

    try {
      const responses = await Promise.all(
        guestsList.map((guest) => {
          const price = guest.isChild ? 'child' : 'adult';
          return fetch(`${apiBaseUrl}/api/save-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Name: name,
              Guest: guest.name,
              PlateOption: guest.plate,
              Price: price,
            }),
          }).then((response) => response.json());
        })
      );

      const hasError = responses.some((result) => !result.success);
      if (hasError) {
        const errorResult = responses.find((result) => !result.success);
        setMessageType('error');
        setMessage(`Erro ao salvar: ${errorResult.error}`);
        return;
      }

      setMessageType('success');
      setMessage(`✓ Dados salvos com sucesso! ${guestsList.length} convidado(s) registrado(s).`);

      const clearedGuests = [{ id: 1, name: '', plate: '', isChild: false }];
      form.setValues({ mainName: '', guests: clearedGuests });
      setStoredMainName('');
      setStoredGuests(clearedGuests);
    } catch (error) {
      setMessageType('error');
      setMessage(`Erro de conexão: ${error.message}`);
      console.error('Error:', error);
    }
  };

  return (
    <section className="answer-form-section">
      <div className="form-container guests-form">
        <h3>Confirme sua presença</h3>
        <p>Preencha os dados dos convidados</p>
        
        <form onSubmit={handleOpenConfirm}>
          <div className="form-group">
            <label htmlFor="mainName">Nome{' '}<span className="required">*</span></label>
            <input
              id="mainName"
              name="mainName"
              type="text"
              value={mainName}
              onChange={handleMainNameChange}
              placeholder="Seu nome"
              required
              disabled={form.isSubmitting}
              className="form-input"
            />
          </div>

          <div className="guests-section">
            <h4>Escolha uma opção para cada convidado:</h4>
            
            {guests.map((guest, index) => (
              <div 
                key={guest.id} 
                className={`guest-item ${draggedId === guest.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, guest.id, setDraggedId)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, draggedId, guest.id, guests, setStoredGuests, setDraggedId)}
                onDragEnd={() => handleDragEnd(setDraggedId)}
              >
                <div className="guest-number">Convidado {index + 1}</div>
                
                <div className="guest-form-row">
                  <div className="guest-form-group name-group">
                    <label htmlFor={`guest-name-${guest.id}`}>
                      {guest.isChild
                        ? 'Nome da criança com menos de 10 anos'
                        : 'Nome'}{' '}
                      <span className="required">*</span>
                    </label>
                    <input
                      id={`guest-name-${guest.id}`}
                      type="text"
                      value={guest.name}
                      onChange={(e) => handleGuestChange(guest.id, 'name', e.target.value)}
                      placeholder="Nome do convidado"
                      required
                      disabled={form.isSubmitting}
                      className="form-input"
                    />
                  </div>

                  <div className="guest-form-group plate-group">
                    <label htmlFor={`guest-plate-${guest.id}`}>Prato <span className="required">*</span></label>
                    <select
                      id={`guest-plate-${guest.id}`}
                      value={guest.plate}
                      onChange={(e) => handleGuestChange(guest.id, 'plate', e.target.value)}
                      required
                      disabled={form.isSubmitting}
                      className="form-select"
                    >
                      <option value="">-- Selecione um prato --</option>
                      {plateOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeGuest(guest.id)}
                    disabled={form.isSubmitting}
                    className="icon-button trash-button"
                    title="Remover convidado"
                  >
                    <MdDelete size={24} />
                  </button>

                  <button
                    type="button"
                    onClick={addGuest}
                    disabled={form.isSubmitting}
                    className="icon-button add-button"
                    title="Adicionar convidado"
                  >
                    <MdAdd size={24} />
                  </button>
                </div>
              </div>
            ))}

            {guests.length === 0 && (
              <div className="add-guest-section">
                <span className="add-guest-label">Adicione um convidado</span>
                <button
                  type="button"
                  onClick={addGuest}
                  disabled={form.isSubmitting}
                  className="icon-button add-guest-plus"
                  title="Adicionar convidado"
                >
                  <MdAdd size={24} />
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={form.isSubmitting}
            className="submit-button"
          >
            {form.isSubmitting ? 'Salvando...' : 'Enviar'}
          </button>
        </form>

        {message && (
          <div className={`message message-${messageType}`}>
            {message}
          </div>
        )}
      </div>

      <AgeCheckModal 
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onConfirm={handleAgeCheckConfirm}
      />

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h4>Confirmar envio</h4>
            <p><strong>Nome:</strong> {mainName}</p>
            <div className="confirm-guests">
              <strong>Convidados:</strong>
              <ul>
                {guests.map((guest, idx) => (
                  <li key={guest.id}>
                    #{idx + 1} {guest.name || '(sem nome)'} — {guest.plate || 'sem prato'} {guest.isChild ? '(criança)' : ''}
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-button secondary" onClick={() => setShowConfirmModal(false)}>
                Continuar editando
              </button>
              <button
                type="button"
                className="modal-button primary"
                onClick={() => {
                  setShowConfirmModal(false);
                  const submit = form.handleSubmit(onSubmit);
                  submit({ preventDefault: () => {} });
                }}
                disabled={form.isSubmitting}
              >
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AnswerForm;

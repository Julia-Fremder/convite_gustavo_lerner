import React, { useCallback, useEffect, useState } from 'react';
import { MdDelete, MdAdd, MdClose } from 'react-icons/md';
import useLocalStorage from '../hooks/useLocalStorage';
import useForm from '../hooks/useForm';
import './AnswerForm.css';
import '../components/Modal.css';
import AgeCheckModal from './AgeCheckModal';
import { validateForm } from '../utils/formHelpers';
import { confirmationAPI } from '../services/apiClient';

const AnswerForm = ({ plateOptions = [] }) => {
  const [storedEmail, setStoredEmail] = useLocalStorage();
  const [lastSubmission, setLastSubmission] = useState(null);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState('');
  const [showAgeModal, setShowAgeModal] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const form = useForm({
    mainEmail: storedEmail,
    guests: [{ id: 1, name: '', plate: 'peixe', isChild: false }],
  });

  const { mainEmail, guests } = form.values;

  const findPlateLabel = useCallback(
    (plateValue) => plateOptions.find((opt) => opt.value === plateValue)?.label || plateValue,
    [plateOptions]
  );

  // Sync email to localStorage when it changes
  useEffect(() => {
    setStoredEmail(mainEmail);
    // Clear last submission if email is empty
    if (!mainEmail || !mainEmail.trim()) {
      setLastSubmission(null);
    }
  }, [mainEmail, setStoredEmail]);

  // Auto-clear success message after 1 minute
  useEffect(() => {
    if (messageType === 'success') {
      const timer = window.setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 60000);
      return () => window.clearTimeout(timer);
    }
  }, [messageType]);

  const handleEmailBlur = useCallback(async () => {
    const email = form.values.mainEmail?.trim();
    
    // Only fetch if email is valid
    if (!email || !email.includes('@')) {
      setLastSubmission(null);
      return;
    }

    try {
      const data = await confirmationAPI.getByEmail(email);
      if (data?.success && data.confirmations.length > 0) {
        const mappedGuests = data.confirmations.map((guest, index) => ({
          id: index,
          name: guest.guest,
          plate: guest.plate_option,
          isChild: guest.price === 'child',
        }));
        setLastSubmission({
          email,
          guests: mappedGuests,
          timestamp: data.timestamp || data.confirmations[0]?.submitted_at || new Date().toISOString(),
        });
      } else {
        setLastSubmission(null);
      }
    } catch (_error) {
      // Silently fail - no need to show error for fetching previous submissions
      setLastSubmission(null);
    }
  }, [form.values.mainEmail]);

  const handleEmailChange = useCallback((e) => {
    if (hasSubmitted) setHasSubmitted(false);
    form.handleChange(e);
  }, [form, hasSubmitted]);

  const handleClearEmail = useCallback(() => {
    form.setFieldValue('mainEmail', '');
    setLastSubmission(null);
    if (hasSubmitted) setHasSubmitted(false);
  }, [form, hasSubmitted]);

  const handleGuestChange = useCallback((id, field, value) => {
    if (hasSubmitted) setHasSubmitted(false);
    const updatedGuests = guests.map(guest =>
      guest.id === id ? { ...guest, [field]: value } : guest
    );
    form.setFieldValue('guests', updatedGuests);
  }, [guests, form, hasSubmitted]);

  const openAgeCheckModal = () => {
    setShowAgeModal(true);
  };

  const handleAgeCheckConfirm = useCallback((isUnder10) => {
    const newId = guests.length > 0 ? guests.length : 1;
    const updatedGuests = [...guests, { id: newId, name: '', plate: 'peixe', isChild: isUnder10 }];
    form.setFieldValue('guests', updatedGuests);
    setShowAgeModal(false);
    if (hasSubmitted) setHasSubmitted(false);
  }, [guests, form, hasSubmitted]);

  const addGuest = () => {
    if (hasSubmitted) setHasSubmitted(false);
    openAgeCheckModal();
  };

  const removeGuest = (id) => {
    if (hasSubmitted) setHasSubmitted(false);
    const updatedGuests = guests.filter(guest => guest.id !== id);
    form.setFieldValue('guests', updatedGuests);
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    const { mainEmail: email, guests: guestsList } = form.values;
    const validation = validateForm(email, guestsList);

    if (!validation.isValid) {
      form.setFieldError('mainEmail', validation.error);
      setMessageType('error');
      setMessage(validation.error);
      return;
    }

    setMessage('');
    setMessageType('');
    setShowConfirmModal(true);
  };

  const onSubmit = async (values) => {
    const { mainEmail: email, guests: guestsList } = values;
    
    const validation = validateForm(email, guestsList);
    if (!validation.isValid) {
      form.setFieldError('mainEmail', validation.error);
      setMessageType('error');
      setMessage(validation.error);
      return;
    }

    setMessage('');

    try {
      const responses = await Promise.all(
        guestsList.map((guest) => {
          const price = guest.isChild ? 'child' : 'adult';
          return confirmationAPI.post({
              Email: email,
              Name: guest.name,
              PlateOption: guest.plate,
              Price: price,
          })
        })
      );

      const hasError = responses.some((result) => !result.success);
      if (hasError) {
        const errorResult = responses.find((result) => !result.success);
        setMessageType('error');
        setMessage(`Erro ao salvar: ${errorResult.error}`);
        return;
      }

      const submitTimestamp = responses[0]?.timestamp || new Date().toISOString();

      setMessageType('success');
      setMessage(`✓ Dados salvos com sucesso! ${guestsList.length} convidado(s) registrado(s).`);

      const clearedGuests = [{ id: 1, name: '', plate: 'peixe', isChild: false }];
      form.setValues({ mainEmail: email, guests: clearedGuests });
      setHasSubmitted(true);

      const data = await confirmationAPI.getByEmail(email);
      if (data.confirmations.length > 0) {
        const mappedGuests = data.confirmations.map((guest, index) => ({
          id: index + 1,
          name: guest.name,
          plate: guest.plate_option,
          isChild: guest.price === 'child',
        }));
        setLastSubmission({
          email,
          guests: mappedGuests,
          timestamp: data.timestamp || submitTimestamp,
        });
      } else {
        setLastSubmission({ email, guests: guestsList, timestamp: submitTimestamp });
      }
    } catch (error) {
      setMessageType('error');
      setMessage(`Erro de conexão: ${error.message}`);
      console.error('Error:', error);
    }
  };

  return (
    <section className="answer-form-section">
      <div className="form-container guests-form">
        <h3>Selecione sua opção para o almoço</h3>
        <p>Preencha os dados dos convidados</p>
        
        <form onSubmit={handleOpenConfirm}>
          <div className="form-group">
            <label htmlFor="mainEmail">Email <span className="required">*</span></label>
            <div className="input-with-icon">
              <input
                id="mainEmail"
                name="mainEmail"
                type="email"
                value={mainEmail}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="seu@email.com"
                required
                disabled={form.isSubmitting}
                className="form-input"
              />
              {mainEmail && (
                <button
                  type="button"
                  onClick={handleClearEmail}
                  className="clear-input-button"
                  title="Limpar email"
                  disabled={form.isSubmitting}
                >
                  <MdClose size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="guests-section">
            <h4>Escolha uma opção para cada convidado:</h4>
            
            {guests.map((guest, index) => (
              <div 
                key={guest.id} 
                className="guest-item"
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
                      value={guest.plate || 'peixe'}
                      onChange={(e) => {
                        handleGuestChange(guest.id, 'plate', e.target.value)
                      }}
                      required
                      disabled={form.isSubmitting}
                      className="form-select"
                    >
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

        {lastSubmission && (
          <div className="last-submission-section">
            <p className="last-submission-title">Última resposta submetida</p>
            <p className="last-submission-date">
              {new Date(lastSubmission.timestamp).toLocaleString('pt-BR')}
            </p>
            <div className="last-submission-details">
              <p><strong>{lastSubmission.email || lastSubmission.name}</strong></p>
              <ul>
                {lastSubmission.guests.map((guest, idx) => (
                  <li key={idx}>
                    {guest.name} — {findPlateLabel(guest.plate)} {guest.isChild ? '(criança)' : '(adulto)'}
                  </li>
                ))}
              </ul>
            </div>
            <p className="submission-note">
              *No caso de múltiplas respostas salvas será considerada a mais recente.
            </p>
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
            <p><strong>Email:</strong> {mainEmail}</p>
            <div className="confirm-guests">
              <strong>Convidados:</strong>
              <ul>
                {guests.map((guest, idx) => (
                  <li key={guest.id}>
                    #{idx + 1} {guest.name || '(sem nome)'} — {findPlateLabel(guest.plate)} {guest.isChild ? '(criança)' : ''}
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

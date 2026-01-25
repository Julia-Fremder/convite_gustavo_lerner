import React, { useCallback, useEffect, useState } from 'react';
import { MdDelete, MdAdd } from 'react-icons/md';
import useLocalStorage from '../hooks/useLocalStorage';
import useForm from '../hooks/useForm';
import AgeCheckModal from './AgeCheckModal';
import './AnswerForm.css';
import '../components/Modal.css';
import {
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  validateForm,
} from '../utils/formHelpers';

const AnswerForm = ({ plateOptions = [] }) => {
  const [storedEmail, setStoredEmail] = useLocalStorage('answerForm_email', '');
  const [storedGuests, setStoredGuests] = useLocalStorage('answerForm_guests', [
    { id: 1, name: '', plate: 'peixe', isChild: false }
  ]);
  const [lastSubmission, setLastSubmission] = useLocalStorage('answerForm_lastSubmission', null);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState('');
  const [draggedId, setDraggedId] = React.useState(null);
  const [showAgeModal, setShowAgeModal] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const form = useForm({
    mainEmail: storedEmail,
    guests: storedGuests,
  });

  const { mainEmail, guests } = form.values;

  const findPlateLabel = useCallback(
    (plateValue) => plateOptions.find((opt) => opt.value === plateValue)?.label || plateValue || 'sem prato',
    [plateOptions]
  );

  // Sync form values to localStorage
  useEffect(() => {
    setStoredEmail(mainEmail);
    if (!hasSubmitted) {
      setStoredGuests(guests);
    }
  }, [hasSubmitted, mainEmail, guests, setStoredEmail, setStoredGuests]);

  // Normalize guests: default plate to 'peixe' if missing so the dropdown is preselected
  useEffect(() => {
    const needsDefault = guests.some((guest) => !guest.plate);
    if (needsDefault) {
      const updated = guests.map((guest) =>
        guest.plate ? guest : { ...guest, plate: 'peixe' }
      );
      form.setFieldValue('guests', updated);
    }
  }, [guests, form]);

  // Auto-clear success message after 1 minute
  useEffect(() => {
    if (messageType === 'success') {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 60000); // 1 minute
      return () => clearTimeout(timer);
    }
  }, [messageType]);

  useEffect(() => {
    const email = form.values.mainEmail?.trim();
    if (!email) return;

    const controller = new AbortController();
    const fetchLatest = async () => {
      try {
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
        const params = new URLSearchParams({ email });
        const response = await fetch(`${apiBaseUrl}/api/confirmations?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (data?.success && Array.isArray(data.confirmations)) {
          const mappedGuests = data.confirmations.map((row) => ({
            name: row.guest,
            plate: row.plate_option,
            isChild: row.price === 'child',
          }));
          setLastSubmission({
            email,
            guests: mappedGuests,
            timestamp: data.timestamp || data.confirmations[0]?.submitted_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        // ignore fetch errors
      }
    };

    fetchLatest();
    return () => controller.abort();
  }, [form.values.mainEmail, setLastSubmission]);

  const handleEmailChange = useCallback((e) => {
    if (hasSubmitted) setHasSubmitted(false);
    form.handleChange(e);
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
    const newId = guests.length;
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
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
    
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
          return fetch(`${apiBaseUrl}/api/save-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Email: email,
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

      const submitTimestamp = responses[0]?.timestamp || new Date().toISOString();

      setMessageType('success');
      setMessage(`✓ Dados salvos com sucesso! ${guestsList.length} convidado(s) registrado(s).`);

      const clearedGuests = [{ id: 1, name: '', plate: 'peixe', isChild: false }];
      form.setValues({ mainEmail: email, guests: clearedGuests });
      setStoredEmail(email);
      setStoredGuests(clearedGuests);
      setHasSubmitted(true);

      const params = new URLSearchParams({ email, timestamp: submitTimestamp });
      const response = await fetch(`${apiBaseUrl}/api/confirmations?${params.toString()}`);
      const data = await response.json();
      if (data?.success && Array.isArray(data.confirmations)) {
        const mappedGuests = data.confirmations.map((row) => ({
          name: row.guest,
          plate: row.plate_option,
          isChild: row.price === 'child',
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
            <input
              id="mainEmail"
              name="mainEmail"
              type="email"
              value={mainEmail}
              onChange={handleEmailChange}
              placeholder="seu@email.com"
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
                onDrop={(e) => {
                  if (hasSubmitted) setHasSubmitted(false);
                  handleDrop(e, draggedId, guest.id, guests, setStoredGuests, setDraggedId);
                }}
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

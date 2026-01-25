import React, { useCallback, useState } from 'react';
import { MdContentCopy } from 'react-icons/md';

const InfoSection = () => {
  const [copyStatus, setCopyStatus] = useState({ message: '', isError: false });

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ message: 'Copiado!', isError: false });
      setTimeout(() => setCopyStatus({ message: '', isError: false }), 2000);
    } catch (err) {
      setCopyStatus({ message: 'Erro ao copiar', isError: true });
      setTimeout(() => setCopyStatus({ message: '', isError: false }), 2000);
    }
  }, []);

  const now = new Date();
  const dtStamp = `${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Convite//Events//PT',
    'BEGIN:VEVENT',
    `UID:convite-20260316-${now.getTime()}@example.com`,
    `DTSTAMP:${dtStamp}`,
    'DTSTART:20260316T103000',
    'DTEND:20260316T193000',
    'SUMMARY:Bar Mitzvah e Casamento',
    'LOCATION:Sinagoga de Tomar',
    'DESCRIPTION:Bar Mitzvah e celebração - Sinagoga de Tomar / Quinta da Colina Verde',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  const icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  return (
    <section className="info-section">
      <div className="event-details">
        <p><strong>16 de março de 2026 - 10:30</strong></p>
        <p><strong>Bar Mitzvah: </strong>Sinagoga de Tomar</p>
        <p><strong>Comemoração e casamento: </strong>Quinta da Colina Verde</p>
      </div>
      <div style={{ margin: '16px 0' }}>
        <a
          href={icsDataUri}
          download="evento-2026-03-16.ics"
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            borderRadius: '8px',
            background: '#4caf50',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
            boxShadow: '0 4px 10px rgba(76, 175, 80, 0.25)',
          }}
        >
          Adicionar ao calendário
        </a>
      </div>
      <p className="transport-note">
        Organizaremos transporte para quem precisar, preencha sua
        necessidade no formulário de confirmação de presença.
      </p>
      <div className="map-container" style={{ textAlign: 'left' }}>
        <h4>Localizações</h4>
        <div style={{ marginBottom: '14px' }}>
          <p style={{ margin: '0 0 6px 0' }}><strong>Sinagoga de Tomar</strong></p>
          <p style={{ margin: '0 0 6px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            R. Dr. Joaquim Jacinto 73, 2300-577 Tomar, Portugal
            <button
              type="button"
              onClick={() => handleCopy('R. Dr. Joaquim Jacinto 73, 2300-577 Tomar, Portugal')}
              style={{
                border: '1px solid #ddd',
                background: '#f7f7f7',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              aria-label="Copiar endereço da Sinagoga"
            >
              <MdContentCopy size={16} /> Copiar
            </button>
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="https://www.google.com/maps/search/?api=1&query=Sinagoga+de+Tomar" target="_blank" rel="noreferrer" className="invite-link">Abrir no Google Maps</a>
            <a href="https://waze.com/ul?q=Sinagoga%20de%20Tomar" target="_blank" rel="noreferrer" className="invite-link">Abrir no Waze</a>
          </div>
        </div>
        <div>
          <p style={{ margin: '0 0 6px 0' }}><strong>Quinta da Colina Verde</strong></p>
          <p style={{ margin: '0 0 6px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            Quinta da Colina Verde, Portugal
            <button
              type="button"
              onClick={() => handleCopy('Quinta da Colina Verde, Portugal')}
              style={{
                border: '1px solid #ddd',
                background: '#f7f7f7',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              aria-label="Copiar endereço da Quinta"
            >
              <MdContentCopy size={16} /> Copiar
            </button>
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="https://www.google.com/maps/search/?api=1&query=Quinta+da+Colina+Verde" target="_blank" rel="noreferrer" className="invite-link">Abrir no Google Maps</a>
            <a href="https://waze.com/ul?q=Quinta%20da%20Colina%20Verde%20Portugal" target="_blank" rel="noreferrer" className="invite-link">Abrir no Waze</a>
          </div>
        </div>
        {copyStatus.message && (
          <p
            style={{
              marginTop: '10px',
              color: copyStatus.isError ? '#d32f2f' : '#4caf50',
              fontWeight: 600,
            }}
          >
            {copyStatus.message}
          </p>
        )}
      </div>
    </section>
  );
}

export default InfoSection;

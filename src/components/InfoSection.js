/* global setTimeout */

import { useCallback, useState } from 'react';
import { MdContentCopy, MdOutlineEvent } from 'react-icons/md';
import useNavigator from '../hooks/useNavigator';
import './InfoSection.css';

const InfoSection = () => {
  const { handleCopy, copyStatus } = useNavigator();

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
        <p className="date-row">
          <strong>16 de março de 2026 - 10:30</strong>
          <a
            href={icsDataUri}
            download="evento-2026-03-16.ics"
            className="calendar-action"
            aria-label="Adicionar ao calendário"
            title="Adicionar ao calendário"
          >
            <MdOutlineEvent size={18} aria-hidden="true" />
          </a>
        </p>
        <p><strong>Bar Mitzvah: </strong>Sinagoga de Tomar</p>
        <p><strong>Comemoração e casamento: </strong>Quinta da Colina Verde</p>
      </div>
      <p className="transport-note">
        Organizaremos transporte para quem precisar, preencha sua
        necessidade no formulário de confirmação de presença.
      </p>
      <div className="map-container">
        <h4>Localizações</h4>
        <div className="location-block">
          <h5 className="location-heading"><strong>Sinagoga de Tomar</strong></h5>
          <p className="address-line">
            R. Dr. Joaquim Jacinto 73, 2300-577 Tomar, Portugal
            <button
              type="button"
              onClick={() => handleCopy('R. Dr. Joaquim Jacinto 73, 2300-577 Tomar, Portugal')}
              className="copy-button"
              aria-label="Copiar endereço da Sinagoga"
            >
              <MdContentCopy size={16} /> Copiar
            </button>
          </p>
          <div className="links-row">
            <a href="https://www.google.com/maps/search/?api=1&query=Sinagoga+de+Tomar" target="_blank" rel="noreferrer" className="invite-link">Abrir no Google Maps</a>
            <a href="https://waze.com/ul?q=Sinagoga%20de%20Tomar" target="_blank" rel="noreferrer" className="invite-link">Abrir no Waze</a>
          </div>
        </div>
        <div>
          <p className="location-heading"><strong>Quinta da Colina Verde</strong></p>
          <p className="address-line">
            Quinta da Colina Verde, Portugal
            <button
              type="button"
              onClick={() => handleCopy('Quinta da Colina Verde, Portugal')}
              className="copy-button"
              aria-label="Copiar endereço da Quinta"
            >
              <MdContentCopy size={16} /> Copiar
            </button>
          </p>
          <div className="links-row">
            <a href="https://www.google.com/maps/search/?api=1&query=Quinta+da+Colina+Verde" target="_blank" rel="noreferrer" className="invite-link">Abrir no Google Maps</a>
            <a href="https://waze.com/ul?q=Quinta%20da%20Colina%20Verde%20Portugal" target="_blank" rel="noreferrer" className="invite-link">Abrir no Waze</a>
          </div>
        </div>
        {copyStatus.message && (
          <p className={`copy-status ${copyStatus.isError ? 'is-error' : 'is-success'}`}>
            {copyStatus.message}
          </p>
        )}
      </div>
    </section>
  );
}

export default InfoSection;

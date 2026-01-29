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
        <h3>Informações</h3>
        <div className="date-row">
          <p style={{fontSize: '20px'}}>16 de março de 2026 - 10:30</p>
          <a
            href={icsDataUri}
            download="evento-2026-03-16.ics"
            className="calendar-action"
            aria-label="Adicionar ao calendário"
            title="Adicionar ao calendário"
          >
            <MdOutlineEvent size={18} aria-hidden="true" />
          </a>
        </div>
      <div className="map-container">
        <div className="location-block">
          <h4 className="location-heading">Sinagoga de Tomar</h4>
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
        <div>
          <h4 className="location-heading">Quinta da Colina Verde</h4>
          <p className="address-line">
            Rua Casal de Além 98, 2435-489 Olival, Portugal
            <button
              type="button"
              onClick={() => handleCopy('Rua Casal de Além 98, 2435-489 Olival, Portugal')}
              className="copy-button"
              aria-label="Copiar endereço da Quinta"
            >
              <MdContentCopy size={16} /> Copiar
            </button>
          </p>
        </div>
        <p style={{fontSize: '16px'}}>Para ir conosco de autocarro manda mensagem direta pelo whatsapp</p>
        </div>
        {copyStatus.message && (
          <p className={`copy-status ${copyStatus.isError ? 'is-error' : 'is-success'}`}>
            {copyStatus.message}
          </p>
        )}
      </div>
      </div>

    </section>
  );
}

export default InfoSection;

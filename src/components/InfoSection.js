import React from 'react';

const InfoSection = () => {
  return (
    <section className="info-section">
      <div className="event-details">
        <p><strong>16 de março de 2026 - 10:30</strong></p>
        <p><strong>Bar Mitzvah: </strong>Sinagoga de Tomar</p>
        <p><strong>Comemoração e casamento: </strong>Quinta da Colina Verde</p>
      </div>
      <p className="transport-note">
        Organizaremos transporte para quem precisar, preencha sua
        necessidade no formulário de confirmação de presença.
      </p>
      <div className="map-container">
        <h4>Sinagoga</h4>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3092.9869640810147!2d-8.419265423474018!3d39.60576680349213!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd18b1b13a24487d%3A0x9c90c6f64f47ed72!2sSinagoga%20de%20Tomar!5e0!3m2!1spt-PT!2spt!4v1729364173668!5m2!1spt-PT!2spt"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Sinagoga de Tomar"
        ></iframe>
      </div>
    </section>
  );
}

export default InfoSection;

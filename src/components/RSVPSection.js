import React from 'react';

const RSVPSection = () => {
  return (
    <section className="rsvp-section">
      <p>Confirme sua presença</p>
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSfVt8sdZf724AebWNagiQrXqxvzBu-2YNDnzgTeY8AvVx3b9A/viewform?embedded=true"
        width="640"
        height="806"
        title="RSVP Form"
      >
        Carregando…
      </iframe>
    </section>
  );
}

export default RSVPSection;

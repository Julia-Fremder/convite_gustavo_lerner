import React from 'react';

const InviteSection = ({ title, name, img }) => {
  return (
    <section className="invite-section">
      <p>{title}</p>
      <h2>{name}</h2>
      <img 
        src={img.src} 
        alt={img.alt}
        className="invite_gif"
      />
    </section>
  );
}

export default InviteSection;

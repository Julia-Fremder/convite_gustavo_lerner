

const InviteSection = ({ title, name, img }) => {
  const imgSrc = (img?.src || '').startsWith('/')
    ? `${process.env.PUBLIC_URL || ''}${img.src}`
    : img?.src;
  return (
    <section className="invite-section">
      <p>{title}</p>
      <h2>{name}</h2>
      <img 
        src={imgSrc} 
        alt={img.alt}
        className="invite_gif"
      />
    </section>
  );
}

export default InviteSection;



const InviteSection = ({ title, name, img }) => {
  const publicUrl = process.env.PUBLIC_URL || '';
  return (
    <section className="invite-section">
      <p>{title}</p>
      <h2>{name}</h2>
      <img 
        src={`${publicUrl}${img.src}`} 
        alt={img.alt}
        className="invite_gif"
      />
    </section>
  );
}

export default InviteSection;

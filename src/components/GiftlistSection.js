import React from 'react';

const GiftlistSection = () => {
  return (
    <section className="giftlist-section">
      <h3>Presentes</h3>
      <p>Não é preciso se preocupar com isso!</p>
      <p>Mas sabemos que muitos vão querer nos presentear na mesma.</p>
      <p>Enquanto não conseguimos montar uma lista virtual bonitinha, deixamos aqui duas possibilidades.</p>
      <p><strong>Lembrem de deixar uma msg no detalhe do pix ou mbWay!!!</strong></p>
      <p>Ou enviem mensagem para mensagens.2026.03.16@gmail.com</p>
      
      <div className="giftlist-subsection">
        <h3>Opção Brasil</h3>
        <p>Pix para:</p>
        <p>04355073700</p>
        <p>Julia Fremder</p>
      </div>
      
      <div className="giftlist-subsection">
        <h3>Opção Portugal</h3>
        <p>MbWay para:</p>
        <p>911191515</p>
        <p>Fabio Lerner ou Julia Fremder</p>
      </div>
      
      <img 
        src="/assets/images/obrigado.gif" 
        alt="obrigado"
      />
    </section>
  );
}

export default GiftlistSection;

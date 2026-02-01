import { useState, useEffect, useCallback } from 'react';
import './App.css';
import InviteSection from './components/InviteSection';
import InfoSection from './components/InfoSection';
import CarouselSection from './components/CarouselSection';
import AnswerForm from './components/AnswerForm';
import GiftlistSection from './components/GiftlistSection';
import PaymentsPage from './page/PaymentsPage';
import { contentAPI } from './services/apiClient';

const App = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const isPaymentsRoute = window.location.pathname === '/payments';

  const getContent = useCallback(async () =>
    contentAPI.fetch()
      .then(result => {
        setContent(result);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading JSON:', error);
        setLoading(false);
      }), []);

  useEffect(() => {
    if (!isPaymentsRoute) {
      getContent();
    }
  }, [getContent, isPaymentsRoute]);

  if (isPaymentsRoute) {
    return (
      <div className="container">
        <PaymentsPage />
      </div>
    );
  }

  if (loading) {
    return <div className="container"><p>Carregando...</p></div>;
  }

  if (!content) {
    return <div className="container"><p>Erro ao carregar o conteúdo</p></div>;
  }

  const publicUrl = process.env.PUBLIC_URL || '';

  return (
    <div className="container">
      <InviteSection
        title={content.invite_bm_title}
        name={content.invite_bm_name}
        img={content.invite_bm_img}
      />

      <img
        src={`${publicUrl}${content.invite_divider.src}`}
        alt={content.invite_divider.alt}
        className="invite-divider"
      />

      <InviteSection
        title={content.invite_wd_title}
        name={content.invite_wd_name}
        img={content.invite_wd_img}
      />

      <InfoSection />

      <AnswerForm plateOptions={content.plate_options || []} />

      <GiftlistSection />

      <CarouselSection
        videosTitle={content.videos_title}
        photosTitle={content.photos_title}
        videos={content.video_gallery}
        photos={content.photo_gallery}
      />
    </div>
  );
}

export default App;

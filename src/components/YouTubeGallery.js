import React, { useCallback, useEffect } from 'react';

const YouTubeGallery = ({youtubeLinks}) => {
  const getYouTubeId = useCallback((url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }, []);

  return (
    <section className="youtube-gallery-section">
      <div className="container">
        <div className="youtube-gallery">
          {youtubeLinks && youtubeLinks.map((link, index) => {
            const youtubeId = getYouTubeId(link.url);
            return (
              <iframe
                key={`youtube-${index}`}
                width="300"
                height="250"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={link.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
                style={{ borderRadius: '8px' }}
              ></iframe>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default YouTubeGallery;

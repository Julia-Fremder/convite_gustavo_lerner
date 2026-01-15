import React from 'react';
import YouTubeGallery from './YouTubeGallery';

const CarouselSection = ({ videosTitle, photosTitle, videos, photos, youtubeLinks }) => {
    return (
        <section className="carousel-section">
            <div className="container">
                <h2>{videosTitle}</h2>
                <div className="video-gallery">
                    {videos && videos.map(video => (
                        <video
                            key={video.id}
                            id={video.id}
                            src={video.src}
                            muted
                            controls
                            type="video/mp4"
                            width="300"
                        />
                    ))}
                </div>

                <YouTubeGallery
                    youtubeLinks={youtubeLinks}
                />

                <h2>{photosTitle}</h2>
                <div className="photo-gallery">
                    {photos && photos.map(photo => (
                        <div key={photo.id} className="img-container">
                            <img
                                src={photo.src}
                                id={photo.id}
                                alt={photo.alt}
                                width="200"
                            />
                            <span className="img-caption">
                                {photo.id.substring(0, 4)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default CarouselSection;

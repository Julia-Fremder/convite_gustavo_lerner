let content;
fetch('content.json')
    .then(response => response.json())
    .then(result => {
        content = result;
        document.getElementById('invite_bm_title').innerHTML = content.invite_bm_title;
        document.getElementById('invite_bm_name').innerHTML = content.invite_bm_name;
        document.getElementById('invite_wd_title').innerHTML = content.invite_wd_title;
        document.getElementById('invite_wd_name').innerHTML = content.invite_wd_name;
        document.getElementById('videos_title').innerHTML = content.videos_title;
        document.getElementById('photos_title').innerHTML = content.photos_title;
        Object.keys(content.invite_bm_img).forEach(key => document.getElementById('invite_bm_img').setAttribute(key, content.invite_bm_img[key]));
        Object.keys(content.invite_wd_img).forEach(key => document.getElementById('invite_wd_img').setAttribute(key, content.invite_wd_img[key]));
        Object.keys(content.invite_divider).forEach(key => document.getElementById('invite_divider').setAttribute(key, content.invite_divider[key]));
        const videoGallery = document.getElementById('video_gallery');
        videoGallery.classList.add('video-gallery');
        content.video_gallery.forEach(video => {
            let videoTag = document.createElement('video');
            videoTag.src = video.src;
            videoTag.id = video.id;
            videoTag.controls = true;
            videoTag.type = 'video/mp4';
            videoTag.width = '300';
            videoTag.class = 'video-container';
            videoGallery.appendChild(videoTag);
        });
        const photoGallery = document.getElementById('photo_gallery');
        content.photo_gallery.forEach(photo => {
            let imgDiv = document.createElement('div');
            imgDiv.classList.add('img-container');
            let imgTag = document.createElement('img');
            imgTag.src = photo.src;
            imgTag.id = photo.id;
            imgTag.alt = photo.alt;
            imgTag.width = 200;
            let imgCaption = document.createElement('span');
            imgCaption.classList.add('img-caption');
            imgCaption.innerHTML = `${photo.id.substring(0, 4)}`;
            photoGallery.appendChild(imgDiv);
            imgDiv.appendChild(imgTag);
            imgDiv.appendChild(imgCaption);
        })

    })
    .catch(error => console.error('Error loading JSON:', error));

function onedriveToDirectLink(url) {
    const base64 = btoa(url).replace(/=/g, "");
    return `https://api.onedrive.com/v1.0/shares/u!${base64}/root/content`;
}


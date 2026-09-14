
  document.addEventListener('DOMContentLoaded', function() {
    const audio = new Audio('img/5_6100314901467633627.mp3');
    audio.loop = true;
    audio.volume = 0.5;
    let isPlaying = false;

    document.addEventListener('click', function() {
      if (!isPlaying) {
        audio.play().then(() => {
          isPlaying = true;
        }).catch(() => {});
      }
    });
  });
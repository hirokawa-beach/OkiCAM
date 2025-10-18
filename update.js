function refreshImages() {
  document.querySelectorAll(".img").forEach(img => {
    const baseSrc = img.dataset.base || img.src.split("?")[0];
    img.src = baseSrc + "?t=" + Date.now();
  });
}

setInterval(refreshImages, 10000);
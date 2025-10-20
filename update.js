let refreshInterval = null;

function refreshImages() {
  document.querySelectorAll(".img").forEach(img => {
    const baseSrc = img.dataset.base || img.src.split("?")[0];
    img.src = baseSrc + "?t=" + Date.now();
  });
}

function startAutoUpdate() {
  if (!refreshInterval) {
    refreshInterval = setInterval(refreshImages, 10000);
  }
}

function stopAutoUpdate() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// 初期状態反映
const updateEnabled = localStorage.getItem("updateEnabled") === "true";
if (updateEnabled) startAutoUpdate();

// settings.jsから呼べるようにする
window.startAutoUpdate = startAutoUpdate;
window.stopAutoUpdate = stopAutoUpdate;
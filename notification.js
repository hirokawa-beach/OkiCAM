const btn = document.getElementById("notify-btn");
const container = document.getElementById("notification-container");
const badge = document.getElementById("badge");
const notifySound = new Audio("sound/se_30125.wav");
notifySound.volume = 0.4;

const MAX_SHOW = 3;
let unreadCount = 0;
let counter = 1;

// 設定（settings.js から読み込み）
let userSettings = {
  soundEnabled: true,
};
if (window.loadUserSettings) userSettings = loadUserSettings();

// 通知ボタン押下
btn.addEventListener("click", () => {
  container.classList.toggle("show");
  if (container.classList.contains("show")) {
    unreadCount = 0;
    updateBadge();
  }
});

// バッジ更新
function updateBadge() {
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
    badge.classList.add("active");
  } else {
    badge.classList.remove("active");
  }
}

// 通知追加
function addNotification({ title = "通知", location = "", detail = "", type = "info" } = {}) {
  const note = document.createElement("div");
  note.className = `notification ${type} enter`;
  note.innerHTML = `
    <div class="notification-title">${escapeHtml(title)}</div>
    <div class="notification-location">${escapeHtml(location)}</div>
    <div class="notification-detail">${escapeHtml(detail)}</div>
  `;

  container.prepend(note);
  setTimeout(() => note.classList.remove("enter"), 400);

  const isVisible = container.classList.contains("show");
  if (!isVisible) {
    unreadCount++;
    updateBadge();

    const soundEnabled = localStorage.getItem("soundEnabled") !== "false";
    if (soundEnabled) {
      notifySound.currentTime = 0;
      notifySound.play().catch(() => {});
    }
  }


  const notes = container.querySelectorAll(".notification");
  if (notes.length > MAX_SHOW) {
    const last = notes[notes.length - 1];
    if (!last.classList.contains("fade-out")) {
      last.classList.add("fade-out");
      const onEnd = (e) => {
        if (e.propertyName === "opacity") {
          last.removeEventListener("transitionend", onEnd);
          last.remove();
        }
      };
      last.addEventListener("transitionend", onEnd);
      setTimeout(() => {
        if (document.body.contains(last)) last.remove();
      }, 750);
    }
  }
}

// HTMLエスケープ
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// デモ用
setInterval(() => {
  addNotification({
    title: `変化検知 #${counter++}`,
    location: `沖ノ鳥市中心部`,
    detail: `画像差分が閾値を超過 (${(Math.random()*100).toFixed(1)}%)`,
    type: ["info","warn","error"][Math.floor(Math.random()*3)]
  });
}, 4500);
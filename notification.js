const MAX_NOTIFICATIONS = 5;
const area = document.getElementById('notification-area');

function addNotification({ title, text, level = 'info' }) {
  const div = document.createElement('div');
  div.className = `notification ${level}`;
  div.innerHTML = `
    <div class="notification-title">${title}</div>
    <div class="notification-text">${text}</div>
  `;
  area.prepend(div);

  // 古い通知を削除（フェードアウト）
  if (area.children.length > MAX_NOTIFICATIONS) {
    const old = area.lastElementChild;
    old.classList.add('fade-out');

    // アニメーション終了後に削除
    setTimeout(() => {
      if (old.parentNode) {
        old.remove();
      }
    }, 300); // CSSのtransition時間と合わせる
  }
}

// デモ: 自動通知
let counter = 1;
function generateRandomNotification() {
  const levels = ['info', 'warn', 'error'];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const rate = (Math.random() * 100).toFixed(1);

  addNotification({
    title: `変化検知 #${counter++}`,
    text: `画像差分が閾値を超過 (${rate}%)`,
    level
  });
}

// ページ読み込み後に開始
generateRandomNotification();
setInterval(generateRandomNotification, 5000);
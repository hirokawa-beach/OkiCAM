document.querySelectorAll(".img").forEach(img => {
  img.style.cursor = "zoom-in";
  img.addEventListener("click", () => {
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>OkiCAM画像ビューア</title>
        <style>
          html, body {
            margin: 0;
            height: 100%;
            width: 100%;
            background: #111;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          #close-btn {
            position: fixed;
            top: 20px;
            right: 25px;
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 22px;
            cursor: pointer;
            backdrop-filter: blur(6px);
            transition: background 0.2s ease;
            z-index: 10;
          }
          #close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          img {
            max-width: 100%;
            max-height: 100%;
            cursor: grab;
            user-select: none;
            -webkit-user-drag: none;
            transition: transform 0.1s ease-out;
          }
        </style>
      </head>
      <body>
        <button id="close-btn">✕</button>
        <img src="${img.src}" id="zoomImg">
        <script>
          const img = document.getElementById('zoomImg');
          const closeBtn = document.getElementById('close-btn');
          let scale = 1, posX = 0, posY = 0;
          let isDragging = false;
          let startX = 0, startY = 0;

          // ---- 閉じるボタン ----
          closeBtn.addEventListener('click', () => window.close());

          // ---- ズーム（ホイール）----
          img.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            scale = Math.min(Math.max(0.5, scale + delta), 5);
            updateTransform();
          });

          // ---- ドラッグ（クリック中のみ）----
          img.addEventListener('mousedown', e => {
            e.preventDefault(); // 禁止マーク対策
            isDragging = true;
            startX = e.clientX - posX;
            startY = e.clientY - posY;
            img.style.cursor = 'grabbing';
          });

          window.addEventListener('mouseup', () => {
            isDragging = false;
            img.style.cursor = 'grab';
          });

          window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            posX = e.clientX - startX;
            posY = e.clientY - startY;
            updateTransform();
          });

          // ---- モバイル対応 ----
          img.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
              isDragging = true;
              startX = e.touches[0].clientX - posX;
              startY = e.touches[0].clientY - posY;
            }
          });
          window.addEventListener('touchend', () => (isDragging = false));
          window.addEventListener('touchmove', e => {
            if (!isDragging || e.touches.length !== 1) return;
            posX = e.touches[0].clientX - startX;
            posY = e.touches[0].clientY - startY;
            updateTransform();
          });

          // ---- 共通更新関数 ----
          function updateTransform() {
            img.style.transform = \`translate(\${posX}px, \${posY}px) scale(\${scale})\`;
          }
        <\/script>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
});

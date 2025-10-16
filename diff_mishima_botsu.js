const THRESHOLD = 0;       // 差分率がこの値を超えたら通知
const INTERVAL_MS = 10000;  // 10秒ごとに更新

const PAST_IMG_ORIGINAL_URL = "https://lh3.googleusercontent.com/d/1QOe4iosZPF1D7Tjouoe41ORYsgwX7pkLL";
const PAST_IMG_URL = `https://lh3.googleusercontent.com/d/1QOe4iosZPF1D7Tjouoe41ORYsgwX7pkLL`; 

let lastNotifyTime = 0;
const NOTIFY_COOLDOWN = 60000; // 通知は最低60秒空ける

async function compareWithDriveImage() {
  const nowImg = document.querySelector(".mishima .now .img");
  const diffContainer = document.querySelector(".mishima .diff1");
  const rateEl = document.getElementById("minrate");

  if (!nowImg || !diffContainer) {
    console.error("必要な要素が見つかりません");
    return;
  }

  try {
    const [img1, img2] = await Promise.all([
      loadImage(nowImg.src),
      loadImage(PAST_IMG_URL)
    ]);

    const width = Math.min(img1.width, img2.width);
    const height = Math.min(img1.height, img2.height);

    // 差分描画Canvasを作り直す
    diffContainer.innerHTML = "";
    const canvas = document.createElement("canvas");
    diffContainer.appendChild(canvas);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = width;
    canvas.height = height;

    // 画像1データ（現在）
    const tempCanvas1 = document.createElement("canvas");
    tempCanvas1.width = width;
    tempCanvas1.height = height;
    const tempCtx1 = tempCanvas1.getContext("2d", { willReadFrequently: true });
    tempCtx1.drawImage(img1, 0, 0, width, height);
    const data1 = tempCtx1.getImageData(0, 0, width, height).data;

    // 画像2データ（2分前）
    const tempCanvas2 = document.createElement("canvas");
    tempCanvas2.width = width;
    tempCanvas2.height = height;
    const tempCtx2 = tempCanvas2.getContext("2d", { willReadFrequently: true });
    tempCtx2.drawImage(img2, 0, 0, width, height);
    const data2 = tempCtx2.getImageData(0, 0, width, height).data;

    const diff = ctx.createImageData(width, height);
    let diffCount = 0;

    for (let i = 0; i < data1.length; i += 4) {
      const dr = Math.abs(data1[i] - data2[i]);
      const dg = Math.abs(data1[i + 1] - data2[i + 1]);
      const db = Math.abs(data1[i + 2] - data2[i + 2]);
      const diffVal = (dr + dg + db) / 3;

      const pixelThreshold = 30;
      if (diffVal > pixelThreshold) {
        diff.data[i] = 255;
        diff.data[i + 1] = 0;
        diff.data[i + 2] = 0;
        diff.data[i + 3] = 255;
        diffCount++;
      } else {
        diff.data[i] = data1[i];
        diff.data[i + 1] = data1[i + 1];
        diff.data[i + 2] = data1[i + 2];
        diff.data[i + 3] = 255;
      }
    }

    ctx.putImageData(diff, 0, 0);

    // 差分率
    const totalPixels = width * height;
    const diffRate = (diffCount / totalPixels) * 100;
    if (rateEl) rateEl.textContent = `差分率(2分): ${diffRate.toFixed(2)}%`;

    console.log(`差分率: ${diffRate.toFixed(2)}%`);

    // 差分率が一定以上なら通知（クールダウン付き）
    const now = Date.now();
    if (diffRate > THRESHOLD && (now - lastNotifyTime) > NOTIFY_COOLDOWN) {
      if (typeof addNotification === "function") {
        addNotification({
          title: "変化検知(微弱)",
          location: "島本体付近",
          detail: `差分率が ${diffRate.toFixed(1)}% を超過しました`,
          type: diffRate > 40 ? "error" : "warn"
        });
        lastNotifyTime = now;
      }
    }
  } catch (error) {
    console.error("画像比較エラー:", error);
    if (rateEl) rateEl.textContent = "差分率(2分): エラー";
  }
}

// 画像ロード関数（CORS対応改善版）
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("画像読み込みエラー:", src, e);
      reject(e);
    };
    
    // キャッシュ防止
    const separator = src.includes("?") ? "&" : "?";
    img.src = src + separator + "t=" + Date.now();
  });
}

// 定期実行
window.addEventListener("DOMContentLoaded", () => {
  console.log("差分検知スクリプト開始");
  
  // 初回は少し遅延させる（画像読み込み待ち）
  setTimeout(() => {
    compareWithDriveImage();
  }, 2000);
  
  setInterval(compareWithDriveImage, INTERVAL_MS);
});
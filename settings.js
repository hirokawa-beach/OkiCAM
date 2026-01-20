document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settings-btn");
  const settingsDialog = document.getElementById("settings-dialog");
  const soundToggle = document.getElementById("sound-toggle");
  const updateToggle = document.getElementById("update-toggle");

  // 保存された設定を読み込み(通知音)
  const savedSoundSetting = localStorage.getItem("soundEnabled");
  if (savedSoundSetting !== null) {
    soundToggle.checked = savedSoundSetting === "true";
  }

  // 保存された設定を読み込み(自動更新)
  const savedUpdateSetting = localStorage.getItem("updateEnabled");
  if (savedUpdateSetting !== null) {
    updateToggle.checked = savedUpdateSetting === "true";
    updateAutoUpdateStatus(savedUpdateSetting === "true"); // 🔹追加
  }

  // チェック状態が変わったら即時反映
  updateToggle.addEventListener("change", () => {
    const enabled = updateToggle.checked;
    localStorage.setItem("updateEnabled", enabled);
    updateAutoUpdateStatus(enabled); // 🔹即座にステータス表示を更新

    if (enabled && window.startAutoUpdate) {
      window.startAutoUpdate();
    } else if (!enabled && window.stopAutoUpdate) {
      window.stopAutoUpdate();
    }
  });

  // ⚙️ボタンで設定ダイアログ表示/非表示
  settingsBtn.addEventListener("click", () => {
    settingsDialog.classList.toggle("show");
  });

  // チェックボックス変更でローカル保存
  soundToggle.addEventListener("change", () => {
    localStorage.setItem("soundEnabled", soundToggle.checked);
  });
});

// 自動更新ステータス表示を更新（この関数はそのまま）
function updateAutoUpdateStatus(enabled) {
  const statusElement = document.getElementById("auto-update-status");
  const iconElement = document.getElementById("status-icon");
  const textElement = document.getElementById("status-text");

  if (!statusElement || !iconElement || !textElement) return;

  if (enabled) {
    statusElement.classList.add("active");
    iconElement.textContent = "▶️";
    textElement.textContent = "自動更新ON";
  } else {
    statusElement.classList.remove("active");
    iconElement.textContent = "⏸️";
    textElement.textContent = "自動更新OFF";
  }
}
// 自動更新ステータス表示を更新
function updateAutoUpdateStatus(enabled) {
  const statusElement = document.getElementById("auto-update-status");
  const iconElement = document.getElementById("status-icon");
  const textElement = document.getElementById("status-text");

  if (!statusElement || !iconElement || !textElement) return;

  if (enabled) {
    statusElement.classList.add("active");
    iconElement.textContent = "▶️";
    textElement.textContent = "自動更新ON";
  } else {
    statusElement.classList.remove("active");
    iconElement.textContent = "⏸️";
    textElement.textContent = "自動更新OFF";
  }
}

// ページロード時にステータスを反映
const savedUpdateSetting = localStorage.getItem("updateEnabled");
if (savedUpdateSetting !== null) {
  updateAutoUpdateStatus(savedUpdateSetting === "true");
}

// チェックボックス変更時にステータスを更新
updateToggle.addEventListener("change", () => {
  const enabled = updateToggle.checked;
  localStorage.setItem("updateEnabled", enabled);
  updateAutoUpdateStatus(enabled); //

  if (enabled && window.startAutoUpdate) {
    window.startAutoUpdate();
  } else if (!enabled && window.stopAutoUpdate) {
    window.stopAutoUpdate();
  }
});

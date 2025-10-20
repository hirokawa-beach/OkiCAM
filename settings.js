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
// 保存済み設定を反映
const savedUpdateSetting = localStorage.getItem("updateEnabled");
if (savedUpdateSetting !== null) {
  updateToggle.checked = savedUpdateSetting === "true";
}

// チェック状態が変わったら即時反映
updateToggle.addEventListener("change", () => {
  const enabled = updateToggle.checked;
  localStorage.setItem("updateEnabled", enabled);

  // 🔹 update.js にある関数を直接呼ぶ
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
})
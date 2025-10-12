document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settings-btn");
  const settingsDialog = document.getElementById("settings-dialog");
  const soundToggle = document.getElementById("sound-toggle");

  // 保存された設定を読み込み
  const savedSoundSetting = localStorage.getItem("soundEnabled");
  if (savedSoundSetting !== null) {
    soundToggle.checked = savedSoundSetting === "true";
  }

  // ⚙️ボタンで設定ダイアログ表示/非表示
  settingsBtn.addEventListener("click", () => {
    settingsDialog.classList.toggle("show");
  });

  // チェックボックス変更でローカル保存
  soundToggle.addEventListener("change", () => {
    localStorage.setItem("soundEnabled", soundToggle.checked);
  });
});
/**
 * OkiCAM Layout Manager
 * ドラッグ&ドロップで監視対象を並び替え、非表示にできる機能
 * スマホ対応: タッチ操作でのドラッグ&ドロップに対応
**/

class LayoutManager {
  constructor() {
    this.overviewContainer = document.querySelector(".overview");
    this.storageKey = "okicam-layout-state";
    this.draggedElement = null;
    this.locationBtn = document.getElementById("location-btn");
    this.locationDialog = document.getElementById("location-dialog");
    this.autoScrollInterval = null;
    this.filterMode = false;
    this.filterViewContainer = null;

    // タッチ操作用の変数
    this.touchStartY = 0;
    this.touchStartX = 0;
    this.isTouchDragging = false;
    this.touchDragElement = null;
    this.touchDragClone = null;

    this.init();
  }

  init() {
    // 既存のレイアウト状態を復元
    this.loadState();

    // ドラッグイベントのリスナー登録（PC用）
    this.overviewContainer.addEventListener("dragstart", (e) =>
      this.handleDragStart(e),
    );
    this.overviewContainer.addEventListener("dragover", (e) =>
      this.handleDragOver(e),
    );
    this.overviewContainer.addEventListener("drop", (e) => this.handleDrop(e));
    this.overviewContainer.addEventListener("dragend", (e) =>
      this.handleDragEnd(e),
    );

    // タッチイベントのリスナー登録（スマホ用）
    this.overviewContainer.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: false },
    );
    this.overviewContainer.addEventListener(
      "touchmove",
      (e) => this.handleTouchMove(e),
      { passive: false },
    );
    this.overviewContainer.addEventListener("touchend", (e) =>
      this.handleTouchEnd(e),
    );

    // 非表示ボタンのリスナー登録
    this.overviewContainer.addEventListener("click", (e) =>
      this.handleToggleVisibility(e),
    );
    this.overviewContainer.addEventListener(
      "touchend",
      (e) => {
        if (e.target.classList.contains("toggle-visibility-btn")) {
          this.handleToggleVisibility(e);
        }
      },
      { passive: false },
    );
    // ロケーションボタンのリスナー登録
    this.locationBtn.addEventListener("click", () =>
      this.toggleLocationDialog(),
    );

    // ロケーションダイアログの表示切り替えリスナー
    if (this.locationDialog) {
      this.locationDialog.addEventListener("change", (e) =>
        this.handleLocationToggle(e),
      );
      this.locationDialog.addEventListener("click", (e) =>
        this.handleLocationDialogClick(e),
      );
    }

    // 外側クリックでダイアログを閉じる
    document.addEventListener("click", (e) => this.handleOutsideClick(e));

    // 初期化時にタグフィルターを生成
    this.initializeTagFilters();
  }

  /**
   * 各監視対象に操作UI(ハンドル+非表示ボタン)を追加
   */
  addControlUI(container) {
    if (container.querySelector(".item-controls")) {
      return; // 既に追加済み
    }

    const controls = document.createElement("div");
    controls.className = "item-controls";

    // ドラッグハンドル
    const dragHandle = document.createElement("button");
    dragHandle.className = "drag-handle";
    dragHandle.textContent = "⋮⋮";
    dragHandle.title = "ドラッグして並び替え";
    dragHandle.setAttribute("draggable", "true");

    // 非表示ボタン
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "toggle-visibility-btn";
    toggleBtn.textContent = "✂️";
    toggleBtn.title = "非表示にする";

    controls.appendChild(dragHandle);
    controls.appendChild(toggleBtn);

    // topセクションの前に挿入
    const topSection = container.querySelector(".top");
    if (topSection) {
      topSection.insertBefore(controls, topSection.firstChild);
    } else {
      container.insertBefore(controls, container.firstChild);
    }
  }

  /**
   * すべての監視対象のコンテナにUIを追加
   */
  initializeAllItems() {
    const items = this.overviewContainer.querySelectorAll(
      ".overview > [class]",
    );
    items.forEach((item) => {
      this.addControlUI(item);
    });
  }

  // ==================== PC用ドラッグ&ドロップ ====================

  handleDragStart(e) {
    if (!e.target.classList.contains("drag-handle")) {
      return;
    }

    const container = e.target.closest(".overview > [class]");
    if (!container) return;

    this.draggedElement = container;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", container.innerHTML);

    container.classList.add("dragging");
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!this.draggedElement) return;

    this.handleAutoScroll(e.clientY);

    const container = e.target.closest(".overview > [class]");
    if (container && container !== this.draggedElement) {
      const rect = container.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY < midpoint) {
        container.parentNode.insertBefore(this.draggedElement, container);
      } else {
        container.parentNode.insertBefore(
          this.draggedElement,
          container.nextSibling,
        );
      }
    }
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.draggedElement) {
      this.saveState();
    }
  }

  handleDragEnd(e) {
    if (this.draggedElement) {
      this.draggedElement.classList.remove("dragging");
      this.draggedElement = null;
    }

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  // ==================== スマホ用タッチ操作 ====================

  handleTouchStart(e) {
    // ドラッグハンドルのタッチ開始
    if (e.target.classList.contains("drag-handle")) {
      e.preventDefault();

      const container = e.target.closest(".overview > [class], [data-regions]");
      if (!container) return;

      this.isTouchDragging = true;
      this.touchDragElement = container;

      const touch = e.touches[0];
      this.touchStartY = touch.clientY;
      this.touchStartX = touch.clientX;

      // ドラッグ中の視覚的フィードバック
      container.classList.add("dragging");

      // クローンを作成して追従させる
      this.touchDragClone = container.cloneNode(true);
      this.touchDragClone.style.position = "fixed";
      this.touchDragClone.style.pointerEvents = "none";
      this.touchDragClone.style.opacity = "0.8";
      this.touchDragClone.style.zIndex = "10000";
      this.touchDragClone.style.width = container.offsetWidth + "px";
      this.touchDragClone.style.left =
        touch.clientX - container.offsetWidth / 2 + "px";
      this.touchDragClone.style.top = touch.clientY - 50 + "px";
      document.body.appendChild(this.touchDragClone);
    }
  }

  handleTouchMove(e) {
    if (!this.isTouchDragging || !this.touchDragElement) return;

    e.preventDefault();

    const touch = e.touches[0];

    // クローンを移動
    if (this.touchDragClone) {
      this.touchDragClone.style.left =
        touch.clientX - this.touchDragClone.offsetWidth / 2 + "px";
      this.touchDragClone.style.top = touch.clientY - 50 + "px";
    }

    // オートスクロール
    this.handleAutoScroll(touch.clientY);

    // タッチ位置にある要素を取得
    const elementAtPoint = document.elementFromPoint(
      touch.clientX,
      touch.clientY,
    );
    if (!elementAtPoint) return;

    let targetContainer;
    if (this.filterMode) {
      targetContainer = elementAtPoint.closest("[data-regions]");
    } else {
      targetContainer = elementAtPoint.closest(".overview > [class]");
    }

    if (targetContainer && targetContainer !== this.touchDragElement) {
      const rect = targetContainer.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (touch.clientY < midpoint) {
        targetContainer.parentNode.insertBefore(
          this.touchDragElement,
          targetContainer,
        );
      } else {
        targetContainer.parentNode.insertBefore(
          this.touchDragElement,
          targetContainer.nextSibling,
        );
      }

      // フィルタービュー内の場合は同期
      if (this.filterMode) {
        this.syncFilterViewChangesToOverview();
      }
    }
  }

  handleTouchEnd(e) {
    if (!this.isTouchDragging) return;

    if (this.touchDragElement) {
      this.touchDragElement.classList.remove("dragging");
      this.saveState();
      this.touchDragElement = null;
    }

    if (this.touchDragClone) {
      this.touchDragClone.remove();
      this.touchDragClone = null;
    }

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }

    this.isTouchDragging = false;
  }

  // ==================== 共通処理 ====================

  handleToggleVisibility(e) {
    // クリックとタッチ両方に対応
    if (!e.target.classList.contains("toggle-visibility-btn")) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const container = e.target.closest(".overview > [class], [data-regions]");
    if (!container) return;

    // フィルタービュー内の場合
    if (this.filterMode && container.hasAttribute("data-regions")) {
      const originalElement = this.findOriginalElement(container);
      if (originalElement) {
        originalElement.classList.toggle("hidden");
        this.saveState();
        this.syncLocationCheckboxes();
        container.remove();
      }
    } else {
      // 通常ビュー内の場合
      container.classList.toggle("hidden");
      this.saveState();
      this.syncLocationCheckboxes();
    }
  }

  saveState() {
    const state = {
      order: [],
      visibility: {},
    };

    const items = this.overviewContainer.querySelectorAll(
      ".overview > [class]",
    );
    items.forEach((item) => {
      const className = item.className.split(" ")[0];
      state.order.push(className);
      state.visibility[className] = item.classList.contains("hidden");
    });

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) {
      this.initializeAllItems();
      return;
    }

    const state = JSON.parse(saved);

    if (state.order && state.order.length > 0) {
      const items = this.overviewContainer.querySelectorAll(
        ".overview > [class]",
      );
      const itemMap = new Map();

      items.forEach((item) => {
        const className = item.className.split(" ")[0];
        itemMap.set(className, item);
      });

      state.order.forEach((className) => {
        const item = itemMap.get(className);
        if (item) {
          this.overviewContainer.appendChild(item);
        }
      });
    }

    if (state.visibility) {
      Object.entries(state.visibility).forEach(([className, isHidden]) => {
        const item = this.overviewContainer.querySelector(`.${className}`);
        if (item) {
          if (isHidden) {
            item.classList.add("hidden");
          } else {
            item.classList.remove("hidden");
          }
        }
      });
    }

    this.initializeAllItems();
  }

  resetState() {
    localStorage.removeItem(this.storageKey);
    location.reload();
  }

  toggleLocationDialog() {
    this.locationDialog.classList.toggle("show");

    if (this.locationDialog.classList.contains("show")) {
      this.syncLocationCheckboxes();
    }
  }

  syncLocationCheckboxes() {
    const checkboxes = this.locationDialog.querySelectorAll(".location-toggle");
    checkboxes.forEach((checkbox) => {
      const target = checkbox.getAttribute("data-target");
      const element = this.overviewContainer.querySelector(`.${target}`);
      if (element) {
        checkbox.checked = !element.classList.contains("hidden");
      }
    });
  }

  handleLocationToggle(e) {
    if (!e.target.classList.contains("location-toggle")) {
      return;
    }

    const target = e.target.getAttribute("data-target");
    const element = this.overviewContainer.querySelector(`.${target}`);

    if (element) {
      if (e.target.checked) {
        element.classList.remove("hidden");
      } else {
        element.classList.add("hidden");
      }
      this.saveState();
    }
  }

  handleAutoScroll(clientY) {
    const scrollThreshold = 80;
    const maxSpeed = 20;

    const viewportHeight = window.innerHeight;
    const distFromTop = clientY;
    const distFromBottom = viewportHeight - clientY;

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }

    let shouldScroll = false;
    let scrollDirection = 0;
    let scrollSpeed = 0;

    if (distFromTop < scrollThreshold) {
      shouldScroll = true;
      scrollDirection = -1;
      scrollSpeed = maxSpeed * (1 - distFromTop / scrollThreshold);
    } else if (distFromBottom < scrollThreshold) {
      shouldScroll = true;
      scrollDirection = 1;
      scrollSpeed = maxSpeed * (1 - distFromBottom / scrollThreshold);
    }

    if (shouldScroll && scrollSpeed > 0) {
      this.autoScrollInterval = setInterval(() => {
        window.scrollBy(0, scrollDirection * scrollSpeed);
      }, 16);
    }
  }

  handleOutsideClick(e) {
    if (
      e.target === this.locationBtn ||
      e.target === this.locationDialog ||
      this.locationDialog.contains(e.target)
    ) {
      return;
    }

    const settingsBtn = document.getElementById("settings-btn");
    if (e.target === settingsBtn || settingsBtn.contains(e.target)) {
      this.locationDialog.classList.remove("show");
      return;
    }

    this.locationDialog.classList.remove("show");
  }

  handleLocationDialogClick(e) {
    if (e.target.classList.contains("tag-filter-btn")) {
      const region = e.target.getAttribute("data-region");
      this.showFilterView(region);
      this.updateActiveTagButton(region);
      this.locationDialog.classList.remove("show");
      return;
    }

    if (e.target.id === "reset-layout-btn") {
      if (confirm("レイアウト設定を初期状態に戻しますか?")) {
        this.resetState();
      }
    }
  }

  updateActiveTagButton(region) {
    const tagButtons = document.querySelectorAll(".tag-filter-btn");
    tagButtons.forEach((btn) => {
      if (btn.getAttribute("data-region") === region) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  initializeTagFilters() {
    const tagFilterList = document.getElementById("tag-filter-list");
    if (!tagFilterList) return;

    const regions = new Set();
    const items = this.overviewContainer.querySelectorAll("[data-regions]");
    items.forEach((item) => {
      const regionsStr = item.getAttribute("data-regions");
      if (regionsStr) {
        regionsStr.split(",").forEach((region) => {
          regions.add(region.trim());
        });
      }
    });

    regions.forEach((region) => {
      const btn = document.createElement("button");
      btn.className = "tag-filter-btn";
      btn.textContent = region;
      btn.setAttribute("data-region", region);
      tagFilterList.appendChild(btn);
    });
  }

  // ==================== フィルタービュー ====================

  showFilterView(region) {
    if (this.filterViewContainer) {
      this.filterViewContainer.remove();
    }

    const main = document.querySelector(".main");
    main.classList.add("filter-view");

    this.filterViewContainer = document.createElement("div");
    this.filterViewContainer.className = "filter-view-container";

    const header = document.createElement("div");
    header.className = "filter-view-header";

    const backBtn = document.createElement("button");
    backBtn.className = "filter-view-back-btn";
    backBtn.textContent = "←";
    backBtn.addEventListener("click", () => this.exitFilterView());

    const title = document.createElement("div");
    title.className = "filter-view-title";
    title.textContent = region;

    header.appendChild(backBtn);
    header.appendChild(title);
    this.filterViewContainer.appendChild(header);

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "filter-view-items";

    const items = this.overviewContainer.querySelectorAll("[data-regions]");
    items.forEach((item) => {
      const regionsStr = item.getAttribute("data-regions");
      if (regionsStr && regionsStr.includes(region)) {
        if (!item.classList.contains("hidden")) {
          const clone = item.cloneNode(true);
          clone.classList.remove("dragging");
          itemsContainer.appendChild(clone);
        }
      }
    });

    this.filterViewContainer.appendChild(itemsContainer);

    // PC用ドラッグイベント
    itemsContainer.addEventListener("dragstart", (e) =>
      this.handleFilterViewDragStart(e),
    );
    itemsContainer.addEventListener("dragover", (e) =>
      this.handleFilterViewDragOver(e, itemsContainer),
    );
    itemsContainer.addEventListener("drop", (e) =>
      this.handleFilterViewDrop(e),
    );
    itemsContainer.addEventListener("dragend", (e) =>
      this.handleFilterViewDragEnd(e),
    );

    // スマホ用タッチイベント
    itemsContainer.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: false },
    );
    itemsContainer.addEventListener(
      "touchmove",
      (e) => this.handleTouchMove(e),
      { passive: false },
    );
    itemsContainer.addEventListener("touchend", (e) => this.handleTouchEnd(e));

    itemsContainer.addEventListener("click", (e) =>
      this.handleFilterViewToggleVisibility(e),
    );

    main.appendChild(this.filterViewContainer);

    this.filterMode = true;
  }

  handleFilterViewDragStart(e) {
    if (!e.target.classList.contains("drag-handle")) {
      return;
    }

    const container = e.target.closest("[data-regions]");
    if (!container) return;

    this.draggedElement = container;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", container.innerHTML);

    container.classList.add("dragging");
  }

  handleFilterViewDragOver(e, itemsContainer) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!this.draggedElement) return;

    this.handleAutoScroll(e.clientY);

    const container = e.target.closest("[data-regions]");
    if (
      container &&
      container !== this.draggedElement &&
      itemsContainer.contains(container)
    ) {
      const rect = container.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY < midpoint) {
        container.parentNode.insertBefore(this.draggedElement, container);
      } else {
        container.parentNode.insertBefore(
          this.draggedElement,
          container.nextSibling,
        );
      }

      this.syncFilterViewChangesToOverview();
    }
  }

  handleFilterViewDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.draggedElement) {
      this.saveState();
    }
  }

  handleFilterViewDragEnd(e) {
    if (this.draggedElement) {
      this.draggedElement.classList.remove("dragging");
      this.draggedElement = null;
    }

    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }


  findOriginalElement(cloneElement) {
    const className = cloneElement.className.split(" ")[0];
    return this.overviewContainer.querySelector(`.${className}`);
  }

  syncFilterViewChangesToOverview() {
    if (!this.filterViewContainer) return;

    const filterItems =
      this.filterViewContainer.querySelectorAll("[data-regions]");
    const originalItems = [];

    filterItems.forEach((filterItem) => {
      const originalElement = this.findOriginalElement(filterItem);
      if (originalElement) {
        originalItems.push(originalElement);
      }
    });

    originalItems.forEach((item) => {
      this.overviewContainer.appendChild(item);
    });
  }

  exitFilterView() {
    const main = document.querySelector(".main");
    main.classList.remove("filter-view");

    if (this.filterViewContainer) {
      this.filterViewContainer.remove();
      this.filterViewContainer = null;
    }

    // フィルタービュー終了時にタグボタン強調を解除
    this.updateActiveTagButton(null);

    this.filterMode = false;
  }
}

// DOMロード完了時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.layoutManager = new LayoutManager();
    });
} else {
    window.layoutManager = new LayoutManager();
}
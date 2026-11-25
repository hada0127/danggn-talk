// danggn-talk 팝업 컨트롤: ‹ 뒤로 버튼을 주입하고, ‹ 와 기존 ⚙(#kkt-settings)을 방 제목 줄에 올린다.
// ‹ 는 목록 전용 보기(html.kkt-list)를 토글한다. 팝업 창에서만.
// 제목 줄(.group-title / .chat-header-profile)이 안 보이면(방 미선택·목록 전용 보기) 두 버튼을 숨긴다 → 당근 기본 무손상.
// ⚙ 버튼/패널/핸들러는 settings-panel.js 가 소유한다. 여기선 그 위치(top/right)만 정한다.
(() => {
  const K = (window.__kkt = window.__kkt || {});

  const STYLE = `
    /* ‹ 는 당근 ⋮(.more-button-wrapper 24px, 아이콘 currentColor)와 같은 모양: 배경 없이 24px.
       색은 position() 이 ⋮ 의 computed color 를 inline 으로 복사한다. */
    #kkt-back { position: fixed; z-index: 2147483647; display: inline-flex;
      align-items: center; justify-content: center; width: 24px; height: 24px;
      padding: 0; border: 0; border-radius: 4px; background: transparent; cursor: pointer; }
    #kkt-back:hover { background: rgba(0,0,0,.06); }
  `;

  function injectStyle() {
    if (document.getElementById("kkt-controls-style")) return;
    const s = document.createElement("style");
    s.id = "kkt-controls-style";
    s.textContent = STYLE;
    (document.head || document.documentElement).appendChild(s);
  }

  function buildBack() {
    if (document.getElementById("kkt-back")) return;
    const back = document.createElement("button");
    back.id = "kkt-back";
    back.type = "button";
    back.title = "방 목록";
    back.setAttribute("aria-label", "방 목록");
    back.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'; // ‹ 뒤로
    back.addEventListener("click", () => {
      document.documentElement.classList.toggle("kkt-list");
      position(); // 표시/숨김 즉시 반영
    });
    document.body.appendChild(back);
  }

  let lastSig = "";
  let lastPath = location.pathname;

  // ‹ 와 ⚙ 를 제목 줄에 맞춰 둔다. 제목 줄이 안 보이면 둘 다 숨긴다. 움직이지 않았으면 아무것도 안 한다.
  function position() {
    const back = document.getElementById("kkt-back");
    const settings = document.getElementById("kkt-settings");
    // 제목: 모임방 .group-title / 1:1·거래·비즈 방 .chat-header-profile(방 종류별로 하나만 있음).
    const title = K.q(".group-title, .chat-header-profile");
    const rect = title ? title.getBoundingClientRect() : null;
    const visible = !!rect && rect.width > 0 && rect.height > 0;
    const listMode = document.documentElement.classList.contains("kkt-list");
    const row = visible && title.parentElement ? title.parentElement.getBoundingClientRect() : null;
    const more = visible ? K.q(".more-button-wrapper") : null;
    const moreRect = more ? more.getBoundingClientRect() : null;
    const color = more ? getComputedStyle(more).color : "";

    const sig = [
      visible ? 1 : 0, listMode ? 1 : 0,
      rect ? Math.round(rect.top) : 0, rect ? Math.round(rect.height) : 0,
      row ? Math.round(row.left) : 0,
      moreRect ? Math.round(moreRect.left) : 0,
      Math.round(window.innerWidth), color
    ].join("|");
    if (sig === lastSig) return;
    lastSig = sig;

    if (!visible) {
      if (back) back.style.display = "none";
      if (settings) settings.style.display = "none";
      return;
    }
    if (settings) {
      settings.style.display = "";
      settings.style.top = Math.round(rect.top + rect.height / 2 - 12) + "px"; // 24px 버튼
      settings.style.color = color;
      settings.style.right = (moreRect ? Math.round(window.innerWidth - moreRect.left + 8) : 8) + "px";
      settings.style.left = "auto";
    }
    if (back) {
      if (listMode) {
        back.style.display = "none"; // ‹ 는 목록 전용 보기에선 숨긴다(방어적; 보통 title 이 안 보여 위에서 처리됨)
      } else {
        back.style.display = "";
        back.style.top = Math.round(rect.top + rect.height / 2 - 12) + "px"; // 24px 버튼
        back.style.left = (row ? Math.round(row.left + 16) : 16) + "px";
        back.style.color = color;
      }
    }
  }

  function tick() {
    // 방 전환: pathname 이 /room/ 으로 바뀌면 목록 전용 보기를 해제한다(방을 골랐다).
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      if (location.pathname.includes("/room/")) {
        document.documentElement.classList.remove("kkt-list");
      }
    }
    position();
  }

  K.popup().then((isPopup) => {
    if (!isPopup || !document.body) return;
    injectStyle();
    buildBack();
    position();
    window.addEventListener("resize", position);
    // 목록 전용 보기에서 방을 누르면 채팅으로 돌아간다. 이미 열린 방을 누르면 주소가 안 바뀌어
    // tick 의 pathname 감지가 못 잡으므로 클릭에서 직접 푼다.
    document.addEventListener("click", (e) => {
      const html = document.documentElement;
      if (!html.classList.contains("kkt-list")) return;
      if (e.target.closest && e.target.closest('a[href*="/room/"]')) {
        html.classList.remove("kkt-list");
        position();
      }
    }, true);
    // 테마/스킨이 바뀌면 ⋮ 색이 바뀌므로 body 클래스 반영(theme.js) 직후 다시 맞춘다(1초 폴링 대기 없이).
    chrome.storage.onChanged.addListener((c, area) => {
      if (area === "local" && "theme" in c) setTimeout(position, 150);
    });
    setInterval(tick, 1000); // scroll-keeper 처럼 가벼운 1초 폴링(움직였을 때만 재배치)
  });
})();

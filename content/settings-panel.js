// danggn-talk 설정 패널: 팝업 창에 스킨(기본/카톡 라이트·다크/엑셀/클로드/지피티)·프로필 숨기기·글씨 크기·배경색 UI 를 주입한다.
// 스킨 저장 키 = theme("default" | THEMES). "default" 면 당근 기본 모양(스킨 없음).
(() => {
  const K = (window.__kkt = window.__kkt || {});

  // 위치(top/right)는 popup-controls.js 가 제목 줄에 맞춰 inline 으로 정한다. 여기선 외형만.
  const STYLE = `
    /* 폰트는 당근 채팅과 같게(body 의 font-family 상속) 14px/150%. */
    #kkt-settings { position: fixed; z-index: 2147483647;
      font-family: inherit; font-size: 14px; line-height: 150%; letter-spacing: -0.02em; }
    /* ⚙ 는 당근 ⋮(.more-button-wrapper 24px, 아이콘 currentColor)와 같은 모양: 배경 없이 24px.
       색은 popup-controls.js 가 ⋮ 의 computed color 를 inline 으로 복사한다. */
    #kkt-settings-btn { display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; padding: 0; border: 0; border-radius: 4px;
      background: transparent; color: inherit; cursor: pointer; }
    #kkt-settings-btn:hover { background: rgba(0,0,0,.06); }
    #kkt-settings-panel { position: absolute; right: 0; top: 32px; min-width: 200px;
      padding: 14px 16px; background: #fff; color: #212124; border: 1px solid #ddd;
      border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
    #kkt-settings-panel label { display: block; margin: 6px 0; cursor: pointer; }
    #kkt-settings-panel input[type=checkbox], #kkt-settings-panel input[type=radio] {
      margin: 0 6px 0 0; vertical-align: -2px; }
    #kkt-settings-panel fieldset { border: 0; margin: 10px 0 0; padding: 10px 0 0;
      border-top: 1px solid #eee; }
    #kkt-settings-panel input[type=range] { width: 100%; margin: 4px 0 0; }
    #kkt-settings-panel input[type=color] { vertical-align: middle; margin-left: 6px; }
    #kkt-font-label { float: right; color: #868b94; }
    #kkt-settings-panel .kkt-mini { font: inherit; font-size: 12px; padding: 3px 8px; margin-top: 4px;
      border: 1px solid #ccc; border-radius: 5px; background: #f5f5f5; cursor: pointer; }
  `;

  function injectStyle() {
    if (document.getElementById("kkt-settings-style")) return;
    const s = document.createElement("style");
    s.id = "kkt-settings-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    injectStyle();

    const root = document.createElement("div");
    root.id = "kkt-settings";
    root.innerHTML = `
      <button id="kkt-settings-btn" type="button" title="danggn-talk 설정" aria-label="danggn-talk 설정"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      <div id="kkt-settings-panel" hidden>
        <label><input type="radio" name="kkt-theme" value="default"> 기본</label>
        <label><input type="radio" name="kkt-theme" value="light"> 카톡 라이트</label>
        <label><input type="radio" name="kkt-theme" value="dark"> 카톡 다크</label>
        <label><input type="radio" name="kkt-theme" value="excel"> 엑셀</label>
        <label><input type="radio" name="kkt-theme" value="claude"> 클로드</label>
        <label><input type="radio" name="kkt-theme" value="chatgpt"> 지피티</label>
        <fieldset>
          <label><input type="checkbox" id="kkt-hide-avatars"> 다른 사람 프로필 숨기기</label>
        </fieldset>
        <fieldset>
          <label>글씨 크기 <span id="kkt-font-label"></span>
            <input type="range" id="kkt-font" min="-2" max="2" step="1"></label>
          <label>배경색 <input type="color" id="kkt-bgcolor">
            <button type="button" id="kkt-bgcolor-clear" class="kkt-mini">스킨 기본</button></label>
        </fieldset>
      </div>`;
    document.body.appendChild(root);

    const panel = root.querySelector("#kkt-settings-panel");
    const hideAvatars = root.querySelector("#kkt-hide-avatars");
    const fontLabel = root.querySelector("#kkt-font-label");
    const radios = Array.from(root.querySelectorAll('input[name="kkt-theme"]'));
    const fontRange = root.querySelector("#kkt-font");
    const bgColor = root.querySelector("#kkt-bgcolor");
    const bgColorClear = root.querySelector("#kkt-bgcolor-clear");

    root.querySelector("#kkt-settings-btn").addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      // 패널을 만들 땐 채팅이 아직 없을 수 있어 색 칸이 검정(#000000)으로 남는다. 열 때 스킨 배경을 다시 읽는다.
      if (!panel.hidden) chrome.storage.local.get("bgColor").then(({ bgColor: bc }) => {
        if (!bc) { const c = currentBg(); if (c) bgColor.value = c; }
      });
    });
    // 패널 바깥(채팅 화면 등)을 누르면 닫는다. 캡처 단계라 당근 쪽 stopPropagation 에도 걸린다.
    document.addEventListener("pointerdown", (e) => {
      if (!panel.hidden && !root.contains(e.target)) panel.hidden = true;
    }, true);
    hideAvatars.addEventListener("change", () =>
      chrome.storage.local.set({ hideAvatars: hideAvatars.checked }));
    radios.forEach((r) =>
      // 스킨을 바꾸면 사용자 배경색을 풀어 새 스킨 배경이 보이게 한다(색 칸도 sync 가 스킨 색으로 맞춤).
      r.addEventListener("change", () => {
        if (!r.checked) return;
        const patch = { theme: r.value, bgColor: null };
        if (r.value !== "default") patch.lastTheme = r.value; // 더블클릭 복귀용
        chrome.storage.local.set(patch);
      })
    );

    // 글씨 크기 = 당근 기본(14px) 대비 단계 -2~+2(0=기본, 덮지 않음). 배경색 = hex, 스킨 기본=해제(null).
    fontRange.addEventListener("input", () =>
      chrome.storage.local.set({ fontStep: Number(fontRange.value) }));
    bgColor.addEventListener("input", () => chrome.storage.local.set({ bgColor: bgColor.value }));
    bgColorClear.addEventListener("click", () => chrome.storage.local.set({ bgColor: null }));

    // 지금 보이는 채팅 배경색(스킨/테마/당근 기본)을 #rrggbb 로. 못 읽으면 null.
    const currentBg = () => {
      const el = K.q(".chat-normal-room div:not(.for-containment):has(> .for-containment)");
      const c = el ? getComputedStyle(el).backgroundColor : "";
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (!m || m[4] === "0") return null; // transparent 등
      return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
    };

    const KEYS = ["hideAvatars", "theme", "fontStep", "bgColor"];
    const sync = ({ hideAvatars: ha, theme, fontStep, bgColor: bc }) => {
      hideAvatars.checked = !!ha;
      const t = radios.some((r) => r.value === theme) ? theme : "default";
      radios.forEach((r) => { r.checked = r.value === t; });
      const step = Math.max(-2, Math.min(2, Math.round(Number(fontStep) || 0)));
      fontRange.value = step;
      fontLabel.textContent = step === 0 ? "기본" : (step > 0 ? "+" : "") + step;
      if (bc) bgColor.value = bc;
      // 사용자 색이 없으면 색 칸에 현재 스킨 배경을 보여 준다. 스킨 클래스(theme.js)가 먼저 반영되도록 한 박자 뒤에 읽는다.
      else setTimeout(() => { const c = currentBg(); if (c) bgColor.value = c; }, 150);
    };
    chrome.storage.local.get(KEYS).then(sync);
    chrome.storage.onChanged.addListener((c, area) => {
      if (area === "local" && KEYS.some((k) => k in c)) {
        chrome.storage.local.get(KEYS).then(sync);
      }
    });
  }

  K.popup().then((isPopup) => { if (isPopup && document.body) build(); });
})();

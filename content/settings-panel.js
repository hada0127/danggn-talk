// 당근톡 설정 패널: 팝업 창에 테마 선택 + 카톡 스킨 토글 UI 를 주입한다.
(() => {
  const K = (window.__kkt = window.__kkt || {});

  const STYLE = `
    #kkt-settings { position: fixed; top: 8px; right: 8px; z-index: 2147483647;
      font: 12px/1.3 -apple-system, "Apple SD Gothic Neo", sans-serif; }
    #kkt-settings-btn { width: 36px; height: 36px; border: 0; border-radius: 50%;
      background: #FF6F0F; color: #fff; font-size: 16px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,.25); }
    #kkt-settings-panel { position: absolute; right: 0; top: 44px; min-width: 150px;
      padding: 10px 12px; background: #fff; color: #222; border: 1px solid #ddd;
      border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
    #kkt-settings-panel label { display: block; margin: 3px 0; cursor: pointer; }
    #kkt-settings-panel fieldset { border: 0; margin: 8px 0 0; padding: 8px 0 0;
      border-top: 1px solid #eee; }
  `;

  function injectStyle() {
    if (document.getElementById("kkt-settings-style")) return;
    const s = document.createElement("style");
    s.id = "kkt-settings-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (document.getElementById("kkt-settings")) return;
    injectStyle();

    const root = document.createElement("div");
    root.id = "kkt-settings";
    root.innerHTML = `
      <button id="kkt-settings-btn" type="button" title="당근톡 설정">⚙</button>
      <div id="kkt-settings-panel" hidden>
        <label><input type="checkbox" id="kkt-kakao-toggle"> 카톡 스킨</label>
        <fieldset>
          <label><input type="radio" name="kkt-theme" value="light"> 라이트</label>
          <label><input type="radio" name="kkt-theme" value="dark"> 다크</label>
          <label><input type="radio" name="kkt-theme" value="excel"> 엑셀</label>
        </fieldset>
      </div>`;
    document.body.appendChild(root);

    const panel = root.querySelector("#kkt-settings-panel");
    const kakao = root.querySelector("#kkt-kakao-toggle");
    const radios = Array.from(root.querySelectorAll('input[name="kkt-theme"]'));

    root.querySelector("#kkt-settings-btn").addEventListener("click", () => {
      panel.hidden = !panel.hidden;
    });
    kakao.addEventListener("change", () => chrome.storage.local.set({ kakaoMode: kakao.checked }));
    radios.forEach((r) =>
      r.addEventListener("change", () => { if (r.checked) chrome.storage.local.set({ theme: r.value }); })
    );

    const sync = ({ kakaoMode, theme }) => {
      kakao.checked = !!kakaoMode;
      const t = theme || "light";
      radios.forEach((r) => { r.checked = r.value === t; });
    };
    chrome.storage.local.get(["kakaoMode", "theme"]).then(sync);
    chrome.storage.onChanged.addListener((c, area) => {
      if (area === "local" && ("kakaoMode" in c || "theme" in c)) {
        chrome.storage.local.get(["kakaoMode", "theme"]).then(sync);
      }
    });
  }

  K.popup().then((isPopup) => { if (isPopup && document.body) build(); });
})();

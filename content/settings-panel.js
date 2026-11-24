// danggn-talk 설정 패널: 팝업 창에 테마 선택 + 카톡 스킨 토글 UI 를 주입한다.
(() => {
  const K = (window.__kkt = window.__kkt || {});

  // 위치(top/right)는 popup-controls.js 가 제목 줄에 맞춰 inline 으로 정한다. 여기선 외형만.
  const STYLE = `
    #kkt-settings { position: fixed; z-index: 2147483647;
      font: 12px/1.3 -apple-system, "Apple SD Gothic Neo", sans-serif; }
    #kkt-settings-btn { width: 36px; height: 36px; border: 0; border-radius: 50%;
      background: #FF6F0F; color: #fff; font-size: 16px; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,.25); }
    #kkt-settings-panel { position: absolute; right: 0; top: 44px; min-width: 170px;
      padding: 10px 12px; background: #fff; color: #222; border: 1px solid #ddd;
      border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
    #kkt-settings-panel label { display: block; margin: 3px 0; cursor: pointer; }
    #kkt-settings-panel fieldset { border: 0; margin: 8px 0 0; padding: 8px 0 0;
      border-top: 1px solid #eee; }
    #kkt-settings-panel input[type=range] { width: 100%; }
    #kkt-settings-panel input[type=url] { width: 100%; box-sizing: border-box; margin: 2px 0;
      padding: 3px 5px; border: 1px solid #ccc; border-radius: 5px; }
    #kkt-settings-panel .kkt-mini { font-size: 11px; padding: 2px 6px; margin-top: 3px;
      border: 1px solid #ccc; border-radius: 5px; background: #f5f5f5; cursor: pointer; }
    #kkt-bgimg-msg { font-size: 11px; color: #c00; min-height: 13px; }
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
      <button id="kkt-settings-btn" type="button" title="danggn-talk 설정">⚙</button>
      <div id="kkt-settings-panel" hidden>
        <label><input type="checkbox" id="kkt-kakao-toggle"> 카톡 스킨</label>
        <fieldset>
          <label><input type="radio" name="kkt-theme" value="light"> 라이트</label>
          <label><input type="radio" name="kkt-theme" value="dark"> 다크</label>
          <label><input type="radio" name="kkt-theme" value="excel"> 엑셀</label>
        </fieldset>
        <fieldset>
          <label>글씨 크기 <input type="range" id="kkt-font" min="12" max="22" step="1"></label>
          <label>배경색 <input type="color" id="kkt-bgcolor">
            <button type="button" id="kkt-bgcolor-clear" class="kkt-mini">기본</button></label>
          <label>배경 이미지</label>
          <input type="url" id="kkt-bgimg-url" placeholder="이미지 URL">
          <input type="file" id="kkt-bgimg-file" accept="image/*">
          <button type="button" id="kkt-bgimg-clear" class="kkt-mini">배경 이미지 지우기</button>
          <div id="kkt-bgimg-msg"></div>
        </fieldset>
      </div>`;
    document.body.appendChild(root);

    const panel = root.querySelector("#kkt-settings-panel");
    const kakao = root.querySelector("#kkt-kakao-toggle");
    const radios = Array.from(root.querySelectorAll('input[name="kkt-theme"]'));
    const fontRange = root.querySelector("#kkt-font");
    const bgColor = root.querySelector("#kkt-bgcolor");
    const bgColorClear = root.querySelector("#kkt-bgcolor-clear");
    const bgImgUrl = root.querySelector("#kkt-bgimg-url");
    const bgImgFile = root.querySelector("#kkt-bgimg-file");
    const bgImgClear = root.querySelector("#kkt-bgimg-clear");
    const bgImgMsg = root.querySelector("#kkt-bgimg-msg");

    root.querySelector("#kkt-settings-btn").addEventListener("click", () => {
      panel.hidden = !panel.hidden;
    });
    kakao.addEventListener("change", () => chrome.storage.local.set({ kakaoMode: kakao.checked }));
    radios.forEach((r) =>
      r.addEventListener("change", () => { if (r.checked) chrome.storage.local.set({ theme: r.value }); })
    );

    // 글씨 크기(px) / 배경색(hex, 기본=해제) / 배경 이미지(URL 또는 업로드 data-URL, 지우기=해제).
    fontRange.addEventListener("input", () =>
      chrome.storage.local.set({ fontSize: Number(fontRange.value) }));
    bgColor.addEventListener("input", () => chrome.storage.local.set({ bgColor: bgColor.value }));
    bgColorClear.addEventListener("click", () => chrome.storage.local.set({ bgColor: null }));
    bgImgUrl.addEventListener("change", () =>
      chrome.storage.local.set({ bgImage: bgImgUrl.value.trim() || null }));
    bgImgClear.addEventListener("click", () => {
      bgImgFile.value = "";
      bgImgMsg.textContent = "";
      chrome.storage.local.set({ bgImage: null });
    });
    bgImgFile.addEventListener("change", () => {
      const f = bgImgFile.files && bgImgFile.files[0];
      if (!f) return;
      bgImgMsg.textContent = "";
      const reader = new FileReader();
      reader.onload = async () => {
        // ⚠ chrome.storage.local 쿼터(기본 약 10MB, unlimitedStorage 미사용)를 큰 data-URL 이 넘길 수 있다.
        //    실패해도 크래시하지 않고 이전 값을 유지한 채 안내만 띄운다.
        try { await chrome.storage.local.set({ bgImage: reader.result }); }
        catch { bgImgMsg.textContent = "이미지가 너무 큼"; }
      };
      reader.onerror = () => { bgImgMsg.textContent = "이미지를 읽을 수 없음"; };
      reader.readAsDataURL(f);
    });

    const KEYS = ["kakaoMode", "theme", "fontSize", "bgColor", "bgImage"];
    const sync = ({ kakaoMode, theme, fontSize, bgColor: bc, bgImage }) => {
      kakao.checked = !!kakaoMode;
      const t = theme || "light";
      radios.forEach((r) => { r.checked = r.value === t; });
      fontRange.value = Number(fontSize) > 0 ? Number(fontSize) : 16;
      if (bc) bgColor.value = bc; // 색 input 은 '없음'을 못 나타내므로 값이 있을 때만 반영.
      // 업로드 data-URL 은 URL 칸에 넣지 않는다(지우기 버튼으로 해제). 순수 URL 문자열만 표시.
      bgImgUrl.value = typeof bgImage === "string" && !bgImage.startsWith("data:") ? bgImage : "";
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

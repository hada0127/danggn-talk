// danggn-talk 외형 적용: 글씨 크기·배경색·배경 이미지를 채팅에 반영한다(팝업 창에서만).
// CSS 는 선언형이라 컨테이너가 다시 생겨도 자동 적용된다 — 폴링 없이 storage 변경만 구독한다.
// storage 키: fontSize(number,px) / bgColor(string|null) / bgImage(string|null, data-URL 또는 URL).
(() => {
  const K = (window.__kkt = window.__kkt || {});
  const KEYS = ["fontSize", "bgColor", "bgImage"];

  function ensureStyle() {
    let s = document.getElementById("kkt-appearance-style");
    if (!s) {
      s = document.createElement("style");
      s.id = "kkt-appearance-style";
      (document.head || document.documentElement).appendChild(s);
    }
    return s;
  }

  // CSS 값에 쓰기 안전하지 않은 문자(따옴표·괄호·역슬래시·개행)를 제거해 url()·배경색 주입을 막는다.
  function cssSafe(v) {
    return String(v).replace(/["'()\\\n\r]/g, "");
  }

  function render({ fontSize, bgColor, bgImage }) {
    const size = Number(fontSize) > 0 ? Number(fontSize) : 16;
    // 글씨 크기: CSS 변수로 두고 말풍선 텍스트에 적용(카톡 스킨 on/off 무관).
    let css = `:root { --kkt-font-size: ${size}px; }\n` +
      `html.kkt-popup p.message-box { font-size: var(--kkt-font-size) !important; }\n`;

    // 배경색/이미지: 카톡 스킨의 --kkt-bg(!important)보다 높은 우선순위(:root.kkt-popup)로 덮는다.
    // 둘 다면 이미지가 색 위에. 둘 다 없으면 규칙을 안 내보내 당근/카톡 기본이 보인다.
    const decls = [];
    if (bgColor) decls.push(`background-color: ${cssSafe(bgColor)} !important`);
    if (bgImage) {
      decls.push(`background-image: url("${cssSafe(bgImage)}") !important`);
      decls.push("background-size: cover !important");
      decls.push("background-position: center !important");
    }
    if (decls.length) {
      css += ":root.kkt-popup .chat-normal-room div:not(.for-containment):has(> .for-containment)" +
        ` { ${decls.join("; ")}; }\n`;
    }
    ensureStyle().textContent = css;
  }

  function refresh() {
    chrome.storage.local.get(KEYS).then(render).catch(() => {});
  }

  K.popup().then((isPopup) => {
    if (!isPopup) return; // 일반 당근 탭에선 외형을 바꾸지 않는다.
    refresh();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && KEYS.some((k) => k in changes)) refresh();
    });
  });
})();

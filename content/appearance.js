// danggn-talk 외형 적용: 글씨 크기·배경색을 채팅에 반영한다(팝업 창에서만).
// CSS 는 선언형이라 컨테이너가 다시 생겨도 자동 적용된다 — 폴링 없이 storage 변경만 구독한다.
// storage 키: fontStep(-2~+2, 당근 기본 14px 대비) / bgColor(string|null).
(() => {
  const K = (window.__kkt = window.__kkt || {});
  const KEYS = ["fontStep", "bgColor"];
  const BASE_FONT = 14; // 당근 p.message-box 기본 font-size(번들 실측 2026-11-25)

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

  function render({ fontStep, bgColor }) {
    // 글씨 크기: 기본(0)이면 규칙을 안 내보내 당근 기본 유지. ±1·±2 단계만.
    const step = Math.max(-2, Math.min(2, Math.round(Number(fontStep) || 0)));
    let css = step ? `html.kkt-popup p.message-box { font-size: ${BASE_FONT + step}px !important; }\n` : "";

    // 배경색: 카톡 스킨의 --kkt-bg(!important)보다 높은 우선순위(:root.kkt-popup)로 덮는다. 없으면 스킨/당근 기본.
    if (bgColor) {
      css += ":root.kkt-popup .chat-normal-room div:not(.for-containment):has(> .for-containment)" +
        ` { background: ${cssSafe(bgColor)} !important; }\n`;
    }
    ensureStyle().textContent = css;
  }

  function refresh() {
    chrome.storage.local.get(KEYS).then(render).catch(() => {});
  }

  K.popup().then((isPopup) => {
    if (!isPopup) return; // 일반 당근 탭에선 외형을 바꾸지 않는다.
    // 옛 키 정리: 배경 이미지 기능 삭제, 글씨 크기는 px(fontSize) → 단계(fontStep)로 바뀜.
    chrome.storage.local.remove(["bgImage", "fontSize"]).catch(() => {});
    refresh();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && KEYS.some((k) => k in changes)) refresh();
    });
  });
})();

// danggn-talk 더블클릭 토글: 빈 배경을 더블클릭하면 스킨 ↔ 기본 모양을 오간다(팝업 창에서만).
// 끌 때 고른 스킨을 lastTheme 에 기억했다가 다시 켤 때 되돌린다.
(() => {
  const K = (window.__kkt = window.__kkt || {});

  // 입력·버튼·링크·이미지·말풍선·모달/팝업 루트·설정 패널 위 더블클릭은 토글하지 않는다.
  const SKIP = "textarea, input, button, a, select, img, [role='button']," +
    " .message-box, .message-wrapper, .message-date, #kkt-settings, #modalRoot, #popupRoot";

  function isInteractive(t) {
    if (!t || !t.closest) return true;
    return !!t.closest(SKIP);
  }

  K.popup().then((isPopup) => {
    if (!isPopup) return;
    document.addEventListener("dblclick", (e) => {
      if (isInteractive(e.target)) return;
      chrome.storage.local.get(["theme", "lastTheme"]).then(({ theme, lastTheme }) => {
        const on = theme && theme !== "default";
        chrome.storage.local.set(on ? { theme: "default", lastTheme: theme, bgColor: null }
          : { theme: lastTheme || "light", bgColor: null });
      });
    });
  });
})();

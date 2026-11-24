// 당근톡 테마: storage 의 kakaoMode/theme 를 body 클래스로 반영한다(팝업 창에서만).
(() => {
  const K = (window.__kkt = window.__kkt || {});
  const THEMES = ["light", "dark", "excel"];

  function apply(kakaoMode, theme) {
    const b = document.body;
    if (!b) return;
    b.classList.toggle("kkt-kakao", !!kakaoMode);
    const t = THEMES.includes(theme) ? theme : "light";
    THEMES.forEach((name) => b.classList.toggle("kkt-theme-" + name, name === t));
  }

  function refresh() {
    chrome.storage.local.get(["kakaoMode", "theme"]).then(({ kakaoMode, theme }) => {
      apply(kakaoMode, theme);
    });
  }

  K.popup().then((isPopup) => {
    if (!isPopup) return; // 일반 당근 탭에선 테마를 적용하지 않는다.
    refresh();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && ("kakaoMode" in changes || "theme" in changes)) refresh();
    });
  });
})();

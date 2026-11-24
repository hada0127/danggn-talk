// 당근톡 레이아웃: 팝업 창이면 html 에 kkt-popup 클래스만 붙인다.
// 전역 헤더 숨김은 themes/kakao.css 의 html.kkt-popup 규칙이 한다(JS 탐색·재적용 불필요).
(() => {
  const K = (window.__kkt = window.__kkt || {});
  K.popup().then((isPopup) => {
    if (isPopup) document.documentElement.classList.add("kkt-popup");
  });
})();

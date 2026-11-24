// 당근톡 DOM 접근 계층: 시맨틱 셀렉터 상수 + 안전 조회 + 요소 탐색 + 팝업 모드 질의.
// emotion css-xxxxxx 해시 클래스는 쓰지 않는다(배포마다 바뀜).
(() => {
  const K = (window.__kkt = window.__kkt || {});

  K.sel = {
    messageWrapper: ".message-wrapper",
    fileInput: ".option-wrapper input[type=file]"
  };

  // 셀렉터가 깨져도 당근 기본 동작을 해치지 않도록 모든 조회는 예외를 삼킨다.
  K.q = (sel, root) => {
    try { return (root || document).querySelector(sel); } catch { return null; }
  };

  // 스크롤 컨테이너: .message-wrapper 조상 중 overflowY 가 auto|scroll 이고
  // 실제로 스크롤되는(scrollHeight > clientHeight + 20) 첫 엘리먼트. 해시 클래스로 잡지 않는다.
  K.findScrollContainer = () => {
    const anchor = K.q(K.sel.messageWrapper);
    if (!anchor) return null;
    let el = anchor.parentElement;
    while (el && el !== document.body) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 20) return el;
      el = el.parentElement;
    }
    return null;
  };

  // 업로드용 파일 input: .option-wrapper 안의 것. 못 찾으면 null(붙여넣기는 당근 기본 동작 유지).
  K.findFileInput = () => K.q(K.sel.fileInput);

  // 이 탭이 당근톡 팝업 창인지 background 에 1회 질의하고 결과를 메모이즈한다.
  let popupPromise;
  K.popup = () =>
    popupPromise ||
    (popupPromise = new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: "IS_PLUS_POPUP" }, (r) => {
          void chrome.runtime.lastError;
          resolve(!!(r && r.isPopup));
        });
      } catch {
        resolve(false);
      }
    }));
})();

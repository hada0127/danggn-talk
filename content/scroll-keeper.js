// 당근톡 스크롤 키퍼: 당근이 강제로 스크롤을 움직였을 때만 보던 위치로 되돌린다.
// flex-direction:row 라 바닥 append 시 네이티브가 위치를 유지하므로 scrollTop 보정은 하지 않는다.
// 팝업/일반 탭 공통. 컨테이너가 없거나 끊기면 다시 찾아 재부착한다(포기하지 않음).
(() => {
  const K = (window.__kkt = window.__kkt || {});

  let container = null;
  let observer = null;
  let lastTop = 0;
  let wasAtBottom = true;
  let restoring = false;

  const atBottom = (c) => c.scrollHeight - c.scrollTop - c.clientHeight < 80;

  function onScroll() {
    if (restoring) return; // 위치 복원이 유발한 scroll 은 기준값을 덮지 않는다.
    lastTop = container.scrollTop;
    wasAtBottom = atBottom(container);
  }

  function onMutate() {
    if (wasAtBottom) return; // 바닥을 보고 있었으면 네이티브가 바닥을 따라가게 둔다.
    if (container.scrollTop === lastTop) return; // 당근이 강제 스크롤 안 했으면 무해.
    restoring = true;
    container.scrollTop = lastTop; // 저장해 둔 위치로 복원.
    requestAnimationFrame(() => { restoring = false; });
  }

  function attach(c) {
    container = c;
    lastTop = c.scrollTop;
    wasAtBottom = atBottom(c);
    c.addEventListener("scroll", onScroll, { passive: true });
    observer = new MutationObserver(onMutate);
    observer.observe(c, { childList: true, subtree: true });
  }

  function detach() {
    if (observer) { observer.disconnect(); observer = null; }
    if (container) { container.removeEventListener("scroll", onScroll); container = null; }
  }

  // 1초 폴링: 붙어 있고 살아 있으면 아무것도 안 한다(검색 멈춤). 끊기면 다시 찾아 붙인다.
  setInterval(() => {
    if (container && container.isConnected) return;
    if (container) detach();
    const c = K.findScrollContainer();
    if (c) attach(c);
  }, 1000);
})();

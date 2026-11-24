// 당근톡 스크롤 키퍼: 상대 메시지에 바닥으로 끌려간 경우에만 이전 위치로 복원한다.
// 내 전송(마지막이 내 메시지)·과거 메시지 prepend·방 전환은 복원하지 않는다. 방 전환은 pathname 리셋으로 처리.
// flex-direction:row 라 바닥 append 시 네이티브가 위치를 유지하므로 scrollTop 보정은 하지 않는다.
// 팝업/일반 탭 공통. 컨테이너가 없으면 다시 찾아 재부착한다(포기하지 않음).
(() => {
  const K = (window.__kkt = window.__kkt || {});

  let container = null;
  let observer = null;
  let lastTop = 0;
  let wasAtBottom = true;
  let restoring = false;
  let lastPath = location.pathname;

  const atBottom = (c) => c.scrollHeight - c.scrollTop - c.clientHeight < 80;

  function onScroll() {
    if (restoring) return; // 위치 복원이 유발한 scroll 은 기준값을 덮지 않는다.
    lastTop = container.scrollTop;
    wasAtBottom = atBottom(container);
  }

  function onMutate() {
    // 방 전환: 첫 변이는 새 방의 초기 스크롤이므로 건드리지 않고 기준만 리셋.
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      wasAtBottom = true;
      return;
    }
    if (wasAtBottom) return; // 바닥을 보고 있었으면 네이티브가 바닥을 따라가게 둔다.
    // 올려둔 상태였는데 지금 바닥 근처고 실제로 내려갔으면 = 당근이 바닥으로 끌고 내려감 → 보던 위치로 복원.
    // (scrollTop 이 안 움직인 변이, 예: 콘텐츠 축소는 제외)
    if (atBottom(container) && container.scrollTop !== lastTop) {
      // 마지막이 내 메시지면 내가 보낸 것 → 바닥을 보여준다(복원하지 않음).
      const rows = container.querySelectorAll(K.sel.containment);
      const last = rows[rows.length - 1];
      if (last && !last.classList.contains("left")) return;
      restoring = true;
      container.scrollTop = lastTop;
      requestAnimationFrame(() => { restoring = false; });
    }
    // 그 외(prepend·앵커링 등 바닥으로 안 간 변이)는 그대로 둔다.
  }

  function attach(c) {
    container = c;
    lastTop = c.scrollTop;
    wasAtBottom = atBottom(c);
    lastPath = location.pathname;
    c.addEventListener("scroll", onScroll, { passive: true });
    observer = new MutationObserver(onMutate);
    observer.observe(c, { childList: true, subtree: true });
  }

  function detach() {
    if (observer) { observer.disconnect(); observer = null; }
    if (container) { container.removeEventListener("scroll", onScroll); container = null; }
  }

  // 1초 폴링: 붙어 있고 살아 있으면 아무것도 안 한다(검색 멈춤). 컨테이너가 사라지면 다시 찾아 붙인다.
  // 방 전환으로 같은 컨테이너가 재사용되면 isConnected 로는 못 잡지만 onMutate 의 pathname 리셋이 처리한다.
  setInterval(() => {
    if (container && container.isConnected) return;
    if (container) detach();
    const c = K.findScrollContainer();
    if (c) attach(c);
  }, 1000);
})();

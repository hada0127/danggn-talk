// danggn-talk 스킨: storage 의 theme/hideAvatars 를 body 클래스로 반영한다(팝업 창에서만).
// theme = "default"(당근 기본, 스킨 없음) | THEMES. THEMES 면 body.kkt-kakao + body.kkt-theme-<이름>.
(() => {
  const K = (window.__kkt = window.__kkt || {});
  const THEMES = ["light", "dark", "excel", "claude", "chatgpt"];

  function apply(theme, hideAvatars) {
    const b = document.body;
    if (!b) return;
    const t = THEMES.includes(theme) ? theme : null; // 모르는 값·"default"·없음 = 기본
    b.classList.toggle("kkt-kakao", !!t);
    THEMES.forEach((name) => b.classList.toggle("kkt-theme-" + name, name === t));
    b.classList.toggle("kkt-hide-avatars", !!hideAvatars);
  }

  async function refresh() {
    const { kakaoMode, theme, hideAvatars, skinV2 } =
      await chrome.storage.local.get(["kakaoMode", "theme", "hideAvatars", "skinV2"]);
    // 옛 저장값 1회 이관(skinV2 표식 없음 = 옛 방식): 옛날엔 kakaoMode 가 참일 때만 스킨이 보였으므로
    // 참이면 고른 테마 유지, 아니면(false·없음) "기본".
    let t = theme;
    if (!skinV2) {
      t = kakaoMode ? (THEMES.includes(theme) ? theme : "light") : "default";
      const patch = { theme: t, skinV2: true };
      if (THEMES.includes(theme)) patch.lastTheme = theme; // 켜 둔/꺼 둔 스킨 모두 더블클릭 복귀용으로 보존
      await chrome.storage.local.set(patch);
      await chrome.storage.local.remove("kakaoMode");
      // 값이 같으면 onChanged 가 안 오므로 여기서 바로 적용한다.
    }
    apply(t, hideAvatars);
  }

  K.popup().then((isPopup) => {
    if (!isPopup) return; // 일반 당근 탭에선 스킨을 적용하지 않는다.
    refresh().catch(() => {});
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && ("theme" in changes || "hideAvatars" in changes)) refresh().catch(() => {});
    });
  });
})();

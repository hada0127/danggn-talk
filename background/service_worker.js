// danggn-talk background: 채팅 팝업 창을 열고, 어느 창이 팝업인지 식별한다.
const URL_PREFIX = "https://chat.daangn.com/";

// chat.daangn.com URL 하나를 메뉴바 없는 팝업 창으로 연다.
async function openPopupWindow(url) {
  try {
    await chrome.windows.create({ url, type: "popup", width: 760, height: 720 });
    return { ok: true };
  } catch {
    return { ok: false, reason: "창 열기 실패" };
  }
}

// 저장된 chatUrl 을 검증해 팝업으로 연다(주소 입력 폼의 OPEN_CHAT_WINDOW 용).
async function openChatWindow() {
  const { chatUrl } = await chrome.storage.local.get("chatUrl");
  if (!chatUrl || !chatUrl.startsWith(URL_PREFIX)) return { ok: false, reason: "주소 없음" };
  return openPopupWindow(chatUrl);
}

// 툴바 아이콘 클릭: 열려 있는 당근 방을 주소 입력 없이 그대로 팝업으로 띄운다.
chrome.action.onClicked.addListener(async (tab) => {
  // 1) 지금 탭이 당근 채팅이면 그 URL 을 팝업으로. 단 이미 팝업 창 안이면 또 띄우지 않는다(루프 방지).
  if (tab && tab.url && tab.url.startsWith(URL_PREFIX)) {
    const w = await chrome.windows.get(tab.windowId).catch(() => null);
    if (w && w.type === "popup") return;
    await openPopupWindow(tab.url);
    return;
  }
  // 2) 아니면 저장된 chatUrl 로 폴백.
  const { chatUrl } = await chrome.storage.local.get("chatUrl").catch(() => ({}));
  if (chatUrl && chatUrl.startsWith(URL_PREFIX)) {
    await openPopupWindow(chatUrl);
    return;
  }
  // 3) 그것도 없으면 주소 입력 폼(action/popup.html)을 작은 창으로 연다.
  await chrome.windows.create({
    url: chrome.runtime.getURL("action/popup.html"),
    type: "popup",
    width: 340,
    height: 320
  }).catch(() => {});
});

// 요청을 보낸 탭이 type:"popup" 창에 있으면 danggn-talk 팝업으로 본다(별도 id 저장 불필요).
async function isPlusPopup(sender) {
  if (!sender.tab) return false;
  const w = await chrome.windows.get(sender.tab.windowId).catch(() => null);
  return !!w && w.type === "popup";
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "OPEN_CHAT_WINDOW") {
    openChatWindow().then(sendResponse);
    return true; // 비동기 응답
  }
  if (msg && msg.type === "IS_PLUS_POPUP") {
    isPlusPopup(sender).then((isPopup) => sendResponse({ isPopup }));
    return true;
  }
});

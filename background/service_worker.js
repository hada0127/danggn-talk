// 당근톡 background: 채팅 팝업 창을 열고, 어느 창이 팝업인지 식별한다.
const URL_PREFIX = "https://chat.daangn.com/";

async function openChatWindow() {
  const { chatUrl } = await chrome.storage.local.get("chatUrl");
  if (!chatUrl || !chatUrl.startsWith(URL_PREFIX)) return { ok: false, reason: "주소 없음" };
  try {
    await chrome.windows.create({
      url: chatUrl,
      type: "popup",
      width: 760,
      height: 720
    });
    return { ok: true };
  } catch {
    return { ok: false, reason: "창 열기 실패" };
  }
}

// 요청을 보낸 탭이 type:"popup" 창에 있으면 당근톡 팝업으로 본다(별도 id 저장 불필요).
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

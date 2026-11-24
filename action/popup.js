// 당근톡 팝업: 채팅 주소를 저장하고 팝업 창 열기를 요청한다.
const PREFIX = "https://chat.daangn.com/";
const urlInput = document.getElementById("url");
const openBtn = document.getElementById("open");
const msg = document.getElementById("msg");

chrome.storage.local.get("chatUrl").then(({ chatUrl }) => {
  if (chatUrl) urlInput.value = chatUrl;
});

function save() {
  return chrome.storage.local.set({ chatUrl: urlInput.value.trim() });
}

urlInput.addEventListener("change", save);

openBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url.startsWith(PREFIX)) {
    msg.textContent = "chat.daangn.com 주소만 열 수 있어요.";
    return;
  }
  msg.textContent = "";
  await save(); // 저장이 끝난 뒤에 창 열기를 요청(background 가 저장된 주소를 읽는다).
  chrome.runtime.sendMessage({ type: "OPEN_CHAT_WINDOW" }, (r) => {
    void chrome.runtime.lastError;
    if (!r || !r.ok) msg.textContent = "열 수 없어요: " + ((r && r.reason) || "오류");
    else window.close();
  });
});

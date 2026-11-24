// 당근톡 이미지 붙여넣기: 클립보드 이미지를 당근 파일 input 에 넣는다.
// ⚠ 당근은 파일 input 이 바뀌면 미리보기 없이 '즉시 전송'한다(당근 고유 동작). 이 확장은
//    주입 경로만 담당하고 즉시전송 여부는 제어하지 않는다.
// 팝업/일반 탭 공통. clipboardRead 권한 없이 native paste 이벤트만 사용.
(() => {
  const K = (window.__kkt = window.__kkt || {});
  const DIRECT = ["image/png", "image/jpeg", "image/gif"]; // 당근 file input accept 와 동일

  function extractImages(e) {
    const dt = e.clipboardData; // 호출부(paste 리스너)가 이미 dt 를 가드한다.
    const out = [];
    if (dt.files && dt.files.length) {
      for (const f of dt.files) if (f.type.startsWith("image/")) out.push(f);
    }
    if (!out.length && dt.items) {
      for (const it of dt.items) {
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) out.push(f);
        }
      }
    }
    return out;
  }

  // accept 에 없는 형식(webp 등)은 canvas 로 png 변환.
  function toPng(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => {
          URL.revokeObjectURL(url);
          resolve(b ? new File([b], "pasted.png", { type: "image/png" }) : null);
        }, "image/png");
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  async function normalize(files) {
    const out = [];
    for (const f of files) {
      if (DIRECT.includes(f.type)) out.push(f);
      else { const png = await toPng(f); if (png) out.push(png); }
    }
    return out;
  }

  function inject(input, files) {
    const dtf = new DataTransfer();
    files.forEach((f) => dtf.items.add(f));
    input.files = dtf.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  document.addEventListener("paste", async (e) => {
    const dt = e.clipboardData;
    if (!dt) return;
    // 텍스트+HTML 동시 포함(엑셀 셀·Office 복사)은 이미지로 가로채지 않고 그대로 통과시킨다.
    const types = [...dt.types];
    if (types.includes("text/plain") && types.includes("text/html")) return;
    const input = K.findFileInput();
    if (!input) return; // 업로드 input 못 찾으면 당근 기본 동작 유지
    const imgs = extractImages(e);
    if (!imgs.length) return; // 붙여넣은 이미지가 없으면(순수 텍스트 등) 당근 기본 동작 유지
    e.preventDefault();
    const norm = await normalize(imgs);
    if (norm.length) inject(input, norm);
  });
})();

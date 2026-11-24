# danggn-talk — 구현 계획 (승인됨 2026-11-24)

확장 이름 **danggn-talk**. chat.daangn.com 용 크롬 MV3 확장. 기존 2개 확장 통합(이미지 클립보드 붙여넣기 + 스크롤 위치 유지). 핵심 = 사용자가 입력한 채팅 주소를 메뉴바 없는 작은 팝업 창으로 띄우고, 선택한 방의 채팅만(+⚙ 설정) 보이게(목록 컬럼은 팝업에서 숨김), 더블클릭으로 카톡 스킨 토글(라이트/다크/엑셀 테마).

## 확정 결정(열린 질문 처리 포함)
- 주소 **1개**만 저장(단순). 
- 설정 패널에 **테마 선택 + 카톡/기본 모드 토글** 둘 다(더블클릭 발견성 보완).
- 엑셀 테마 = 스프레드시트 느낌 색/격자 **스킨**(레이아웃 리맵 아님).
- 팝업 기본 **760×720**, 리사이즈 가능(채팅 중심이지만 메시지·이미지에 420 폭은 좁아 상향).
- 테마 스킨만: 당근 레이아웃 유지, CSS 오버레이.
- emotion `css-xxxx` 해시 셀렉터 금지. 시맨틱 클래스/구조/computed로만.

## 설계 결정
1. **창 띄우기** = `chrome.windows.create({ url: chatUrl, type:"popup", width:760, height:720 })`. type:popup = 메뉴바/주소창 없는 창. chat.daangn.com 직접 로드 → 쿠키 공유로 로그인 유지. (iframe 방식은 X-Frame-Options·cross-origin 주입 불가로 폐기.)
2. **팝업 레이아웃** = 당근 기존 2컬럼 중 **채팅 컬럼(`.chat-normal-room` 포함 `section`)만** 보이고, **목록 컬럼은 팝업에서 숨김**(`html.kkt-popup` 게이트 CSS, `:has()` 구조로 '방 링크를 품고 뒤 형제가 채팅방인 div' 타겟). 전역 `HEADER` 도 숨김. 설정(⚙)은 content script 가 주입(모서리 고정 버튼/접이식). ※ `MAIN.body>div:last-child` 는 채팅 컬럼이 아니라 하단 PC알림 배너라 쓰지 않는다(아래 karrot-dom-findings 참고).
3. **더블클릭 토글** = 빈 배경/헤더영역 더블클릭 시 `body.kkt-kakao` 토글, `chrome.storage.local.kakaoMode` 저장. textarea/input/button/a/말풍선 내부 더블클릭은 무시.
4. **테마 CSS** = `themes/kakao.css` 항상 주입, 스킨 규칙은 `body.kkt-kakao` 게이트(예외: 팝업 헤더 숨김 `html.kkt-popup header:has(+ main.body)`). 테마별 색은 CSS 변수(`body.kkt-theme-light|dark|excel` 가 `--kkt-*` 변수만 교체). 말풍선 나/상대 = `.for-containment:not(.left)`(나, bare 연속분 포함)/`.for-containment.left`(상대) 기준.
5. **이미지 붙여넣기** = paste 이벤트 가로채 image blob → `.option-wrapper input[type=file]`(accept png/jpeg/gif, multiple)에 DataTransfer 로 주입 + change dispatch. webp 는 png 변환 또는 제외. clipboardRead 권한 불필요(native paste).
6. **스크롤 키퍼** = 스크롤 컨테이너(`.message-wrapper` 조상 중 첫 overflow-y:auto+스크롤되는 것)에 MutationObserver. flex-direction:row 라 바닥 append 시 네이티브가 위치를 유지하므로 scrollTop 보정은 안 한다. scroll 이벤트로 `lastTop`·`wasAtBottom` 저장, 변이 시 바닥이었으면 no-op, 아니면 당근이 바닥으로 끌고 내려갔을 때만 `scrollTop=lastTop` 복원하되 마지막이 내 메시지면(내 전송) 복원하지 않고 바닥을 보여준다. 방 전환은 pathname 리셋으로 처리. 컨테이너가 끊기면(방 전환/지연 로드) 재탐색·재부착(1초 폴링, 포기 없음).

## 파일 구성 (MV3)
- `manifest.json` — MV3, minimum_chrome_version:"105"(:has() 요건), permissions:["storage","activeTab"](activeTab=아이콘 클릭 시 탭 URL 읽기용, host_permissions 불필요), action(default_popup 제거 → onClicked), background.service_worker, content_scripts(js 순서: selectors→theme→appearance→popup-layout→settings-panel→popup-controls→double-click→scroll-keeper→paste-image, css:[themes/kakao.css], run_at:document_idle)
- `action/popup.html`, `action/popup.js` — 주소 입력·저장·"창 열기"
- `background/service_worker.js` — OPEN_CHAT_WINDOW 처리(windows.create, 실패 시 {ok:false}), IS_PLUS_POPUP 판정(sender 탭의 창을 windows.get 해 `type==='popup'` 확인 — 창 id 저장 불필요)
- `content/selectors.js` — 시맨틱 셀렉터 상수 + 안전조회 헬퍼(실패해도 당근 기본 무손상)
- `content/popup-layout.js` — isPopup 일 때 html 에 `kkt-popup` 클래스만 추가(헤더 숨김은 CSS)
- `content/theme.js` — body kkt-* 클래스 적용, storage.onChanged 구독
- `content/appearance.js` — 글씨 크기·배경색·배경 이미지 적용(팝업 전용)
- `content/settings-panel.js` — 테마 선택 + 모드 토글 + 글씨/배경 설정 UI 주입(위치는 popup-controls 소유)
- `content/popup-controls.js` — ‹ 뒤로 버튼 + 목록/채팅 토글 + 제목 줄 버튼 배치(팝업 전용)
- `content/double-click-toggle.js` — kakaoMode 토글
- `content/scroll-keeper.js` — 스크롤 위치 유지
- `content/paste-image.js` — 붙여넣기 업로드 주입
- `themes/kakao.css` — 카톡 스킨
- 아이콘 `icons/` (16/48/128) — 플레이스홀더 생성

## storage 스키마 (chrome.storage.local)
- `chatUrl: string` (검증: https://chat.daangn.com/ 로 시작할 때만 열기)
- `kakaoMode: boolean` (기본 false)
- `theme: "light"|"dark"|"excel"` (기본 light)
- `fontSize: number` (말풍선 글씨 크기 px, 기본 16, 범위 12–22)
- `bgColor: string|null` (채팅 배경색 hex, null=해제)
- `bgImage: string|null` (채팅 배경 이미지 URL 또는 업로드 data-URL, null=해제. ⚠ 큰 data-URL 은 storage.local 쿼터(약 10MB)를 넘을 수 있어 set 을 try/catch, 실패 시 이전 값 유지 + "이미지가 너무 큼" 안내)

## 추가 기능 (2026-11-25)
1. **아이콘 클릭 팝아웃** — `action.default_popup` 제거 → `chrome.action.onClicked`. 현재 탭이 chat.daangn.com 이면 그 방 URL 을 그대로 760×720 팝업으로(이미 팝업 창이면 무시=루프 방지), 아니면 저장된 `chatUrl` 폴백, 둘 다 없으면 주소 입력 폼(action/popup.html)을 340×320 창으로. 탭 URL 확인용 `activeTab` 권한 추가(host_permissions 없음).
2. **제목 줄 컨트롤**(`content/popup-controls.js`, 팝업 전용) — ‹ 뒤로 버튼 주입 + ‹ 와 기존 ⚙(#kkt-settings)을 방 제목 줄(.group-title)에 올림. ‹ 는 왼쪽, ⚙ 는 ⋮(.more-button-wrapper) 왼쪽. .group-title rect 로 세로 중앙 계산, resize·1초 폴링(움직였을 때만)·방 전환 때 재배치. .group-title 이 안 보이면 둘 다 숨김. 위치는 popup-controls 가 소유(settings-panel 의 #kkt-settings top/right 제거), 패널 UI·핸들러는 settings-panel 유지.
3. **목록/채팅 토글** — ‹ 가 `html.kkt-list` 토글. kkt-list 면 목록 컬럼을 꽉 채우고(B3 숨김 되돌림) 채팅 컬럼 숨김. pathname 이 /room/ 으로 바뀌면(방 선택) kkt-list 해제. ‹ 는 목록 보기에선 숨김.
4. **외형 설정**(`content/appearance.js`, 팝업 전용) — 설정 패널의 글씨 크기·배경색·배경 이미지를 채팅에 적용. 글씨=`--kkt-font-size` 변수→`p.message-box`. 배경=스크롤 컨테이너에 `:root.kkt-popup` 로 카톡 `--kkt-bg` 보다 높은 명시도로 덮음(둘 다면 이미지가 색 위). CSS 는 선언형이라 폴링 없이 storage.onChanged 만 구독.

## 메시지 패싱
- action popup → background: `{type:"OPEN_CHAT_WINDOW"}`
- content → background: `{type:"IS_PLUS_POPUP"}` → `{isPopup}`
- 테마 전파는 storage.onChanged 로(메시지 최소화)

## graceful degradation (상시)
- 모든 content 기능은 셀렉터 실패 시 조용히 no-op. 당근 기본 채팅 동작을 절대 깨지 않는다.
- isPopup 아닌 일반 당근 탭에선 헤더 숨김·레이아웃 변경 안 함(설정 패널/테마는 팝업에서만).

## 리스크
- T(paste-image) high: 업로드 경로는 file input 로 확인됨(완화). webp 처리 주의.
- 스크롤/레이아웃 normal, 테마/패널/더블클릭/selectors low.

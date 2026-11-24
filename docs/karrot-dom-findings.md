# 당근 채팅(chat.daangn.com) DOM 조사 — 테마 스킨 설계 근거

조사일 2026-11-24, Claude in Chrome 으로 실제 로그인 세션에서 확인.
표본 방 URL 형식: `https://chat.daangn.com/room/<roomId>`

## 전역 구조
- `document.body.className = "light-theme"` ← 당근 자체 테마 클래스가 body 에 있음. 네이티브 dark-theme 존재 여부 미확인(스타일시트에 dark-theme 규칙 수 확인하다 출력 잘림).
- `#root > div > div.css-1mnz5cs`
  - `HEADER.css-19lthbi` → 전역 당근 헤더(로고 + 프로필). **팝업 창에서 숨길 대상.**
  - `MAIN.body` (flex, 자식을 가운데 정렬)
    - `div` (wrapper, 해시 css-143d18r) — 안에 3영역:
      - `div` (빈/아이콘 레일)
      - `div` (목록 컬럼, 해시 css-so5s0) — 방 목록 `a[href*="/room/"]`, `.chat-normal-room` **없음**
      - `section` (채팅 컬럼, 해시 css-am8mw7) — `.chat-normal-room` 포함, 선택한 방의 메시지+입력
    - `div` (하단 PC알림 배너) — ★ 과거 'MAIN.body > div:last-child = 채팅 컬럼'은 **틀림**. 이 마지막 자식은 채팅이 아니라 하단 PC알림 배너다.
  - 정정: **채팅 컬럼 = `.chat-normal-room` 을 품은 `section`**. **메시지 스크롤 컨테이너 = `.for-containment` 행을 직속 자식으로 가진 div**(표본 해시 css-13cllyv, 해시로 쓰지 말 것). 스크롤 컨테이너 안에는 **중첩 `.for-containment`(행 안에 또 `.for-containment`)가 있는 메시지 행도 존재** → 스크롤 컨테이너만 잡으려면 `:not(.for-containment)` 로 그 행을 배제.
  - `#popupRoot`, `#modalRoot` 별도 루트 존재.
- `css-xxxxxx` 는 emotion(CSS-in-JS) 해시 → **배포마다 바뀜. 셀렉터로 쓰면 안 됨.** 시맨틱 클래스/구조로 타겟할 것.

## 안정적으로 보이는 시맨틱 셀렉터
| 용도 | 셀렉터 |
|---|---|
| 방 목록 아이템 | `a[href*="/room/"]` (선택됨: `a.selected`) |
| 방 이름 | `.preview-nickname` |
| 인원수 | `.member-count` |
| 마지막 메시지 미리보기 | `.preview-description .description-text` |
| 목록 프로필 이미지 | `img.profile-image` |
| 메시지 한 덩이 | `.message-wrapper` |
| 발신자 닉네임(상대, 시퀀스 첫 줄만) | `.message-wrapper > .nickname` |
| 텍스트 말풍선 | `p.message-box` |
| 스티커 이미지 | `.message-wrapper img[alt="sticker"]` |
| 메시지 날짜 구분선 | `.message-date` |
| 메시지 호버 더보기 버튼 | `.message-wrapper > button.toolbox` |
| 입력 영역 | `.chatform-option-area`, `.chatform-submenu` |
| 입력창 | `textarea` |

## 내 메시지 vs 상대 메시지 구분 (★ 테마 스킨 핵심)
- `.message-wrapper` 의 **부모 `.for-containment`** 가 정렬을 결정(아래 선조사 #3 전수 재확인 기준):
  - 상대: 부모 `.for-containment.left` → `justifyContent === "start"`
  - 나: 부모 `.for-containment:not(.left)`(bare 연속분 포함) → `justifyContent === "flex-end"`
- **해시에 의존하지 말고 `.for-containment`/`.left` 클래스 또는 `justify-content` computed 값으로 구분**하면 배포 변경에 강함.
- 상대 메시지는 시퀀스 첫 줄에만 `.nickname` 과 프로필이 붙고, 이어지는 메시지는 생략됨.

## 메시지 말풍선 내부 구조(예)
```
.message-wrapper
  .nickname          (상대 시퀀스 첫 줄만)
  div
    p.message-box    (텍스트)   또는
    img[alt=sticker] (스티커)   또는  img (이미지 첨부)
  button.toolbox     (호버 시 더보기)
```

## 입력/업로드
- 입력 하단 `.chatform-option-area` 에 이미지/앨범 아이콘, 텍스트 버튼, 이모지 버튼, 우측 `0/1000` 글자수 + `전송` 버튼.
- 이미지 전송은 파일 선택(file input) 경로로 추정 → 클립보드 붙여넣기 기능은 paste 이벤트를 가로채 해당 file input/업로드 경로에 blob 주입 방식으로 구현 필요(실구현 시 file input·업로드 API 를 코드 워커가 직접 확인).

## 선조사 결과 (2026-11-24 로그인 세션에서 확인, 미확인 해소)
1. **이미지 업로드 경로** = `input[type=file]` **정확히 1개**, `accept="image/png, image/jpeg, image/gif"`, `multiple=true`, `.option-wrapper` 안에 존재(화면에 숨겨져 있음). → 클립보드 붙여넣기는 **paste 이벤트에서 image blob 추출 → `DataTransfer` 로 이 file input 의 `.files` 설정 → `change`(필요시 `input`) dispatch**. accept 에 **webp 없음** → webp 는 png 로 변환하거나 png/jpeg/gif 만 허용.
2. **스크롤 컨테이너** = `.message-wrapper` 에서 부모로 올라가 **첫 번째 `overflow-y: auto|scroll` 이고 `scrollHeight > clientHeight` 인 엘리먼트**(표본에선 emotion 해시 `div.css-13cllyv`, sh 2598 > ch 960). **해시로 잡지 말고 트래버설로 찾을 것.**
3. **정렬(나/상대)** = (39개 전수 재확인, 2026-11-24) `.for-containment.left` = **상대**(justify start) 항상, `.for-containment:not(.left)` = **나**(justify flex-end) 항상. left/right 없는 bare `.for-containment` 는 내 연속 메시지(flex-end). → CSS 타겟은 **`.for-containment:not(.left)` = 나(bare 연속분 포함) / `.for-containment.left` = 상대**. (`.right` 만으로 잡으면 내 연속분이 누락됨.)
4. **로그인 유지** = 이미 로그인된 Chrome 세션. 새 창이 chat.daangn.com 을 직접 열면 쿠키 공유로 로그인 유지(표준 동작). 팝업 창도 동일.
5. **네이티브 dark-theme**: body `light-theme` 확인. 우리 스킨은 `kkt-*` 자체 클래스만 쓰므로 당근 네이티브 테마와 격리(설계 불변).

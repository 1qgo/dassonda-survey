# 다쏜다 설문페이지 (설문사이트/)

빌드 없는 정적 페이지. `index.html`을 브라우저로 바로 열어 확인할 수 있다.

## 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 위저드 컨테이너(질문 1개=화면 1개) + 결과/실패 화면 |
| `questions.js` | 35개 화면 데이터(질문·선택지·분기 로직) — `설문설계/*.xlsx` 질문흐름 시트를 그대로 옮김 |
| `script.js` | 위저드 엔진 + 결과 카드 렌더링 + 제출 로직. **배포 후 상수 3개를 채워야 동작한다** |
| `style.css` | 스타일 |
| `privacy.html` | 개인정보처리방침 |
| `gas/설문접수.gs` | Google Apps Script 백엔드 소스 (문서용 — 실제 배포는 아래 절차대로 직접 진행) |

질문을 추가/삭제/수정할 때는 `questions.js`만 고치면 된다 — `script.js`(엔진)나
`gas/설문접수.gs`(핵심컬럼+JSON 스키마)는 건들 필요 없다.

## 배포 절차 (이 저장소는 코드만 준비함 — 아래는 계정 소유자가 직접 진행)

### 1. Google 스프레드시트 + Apps Script 웹앱 만들기

1. 새 Google 스프레드시트 생성 (예: "다쏜다 설문응답")
2. 상단 메뉴 확장 프로그램 → Apps Script
3. `gas/설문접수.gs` 내용을 그대로 붙여넣기
4. `SLACK_WEBHOOK_URL` 상수를 아래 2번에서 발급받은 값으로 교체
5. 배포 → 새 배포 → 유형: 웹 앱
   - 실행 계정: 나
   - 액세스 권한이 있는 사용자: **모든 사용자** (설문페이지에서 로그인 없이 호출해야 하므로)
6. 배포 후 나오는 **웹 앱 URL**을 복사 (`https://script.google.com/macros/s/.../exec` 형태)
7. `설문사이트/script.js`의 `GAS_ENDPOINT` 상수를 이 URL로 교체

### 2. Slack Incoming Webhook 발급

1. Slack 워크스페이스에서 새 채널 생성 (예: `#다쏜다-설문알림`)
2. https://api.slack.com/apps → Create New App → From scratch
3. Incoming Webhooks 활성화 → Add New Webhook to Workspace → 1번 채널 선택
4. 발급된 Webhook URL을 `gas/설문접수.gs`의 `SLACK_WEBHOOK_URL`에 붙여넣고 Apps Script를
   다시 배포(새 버전으로 배포해야 반영됨)

### 3. GitHub Pages 배포

1. GitHub에 새 **공개** 저장소 생성 (예: `dassonda-survey`) — 이 폴더(`설문사이트/`)에는
   개인정보가 들어있지 않으므로 공개 가능
2. 이 폴더(`설문사이트/` 안의 모든 파일)를 새 저장소 루트에 push
   ```
   git init
   git add .
   git commit -m "다쏜다 설문페이지 초기 배포"
   git branch -M main
   git remote add origin <새 저장소 URL>
   git push -u origin main
   ```
3. 새 저장소 Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정
4. 몇 분 후 `https://<github계정>.github.io/<저장소명>/`에서 접속 확인

### 4. 카카오톡 채널 연결

1. business.kakao.com에서 채널 개설 (절차는 `wiki/매장운영/설문페이지-카카오채널-연동.md` 참고)
2. 채널 관리자센터에서 플러스친구 URL 확인 (`https://pf.kakao.com/_XXXXX` 형태)
3. `설문사이트/script.js`의 `KAKAO_CHANNEL_URL` 상수를 이 URL로 교체
4. 재배포(GitHub push)

### 5. 가전렌탈 제품 카탈로그 링크 (아직 미정)

X0에서 "가전렌탈"을 고른 고객에게 보여줄 외부 제품 카탈로그 URL이 아직 없다(사용자 확인,
2026-09-23 — 나중에 연결). 정해지면 `설문사이트/script.js`의 `RENTAL_CATALOG_URL` 상수만
채우면 된다. 비어있는 동안은 "제품 카탈로그 보기" 버튼이 그냥 노출되지 않는다.

## 로컬 확인

브라우저에서 `설문사이트/index.html`을 직접 열면 위저드가 Q0부터 시작한다. `GAS_ENDPOINT`가
placeholder인 상태에서는 마지막 연락처 화면에서 "결과 보기"를 눌러도 실패 화면(카카오
상담 버튼 포함)이 뜨는 게 정상이다 — 1번 절차를 마친 뒤 실제 제출 테스트가 가능하다.
분기·결과 카드 로직은 `GAS_ENDPOINT` 설정과 무관하게 지금도 끝까지 확인할 수 있다.

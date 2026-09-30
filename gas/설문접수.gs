/**
 * 다쏜다 설문페이지(site/index.html) 제출을 받는 Google Apps Script 웹앱.
 *
 * 배포 방법은 site/README.md 참고. 아래 두 상수만 본인 환경에 맞게 채우면 된다:
 *   - SLACK_WEBHOOK_URL: Slack Incoming Webhook URL
 *   - SHEET_NAME: 응답을 쌓을 시트 탭 이름 (없으면 자동 생성)
 *
 * 스키마: 질문(questions.js)이 여러 차례 바뀐 전례가 있어, 컬럼을 고정 나열하지 않고
 * 핵심 컬럼(제출시각/트랙/이름/연락처/한줄요약) + 전체응답(JSON) 컬럼으로 둔다.
 * 질문이 추가/삭제돼도 이 스크립트를 다시 배포할 필요가 없다.
 */

const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/REPLACE/WITH/WEBHOOK";
const SHEET_NAME = "설문응답";

const COLUMNS = ["제출시각", "트랙", "이름", "연락처", "한줄요약", "전체응답(JSON)"];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    appendToSheet(data);
    notifySlack(data);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function buildSummary(data) {
  const a = data.answers || {};
  switch (data.track) {
    case "A.휴대폰":
      return `${a.carrier || "-"} / ${a.change_type || a.device_pref || "-"} / ${a.purchase_type || "-"}`;
    case "I.인터넷·TV":
      return `${a.internet_need_type || "-"} / ${a.internet_bundle || "-"} / ${a.install_area || "-"}`;
    case "B.알뜰폰 등":
      return `${a.sub_line_need || "-"} / ${a.usage_profile || "-"} / ${a.budget_band || "-"}`;
    case "R.가전렌탈":
      return `품목: ${a.rental_item || "-"}`;
    case "V.자동차렌트리스":
      return `${a.auto_type || "-"} / ${a.auto_usage_type || "-"} / ${a.auto_contract_months || "-"}`;
    case "M.이사청소":
      return `${a.moving_service_type || "-"} / ${a.moving_space_size || "-"} / ${a.moving_timing || "-"}`;
    case "S.상조":
      return `${a.funeral_reason || "-"}${a.funeral_urgent === "예" ? " (긴급)" : ""}`;
    default:
      return "-";
  }
}

function appendToSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
  }

  const a = data.answers || {};
  sheet.appendRow([
    data.submittedAt || new Date().toISOString(),
    data.track || "-",
    a.name || "",
    a.phone || "",
    buildSummary(data),
    JSON.stringify(a),
  ]);
}

function notifySlack(data) {
  if (!SLACK_WEBHOOK_URL || SLACK_WEBHOOK_URL.indexOf("REPLACE") !== -1) {
    return; // 웹훅 URL이 아직 설정되지 않은 경우 알림 생략
  }

  const a = data.answers || {};
  const urgentPrefix = data.urgent ? "🚨 [긴급] " : "";
  const text = [
    `${urgentPrefix}📩 새 설문 접수 — ${data.track || "-"}`,
    `이름: ${a.name || "-"}`,
    `연락처: ${a.phone || "-"}`,
    `요약: ${buildSummary(data)}`,
  ].join("\n");

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ text: text }),
    muteHttpExceptions: true,
  });
}

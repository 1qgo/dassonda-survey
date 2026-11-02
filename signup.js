// ===== 배포 후 채워 넣을 값 (1qgo/dassonda 저장소 설문사이트/README.md "가입정보 폼" 참고) =====
// 설문(script.js)과 다른, 가입정보 전용 Apps Script 웹앱 URL이어야 한다.
const SIGNUP_GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwHG_FhJYeMBDyEp2tOe2cshgWXFMesdlrSqw2DQBN3vlYy1XeVmmX1A7scqntAYcOV/exec";
// ======================================================================
//
// 보안 원칙: 입력값을 localStorage/쿠키 등 브라우저에 저장하지 않는다.
// 제출이 끝나면 폼을 즉시 비운다.

const $ = (id) => document.getElementById(id);
const form = $("signupForm");
const errorMsg = $("errorMsg");
const submitBtn = $("submitBtn");

const onlyDigits = (s) => (s || "").replace(/\D/g, "");

// ---------- 입력 자동 서식 ----------

function formatPhone(v) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function formatCard(v) {
  return onlyDigits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1-");
}

function groupLicense(d, sizes) {
  const parts = [];
  let i = 0;
  for (const n of sizes) {
    if (i >= d.length) break;
    parts.push(d.slice(i, i + n));
    i += n;
  }
  return parts.join("-");
}

function bindFormat(id, fn) {
  $(id).addEventListener("input", (e) => { e.target.value = fn(e.target.value); });
}

bindFormat("phone", formatPhone);
bindFormat("cardNo", formatCard);
bindFormat("licenseNo", (v) => onlyDigits(v).slice(0, 10));
bindFormat("rrnFront", (v) => onlyDigits(v).slice(0, 6));
bindFormat("rrnBack", (v) => onlyDigits(v).slice(0, 7));
bindFormat("accountNo", (v) => v.replace(/[^\d-]/g, "").slice(0, 20));

// 앞자리 6자리 다 치면 뒷자리로 자동 이동
$("rrnFront").addEventListener("input", (e) => {
  if (e.target.value.length === 6) $("rrnBack").focus();
});

$("rrnShow").addEventListener("change", (e) => {
  $("rrnBack").type = e.target.checked ? "text" : "password";
});

// ---------- 유효기간 선택지 ----------

(function fillExpiry() {
  const m = $("cardExpMonth");
  for (let i = 1; i <= 12; i++) {
    const v = String(i).padStart(2, "0");
    m.add(new Option(v, v));
  }
  const y = $("cardExpYear");
  const now = new Date().getFullYear();
  for (let i = 0; i <= 10; i++) {
    const full = now + i;
    y.add(new Option(String(full), String(full)));
  }
})();

// 발급일자는 오늘 이후 선택 불가
$("idIssueDate").max = new Date().toISOString().slice(0, 10);

// ---------- 분기(신분증 / 납부방법) ----------

function radioValue(name) {
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function syncBranches() {
  const isLicense = radioValue("idType") === "운전면허증";
  $("idIssueLabel").textContent = isLicense ? "운전면허증 발급일자" : "주민등록증 발급일자";
  $("licenseField").hidden = !isLicense;

  const isCard = radioValue("payMethod") === "카드";
  $("bankFields").hidden = isCard;
  $("cardFields").hidden = !isCard;
}

form.querySelectorAll('input[name="idType"], input[name="payMethod"]').forEach((el) => {
  el.addEventListener("change", syncBranches);
});
syncBranches();

// ---------- 주소 검색 (카카오 우편번호 서비스) ----------

$("addrSearchBtn").addEventListener("click", openPostcode);
$("address1").addEventListener("click", openPostcode);

function openPostcode() {
  if (typeof daum === "undefined" || !daum.Postcode) {
    // 스크립트 로드 실패 시 직접 입력으로 전환
    const a1 = $("address1");
    a1.readOnly = false;
    a1.placeholder = "주소를 직접 입력해 주세요 (도로명 또는 지번)";
    a1.focus();
    return;
  }
  const layer = $("postcodeLayer");
  layer.hidden = false;
  layer.innerHTML = "";
  new daum.Postcode({
    oncomplete(data) {
      const base = data.roadAddress || data.jibunAddress;
      const extra = data.buildingName && data.apartment === "Y" ? ` (${data.buildingName})` : "";
      $("zipcode").value = data.zonecode;
      $("address1").value = base + extra;
      layer.hidden = true;
      $("address2").focus();
    },
    onclose() { layer.hidden = true; },
    width: "100%",
    height: "100%",
  }).embed(layer);
  layer.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ---------- 검증 ----------

function isValidRrn(front, back) {
  if (!/^\d{6}$/.test(front) || !/^\d{7}$/.test(back)) return false;
  const g = Number(back[0]);
  // 1,2: 1900년대 내국인 / 3,4: 2000년대 내국인 / 5~8: 외국인 / 9,0: 1800년대
  const century = { 1: 1900, 2: 1900, 5: 1900, 6: 1900, 3: 2000, 4: 2000, 7: 2000, 8: 2000, 9: 1800, 0: 1800 }[g];
  const yy = century + Number(front.slice(0, 2));
  const mm = Number(front.slice(2, 4));
  const dd = Number(front.slice(4, 6));
  const dt = new Date(yy, mm - 1, dd);
  // 2020-10 이후 발급분은 체크섬이 없으므로 생년월일·성별자리만 확인한다
  return dt.getFullYear() === yy && dt.getMonth() === mm - 1 && dt.getDate() === dd && dt <= new Date();
}

function isValidLicense(v) {
  const kor = v.match(/^([가-힣]{2})\s*(.*)$/);
  if (kor) return onlyDigits(kor[2]).length === 10;
  return onlyDigits(v).length === 12;
}

function luhn(num) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (dbl) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function collect() {
  const idType = radioValue("idType");
  const payMethod = radioValue("payMethod");
  const data = {
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    carrier: $("carrier").value,
    email: $("email").value.trim(),
    zipcode: $("zipcode").value.trim(),
    address1: $("address1").value.trim(),
    address2: $("address2").value.trim(),
    rrn: `${$("rrnFront").value}-${$("rrnBack").value}`,
    idType,
    idIssueDate: $("idIssueDate").value,
    licenseNo: idType === "운전면허증" ? `${$("licenseRegion").value}-${groupLicense(onlyDigits($("licenseNo").value), [2, 6, 2])}` : "",
    payMethod,
  };
  if (payMethod === "은행") {
    data.bankName = $("bankName").value;
    data.accountNo = $("accountNo").value.trim();
  } else {
    data.cardCompany = $("cardCompany").value;
    data.cardNo = $("cardNo").value.trim();
    data.cardExp = `${$("cardExpYear").value}/${$("cardExpMonth").value}`;
  }
  return data;
}

// [필드 id, 오류 메시지] 중 첫 번째 문제를 돌려준다
function validate(d) {
  if (d.name.length < 2) return ["name", "이름을 입력해 주세요."];
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(d.phone)) return ["phone", "전화번호를 정확히 입력해 주세요."];
  if (!d.carrier) return ["carrier", "현재 통신사를 선택해 주세요."];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return ["email", "이메일 주소 형식을 확인해 주세요."];
  if (!d.address1) return ["address1", "주소 검색으로 주소를 입력해 주세요."];
  if (!d.address2) return ["address2", "상세주소(동·호수)를 입력해 주세요."];
  if (!isValidRrn($("rrnFront").value, $("rrnBack").value)) return ["rrnFront", "주민등록번호를 정확히 입력해 주세요."];
  if (d.idType === "운전면허증") {
    if (!$("licenseRegion").value) return ["licenseRegion", "운전면허 지역을 선택해 주세요."];
    if (!isValidLicense(d.licenseNo)) return ["licenseNo", "지역번호를 제외한 운전면허 번호 10자리를 입력해 주세요."];
  }
  if (!d.idIssueDate) return ["idIssueDate", `${d.idType} 발급일자를 입력해 주세요.`];
  if (d.idIssueDate > new Date().toISOString().slice(0, 10)) return ["idIssueDate", "발급일자가 오늘 이후일 수 없습니다."];
  if (d.payMethod === "은행") {
    if (!d.bankName) return ["bankName", "은행을 선택해 주세요."];
    const n = onlyDigits(d.accountNo).length;
    if (n < 10 || n > 16) return ["accountNo", "계좌번호를 확인해 주세요. (10~16자리)"];
  } else {
    if (!d.cardCompany) return ["cardCompany", "카드사를 선택해 주세요."];
    const c = onlyDigits(d.cardNo);
    if (c.length < 14 || c.length > 16 || !luhn(c)) return ["cardNo", "카드번호를 확인해 주세요."];
    const [yy, mm] = d.cardExp.split("/");
    if (!yy || !mm) return ["cardExpMonth", "카드 유효기간을 선택해 주세요."];
    const now = new Date();
    if (Number(yy) === now.getFullYear() && Number(mm) < now.getMonth() + 1) {
      return ["cardExpMonth", "유효기간이 지난 카드입니다."];
    }
  }
  if (!$("agreePrivacy").checked) return ["agreePrivacy", "개인정보 수집·이용 및 통신사 제공에 동의해 주세요."];
  if (!$("agreeUnique").checked) return ["agreeUnique", "고유식별정보 처리에 동의해 주세요."];
  return null;
}

function showError(fieldId, msg) {
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  errorMsg.textContent = msg;
  errorMsg.classList.add("show");
  const el = $(fieldId);
  if (el) {
    el.classList.add("invalid");
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

form.addEventListener("input", (e) => e.target.classList.remove("invalid"));

// ---------- 제출 ----------

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = collect();
  const problem = validate(data);
  if (problem) {
    showError(...problem);
    return;
  }
  errorMsg.classList.remove("show");
  submitBtn.disabled = true;
  submitBtn.textContent = "제출 중...";

  const payload = { submittedAt: new Date().toISOString(), consent: true, ...data };

  try {
    const res = await fetch(SIGNUP_GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json().catch(() => ({ ok: true }));
    if (body.ok === false) throw new Error(body.error || "서버 오류");
    form.reset();
    form.style.display = "none";
    $("doneState").classList.add("show");
    window.scrollTo({ top: 0 });
  } catch (err) {
    console.error("가입정보 제출 실패:", err.message);
    form.style.display = "none";
    $("failState").classList.add("show");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "가입 정보 보내기";
  }
});

// 실패 후 다시 시도: 입력값은 그대로 남아 있음(reset은 성공 시에만)
$("retryBtn").addEventListener("click", () => {
  $("failState").classList.remove("show");
  form.style.display = "";
});

// ---------- 전체 동의 ----------
(function bindAgreeAll() {
  const all = $("agreeAll");
  if (!all) return;
  const items = Array.from(document.querySelectorAll(".agree"));
  all.addEventListener("change", () => items.forEach((a) => { a.checked = all.checked; }));
  items.forEach((a) => a.addEventListener("change", () => { all.checked = items.every((x) => x.checked); }));
})();

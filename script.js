// ===== 배포 후 아래 값들만 채워 넣으면 됩니다 (site/README.md 참고) =====
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxx4pmOQ0eoutB26EuE9s2KhMGu-pWR_TdrD4zNU2ney8WmftA2zpq36aQoMovJMcit/exec";
const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_ZFSrX";
const RENTAL_CATALOG_URL = ""; // 가전렌탈 제품 카탈로그 URL — 아직 미정, 정해지면 채워넣기
// ======================================================================

const KAKAO_ADD_URL = KAKAO_CHANNEL_URL + "/friend";
const KAKAO_CHAT_URL = KAKAO_CHANNEL_URL + "/chat";

const answers = {};
const history = [];
let currentId = "Q0";

const screenBody = document.getElementById("screenBody");
const backBtn = document.getElementById("backBtn");
const progressEl = document.getElementById("progress");
const wizard = document.getElementById("wizard");
const resultState = document.getElementById("resultState");
const failState = document.getElementById("failState");

document.getElementById("kakaoChatBtnFail").href = KAKAO_CHAT_URL;

backBtn.addEventListener("click", () => {
  if (history.length === 0) return;
  currentId = history.pop();
  renderScreen(currentId);
});

function findQuestion(id) {
  return QUESTIONS.find((q) => q.id === id);
}

function goNext(question, value) {
  answers[question.field] = value;
  const nextId = question.next(answers);
  history.push(currentId);
  currentId = nextId;
  if (nextId === "AZ") {
    renderContactScreen();
  } else {
    renderScreen(nextId);
  }
}

function clearScreen() {
  screenBody.innerHTML = "";
}

function renderProgress() {
  progressEl.textContent = `질문 ${history.length + 1}`;
  backBtn.style.display = history.length > 0 ? "inline-flex" : "none";
}

function optionButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "option-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderScreen(id) {
  const q = findQuestion(id);
  clearScreen();
  renderProgress();

  const h = document.createElement("h2");
  h.className = "q-text";
  h.textContent = q.text;
  screenBody.appendChild(h);

  if (q.help) {
    const help = document.createElement("p");
    help.className = "q-help";
    help.textContent = q.help;
    screenBody.appendChild(help);
  }

  if (q.type === "single") {
    const list = document.createElement("div");
    list.className = "option-list";
    q.options.forEach((opt) => {
      list.appendChild(optionButton(opt.label, () => goNext(q, opt.value)));
    });
    screenBody.appendChild(list);
  } else if (q.type === "multi") {
    renderMulti(q);
  } else if (q.type === "textOrPick") {
    renderTextOrPick(q);
  } else if (q.type === "numberOrSkip") {
    renderNumberOrSkip(q);
  }
}

function renderMulti(q) {
  const list = document.createElement("div");
  list.className = "option-list multi";
  const checked = new Set();
  q.options.forEach((opt) => {
    const label = document.createElement("label");
    label.className = "option-check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = opt.value;
    input.addEventListener("change", () => {
      if (input.checked) checked.add(opt.value);
      else checked.delete(opt.value);
      nextBtn.disabled = checked.size === 0;
    });
    label.appendChild(input);
    label.appendChild(document.createTextNode(opt.label));
    list.appendChild(label);
  });
  screenBody.appendChild(list);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "next-btn";
  nextBtn.textContent = "다음";
  nextBtn.disabled = true;
  nextBtn.addEventListener("click", () => goNext(q, Array.from(checked).join(", ")));
  screenBody.appendChild(nextBtn);
}

function renderTextOrPick(q) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "q-text-input";
  input.placeholder = q.textPlaceholder || "";
  screenBody.appendChild(input);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "next-btn";
  nextBtn.textContent = "다음";
  nextBtn.addEventListener("click", () => {
    if (input.value.trim()) goNext(q, input.value.trim());
  });
  screenBody.appendChild(nextBtn);

  const list = document.createElement("div");
  list.className = "option-list";
  q.options.forEach((opt) => {
    list.appendChild(optionButton(opt.label, () => goNext(q, opt.value)));
  });
  screenBody.appendChild(list);
}

function renderNumberOrSkip(q) {
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.className = "q-text-input";
  input.placeholder = "개월 수";
  screenBody.appendChild(input);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "next-btn";
  nextBtn.textContent = "다음";
  nextBtn.addEventListener("click", () => {
    if (input.value !== "") goNext(q, input.value);
  });
  screenBody.appendChild(nextBtn);

  const list = document.createElement("div");
  list.className = "option-list";
  list.appendChild(optionButton(q.skipLabel || "모름", () => goNext(q, "모름")));
  screenBody.appendChild(list);
}

function renderContactScreen() {
  clearScreen();
  progressEl.textContent = "마지막 단계";
  backBtn.style.display = "inline-flex";

  const h = document.createElement("h2");
  h.className = "q-text";
  h.textContent = CONTACT_SCREEN.text;
  screenBody.appendChild(h);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "q-text-input";
  nameInput.placeholder = "이름";
  screenBody.appendChild(nameInput);

  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.className = "q-text-input";
  phoneInput.placeholder = "연락처 (010-0000-0000)";
  screenBody.appendChild(phoneInput);

  const consentLabel = document.createElement("label");
  consentLabel.className = "consent";
  const consentInput = document.createElement("input");
  consentInput.type = "checkbox";
  consentLabel.appendChild(consentInput);
  const consentText = document.createElement("span");
  consentText.innerHTML = '[필수] 개인정보 수집·이용에 동의합니다. 상담 목적으로만 사용하며 ' +
    '<a href="privacy.html" target="_blank" rel="noopener">개인정보처리방침</a>에서 자세히 확인하세요.';
  consentLabel.appendChild(consentText);
  screenBody.appendChild(consentLabel);

  const errorMsg = document.createElement("div");
  errorMsg.className = "error-msg";
  errorMsg.textContent = "이름, 연락처, 개인정보 동의를 모두 입력해 주세요.";
  screenBody.appendChild(errorMsg);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.className = "next-btn submit";
  submitBtn.textContent = "결과 보기";
  submitBtn.addEventListener("click", async () => {
    if (!nameInput.value.trim() || !phoneInput.value.trim() || !consentInput.checked) {
      errorMsg.classList.add("show");
      return;
    }
    errorMsg.classList.remove("show");
    answers.name = nameInput.value.trim();
    answers.phone = phoneInput.value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = "제출 중...";
    await submitAnswers();
  });
  screenBody.appendChild(submitBtn);
}

async function submitAnswers() {
  const payload = {
    submittedAt: new Date().toISOString(),
    track: answers.product_line === "휴대폰" ? "A.휴대폰"
      : answers.product_line === "인터넷/TV" ? "I.인터넷·TV"
      : ({ 알뜰폰등: "B.알뜰폰 등", 가전렌탈: "R.가전렌탈", 자동차렌트리스: "V.자동차렌트리스",
          이사청소: "M.이사청소", 상조: "S.상조", 보험: "N.보험" }[answers.other_line_need] || "X.기타"),
    urgent: answers.funeral_urgent === "예",
    answers,
  };

  try {
    await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    showResult();
  } catch (err) {
    console.error("설문 제출 실패:", err);
    showFail();
  }
}

function showWizardHidden() {
  wizard.style.display = "none";
}

function showResult() {
  showWizardHidden();
  resultState.innerHTML = "";
  resultState.appendChild(buildResultContent());
  resultState.classList.add("show");
}

function showFail() {
  showWizardHidden();
  failState.classList.add("show");
}

document.getElementById("retryBtn").addEventListener("click", () => {
  failState.classList.remove("show");
  wizard.style.display = "block";
  renderContactScreen();
});

// ---- 결과 카드 (세그먼트-추천로직 v3.1 기준, 정성적 문구 — 실제 견적 아님) ----

function card(title, desc, tone) {
  const el = document.createElement("div");
  el.className = "result-card";
  const h3 = document.createElement("h3");
  h3.textContent = title;
  el.appendChild(h3);
  const p = document.createElement("p");
  p.textContent = desc;
  el.appendChild(p);
  if (tone) {
    const q = document.createElement("p");
    q.className = "tone";
    q.textContent = tone;
    el.appendChild(q);
  }
  return el;
}

function buildResultContent() {
  const wrap = document.createElement("div");

  const title = document.createElement("h2");
  title.textContent = "접수됐습니다 — 맞춤 상담안을 먼저 보여드려요";
  wrap.appendChild(title);

  if (answers.contract_status === "위약금발생") {
    const banner = document.createElement("div");
    banner.className = "warn-banner";
    banner.textContent = "지금 통신사를 옮기면 위약금이 발생할 수 있어요 — 상담사가 실제 손익을 먼저 계산해 안내드립니다.";
    wrap.appendChild(banner);
  }
  if (answers.funeral_urgent === "예") {
    const badge = document.createElement("div");
    badge.className = "urgent-badge";
    badge.textContent = "🚨 긴급 — 담당자가 최우선으로 연락드립니다";
    wrap.appendChild(badge);
  }

  const cards = document.createElement("div");
  cards.className = "result-cards";

  const isAlttel = answers.device_pref === "알뜰폰만" || answers.other_line_need === "알뜰폰등";

  if (isAlttel) {
    cards.appendChild(card("맞춤 요금제 추천",
      "말씀하신 사용량 기준으로 가장 저렴한 요금제를 상담사가 바로 안내드립니다. 다른 곳보다 비싸면 바로 말씀해주세요."));
  } else if (answers.product_line === "휴대폰") {
    cards.appendChild(card("1안 · 표준 밸런스형",
      "결합 있으면 결합 유지 우선, 부가서비스는 0~1개만 유지. 총비용 기준으로 다른 안과 비교하기 좋아요.",
      "유지조건 부담 없이 총액 기준으로 가장 무난해요."));
    cards.appendChild(card("2안 · 최대혜택형",
      "제휴카드·인터넷/TV·워치 추가가입까지 포함해 초기 실부담을 가장 낮춘 조합. 유지조건은 화면에 굵게 안내드려요.",
      "카드 가입시켜서 남는 마진은 0원, 전부 돌려드려요(증빙 가능)."));
    cards.appendChild(card("3안 · 심플/즉시형",
      "부가서비스 없이, 완납 옵션 우선으로 접수까지 가장 빠르게 진행하는 조합.",
      "조금 비싸도 복잡한 건 딱 질색이에요."));
  } else if (answers.product_line === "인터넷/TV") {
    cards.appendChild(card("1안 · 결합 최적형",
      "지금 쓰시는 휴대폰 통신사와 묶어 결합할인을 최대화한 조합."));
    cards.appendChild(card("2안 · 구성 그대로형",
      "요청하신 구성(TV대수·속도) 그대로 충족하는 표준 조합."));
    cards.appendChild(card("3안 · 최저가형",
      "결합·구성 조건을 낮추더라도 월 요금 자체를 가장 낮춘 조합."));
  } else {
    cards.appendChild(card("상담사 매칭 안내",
      "입력하신 조건으로 상담사가 맞는 곳을 찾아 연락드립니다."));
    if (answers.other_line_need === "가전렌탈" && RENTAL_CATALOG_URL) {
      const link = document.createElement("a");
      link.href = RENTAL_CATALOG_URL;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "btn-secondary";
      link.textContent = "제품 카탈로그 보기";
      cards.appendChild(link);
    }
  }
  wrap.appendChild(cards);

  const disclaimer = document.createElement("p");
  disclaimer.className = "disclaimer";
  disclaimer.textContent = "아직 확정 견적이 아니며, 상담사가 당일 정책표로 재확인 후 서면 견적을 드립니다.";
  wrap.appendChild(disclaimer);

  const kakaoWrap = document.createElement("div");
  kakaoWrap.className = "kakao-actions";
  const chatBtn = document.createElement("a");
  chatBtn.className = "btn-kakao";
  chatBtn.href = KAKAO_CHAT_URL;
  chatBtn.target = "_blank";
  chatBtn.rel = "noopener";
  chatBtn.textContent = "💬 카카오톡 1:1 상담하기";
  const addBtn = document.createElement("a");
  addBtn.className = "btn-secondary";
  addBtn.href = KAKAO_ADD_URL;
  addBtn.target = "_blank";
  addBtn.rel = "noopener";
  addBtn.textContent = "카카오톡 채널 추가하기";
  kakaoWrap.appendChild(chatBtn);
  kakaoWrap.appendChild(addBtn);
  wrap.appendChild(kakaoWrap);

  return wrap;
}

renderScreen(currentId);

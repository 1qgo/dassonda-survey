// 다쏜다 설문 워크트리 (설문설계/다쏜다-설문-워크트리-초안.xlsx 질문흐름 시트 v3 그대로 반영)
// 각 항목: id, track, type, text(질문 문구), help(보조설명, 선택), options([{value,label}]),
//          field(수집필드명), next(answers)=>다음 id

const QUESTIONS = [
  {
    id: "Q0", track: "공통", type: "single",
    text: "어떤 걸 도와드릴까요?",
    options: [
      { value: "휴대폰", label: "휴대폰" },
      { value: "인터넷/TV", label: "인터넷·TV" },
      { value: "알뜰폰등", label: "알뜰폰·선불폰·유심" },
      { value: "가전렌탈", label: "가전렌탈 (정수기·안마의자 등)" },
      { value: "자동차렌트리스", label: "자동차 렌트·리스" },
      { value: "이사청소", label: "이사·청소" },
      { value: "상조", label: "상조" },
      { value: "보험", label: "보험" },
    ],
    field: "product_line",
    // 홈페이지 상품 구성에 맞춰 첫 화면에서 바로 펼친다 (예전 '기타 → X0' 단계 없앰)
    next: (a) => ({
      휴대폰: "A1", "인터넷/TV": "I1", 알뜰폰등: "B1", 가전렌탈: "R1",
      자동차렌트리스: "V1", 이사청소: "M1", 상조: "S1", 보험: "N1",
    }[a.product_line]),
  },
  {
    id: "A1", track: "A.휴대폰", type: "single",
    text: "어떤 걸 선호하시나요?",
    options: [
      { value: "특정기종", label: "특정 기종을 싸게 사고 싶어요" },
      { value: "추천형", label: "추천해주는 기종으로 최대한 비용을 아낄래요" },
      { value: "알뜰폰만", label: "알뜰폰만 가입해서 통신요금 최저로 할래요" },
      { value: "기존폰유지", label: "기존 핸드폰 그대로 통신사만 바꿀래요" },
    ],
    field: "device_pref",
    next: (a) => (a.device_pref === "알뜰폰만" ? "B1" : a.device_pref === "기존폰유지" ? "A4" : "A2"),
  },
  {
    id: "A2", track: "A.휴대폰", type: "single",
    text: "삼성과 아이폰 중 어떤 걸 원하시나요?",
    options: [
      { value: "삼성", label: "삼성" },
      { value: "아이폰", label: "아이폰" },
      { value: "상관없음", label: "상관없음 (추천받고 싶음)" },
    ],
    field: "brand_pref",
    // A1=추천형(예산 기반 추천)은 모델 직접입력 화면(A2-1)을 건너뛰고 바로 통신사 질문으로
    next: (a) => (a.device_pref === "추천형" ? "A3" : "A2-1"),
  },
  {
    id: "A2-1", track: "A.휴대폰", type: "textOrPick",
    text: "원하는 구체적인 기종이 있으신가요?",
    options: [{ value: "__NONE__", label: "아직 없음 - 추천받고 싶음" }],
    textPlaceholder: "모델명을 입력해주세요",
    field: "model_interest",
    next: () => "A3",
  },
  {
    id: "A3", track: "A.휴대폰", type: "single",
    text: "현재 이용 중인 통신사는 어디인가요?",
    options: [
      { value: "SKT", label: "SKT" },
      { value: "KT", label: "KT" },
      { value: "LGU+", label: "LG U+" },
      { value: "알뜰폰", label: "알뜰폰" },
      { value: "없음", label: "없음 (최초 개통)" },
    ],
    field: "carrier",
    next: (a) => {
      if (a.carrier === "없음") { a.change_type = "신규가입"; return "A5"; }
      return "A4";
    },
  },
  {
    id: "A4", track: "A.휴대폰", type: "single",
    text: "번호이동인가요, 기기변경인가요?",
    options: [
      { value: "번호이동", label: "번호이동 (통신사 변경)" },
      { value: "기기변경", label: "기기변경 (통신사 유지)" },
      { value: "상관없음", label: "상관없음, 유리한 쪽으로" },
    ],
    field: "change_type",
    next: () => "A5",
  },
  {
    id: "A5", track: "A.휴대폰", type: "single",
    text: "지금 약정이 남아있나요?",
    options: [
      { value: "약정없음", label: "약정 없음" },
      { value: "위약금발생", label: "약정 중 - 위약금 발생" },
      { value: "선택약정유지중", label: "약정 중 - 선택약정 유지중" },
      { value: "모름", label: "잘 모름" },
    ],
    field: "contract_status",
    next: (a) => (a.contract_status === "위약금발생" || a.contract_status === "선택약정유지중" ? "A5-1" : "A6"),
  },
  {
    id: "A5-1", track: "A.휴대폰", type: "numberOrSkip",
    text: "잔여 약정 개월 수를 알고 계신가요?",
    skipLabel: "모름 (대표가 직접 확인)",
    field: "contract_months_left",
    next: () => "A6",
  },
  {
    id: "A6", track: "A.휴대폰", type: "multi",
    text: "가족결합이나 인터넷 결합을 쓰고 계신가요?",
    options: [
      { value: "가족결합", label: "가족결합" },
      { value: "인터넷결합", label: "인터넷결합" },
      { value: "결합없음", label: "결합 없음" },
      { value: "모름", label: "모름" },
    ],
    field: "combo_status",
    next: (a) => (a.device_pref === "기존폰유지" ? "AZ" : "A7"),
  },
  {
    id: "A7", track: "A.휴대폰", type: "single",
    text: "핸드폰 구매 방식은 어떻게 하고 싶으세요?",
    options: [
      { value: "할부", label: "할부로 나눠서" },
      { value: "완납", label: "완납 (일시불)" },
      { value: "상관없음", label: "상관없음, 유리한 쪽으로" },
    ],
    field: "purchase_type",
    next: () => "A7-1",
  },
  {
    id: "A7-1", track: "A.휴대폰", type: "single",
    text: "언제 교체가 필요하세요?",
    help: "기간을 설정하시면 그 안에 더 싼 가격이 나올 때 바로 알려드립니다. 단, 통신사 정책·모델 판매 실적에 따라 지원금이 축소될 수 있습니다.",
    options: [
      { value: "즉시", label: "즉시" },
      { value: "1주일내", label: "1주일 내" },
      { value: "1달이내", label: "1달 이내" },
    ],
    field: "replace_timing",
    next: () => "AZ",
  },

  // ---- TRACK I: 인터넷/TV ----
  {
    id: "I1", track: "I.인터넷·TV", type: "single",
    text: "어떤 걸 원하세요?",
    options: [
      { value: "신규설치", label: "신규 설치 (이사·최초)" },
      { value: "갈아타기", label: "기존 약정 끝나가서 갈아타기" },
    ],
    field: "internet_need_type",
    next: () => "I2",
  },
  {
    id: "I2", track: "I.인터넷·TV", type: "textOrPick",
    text: "설치할 지역(시/구)이 정해졌나요?",
    options: [{ value: "__NONE__", label: "아직 미정 (이사 예정)" }],
    textPlaceholder: "예: 경기 광명시",
    field: "install_area",
    next: () => "I3",
  },
  {
    id: "I3", track: "I.인터넷·TV", type: "single",
    text: "설치(입주) 희망 시기는 언제인가요?",
    options: [
      { value: "즉시", label: "즉시 가능" },
      { value: "1~2주", label: "1~2주 내" },
      { value: "1개월이상", label: "1개월 이상" },
    ],
    field: "install_timing",
    next: () => "I4",
  },
  {
    id: "I4", track: "I.인터넷·TV", type: "single",
    text: "필요한 구성은 어떻게 되나요?",
    options: [
      { value: "인터넷만", label: "인터넷만" },
      { value: "인터넷+TV", label: "인터넷+TV" },
      { value: "모름", label: "잘 모름 (추천받고 싶음)" },
    ],
    field: "internet_bundle",
    next: (a) => (a.internet_bundle === "인터넷+TV" ? "I5" : "I6"),
  },
  {
    id: "I5", track: "I.인터넷·TV", type: "single",
    text: "TV는 몇 대 필요하세요?",
    options: [
      { value: "1대", label: "1대" },
      { value: "2대", label: "2대" },
      { value: "3대이상", label: "3대 이상" },
    ],
    field: "tv_count",
    next: () => "I6",
  },
  {
    id: "I6", track: "I.인터넷·TV", type: "single",
    text: "원하는 인터넷 속도는요?",
    options: [
      { value: "기본형", label: "기본형 (100M)" },
      { value: "넉넉하게", label: "넉넉하게 (500M~1G)" },
      { value: "모름", label: "잘 모름 - 일반적인 사용" },
    ],
    field: "internet_speed",
    next: () => "I7",
  },
  {
    id: "I7", track: "I.인터넷·TV", type: "single",
    text: "지금 이용 중인 인터넷 통신사가 있나요? (결합 확인용)",
    options: [
      { value: "없음", label: "없음 (신규)" },
      { value: "KT", label: "KT" },
      { value: "SKT", label: "SKT (SK브로드밴드)" },
      { value: "LGU+", label: "LG U+" },
      { value: "그외", label: "그 외" },
    ],
    field: "current_internet_carrier",
    next: (a) => (a.current_internet_carrier === "없음" ? "I9" : "I8"),
  },
  {
    id: "I8", track: "I.인터넷·TV", type: "single",
    text: "지금 인터넷·TV 약정이 남아있나요?",
    options: [
      { value: "없음", label: "약정 없음" },
      { value: "위약금발생", label: "위약금 발생" },
      { value: "모름", label: "잘 모름" },
    ],
    field: "internet_contract_status",
    next: () => "I9",
  },
  {
    id: "I9", track: "I.인터넷·TV", type: "single",
    text: "지금 쓰는 휴대폰 통신사는 어디인가요? (결합할인 매칭용)",
    options: [
      { value: "SKT", label: "SKT" },
      { value: "KT", label: "KT" },
      { value: "LGU+", label: "LG U+" },
      { value: "알뜰폰", label: "알뜰폰" },
      { value: "없음", label: "없음" },
    ],
    field: "mobile_carrier_for_combo",
    next: () => "I11",
  },
  {
    id: "I11", track: "I.인터넷·TV", type: "single",
    text: "사은품·사은혜택 중 관심 있는 게 있나요?",
    options: [
      { value: "상품권/캐시백", label: "상품권·캐시백" },
      { value: "상관없음", label: "상관없음, 요금이 더 중요" },
      { value: "모름", label: "잘 모름" },
    ],
    field: "gift_interest",
    next: () => "AZ",
  },

  // ---- TRACK B: 알뜰폰/선불폰/유심 ----
  {
    id: "B1", track: "B.알뜰폰 등", type: "single",
    text: "어떤 게 필요하세요?",
    options: [
      { value: "알뜰폰요금제", label: "알뜰폰 요금제만" },
      { value: "선불폰개통", label: "선불폰 개통" },
      { value: "유심만", label: "유심만 구매" },
    ],
    field: "sub_line_need",
    next: () => "B2",
  },
  {
    id: "B2", track: "B.알뜰폰 등", type: "single",
    text: "한 달 데이터·통화는 얼마나 쓰세요?",
    options: [
      { value: "적음+적음", label: "데이터 적음 + 통화 적음" },
      { value: "많음+보통", label: "데이터 많음 + 통화 보통" },
      { value: "무제한", label: "무제한 원함" },
      { value: "모름", label: "잘 모름" },
    ],
    field: "usage_profile",
    next: () => "B4",
  },
  {
    id: "B4", track: "B.알뜰폰 등", type: "single",
    text: "희망하는 월 요금 예산은?",
    options: [
      { value: "1만원대이하", label: "1만원대 이하" },
      { value: "2만원대", label: "2만원대" },
      { value: "3만원이상", label: "3만원 이상" },
      { value: "상관없음", label: "상관없음 (최저가 우선)" },
    ],
    field: "budget_band",
    next: () => "AZ",
  },

  // ---- TRACK R: 가전렌탈 ----
  {
    id: "R1", track: "R.가전렌탈", type: "single",
    text: "어떤 가전을 알아보세요?",
    options: [
      { value: "정수기", label: "정수기" },
      { value: "안마의자", label: "안마의자" },
      { value: "공기청정기", label: "공기청정기" },
      { value: "비데", label: "비데" },
      { value: "기타", label: "기타 (직접입력)" },
    ],
    field: "rental_item",
    next: () => "AZ",
  },

  // ---- TRACK V: 자동차 렌트/리스 ----
  {
    id: "V1", track: "V.자동차렌트리스", type: "single",
    text: "어떤 상품을 알아보세요?",
    options: [
      { value: "신차장기렌트", label: "신차 장기렌트" },
      { value: "중고장기렌트", label: "중고 장기렌트" },
      { value: "자동차리스", label: "자동차 리스" },
      { value: "모름", label: "잘 모름 - 비교해서 추천받고 싶음" },
    ],
    field: "auto_type",
    next: () => "V2",
  },
  {
    id: "V2", track: "V.자동차렌트리스", type: "single",
    text: "어떤 명의로 이용하시나요?",
    options: [
      { value: "개인", label: "개인" },
      { value: "개인사업자", label: "개인사업자" },
      { value: "법인사업자", label: "법인사업자" },
    ],
    field: "auto_usage_type",
    next: () => "V2-1",
  },
  {
    id: "V2-1", track: "V.자동차렌트리스", type: "textOrPick",
    text: "원하시는 차종과 트림을 알려주세요",
    help: "정확하지 않아도 괜찮아요. 아시는 만큼만 적어주세요.",
    textPlaceholder: "예: 쏘렌토 하이브리드 시그니처",
    options: [{ value: "__NONE__", label: "아직 미정 - 추천받고 싶음" }],
    field: "auto_model",
    next: () => "V3",
  },
  {
    id: "V3", track: "V.자동차렌트리스", type: "single",
    text: "희망 계약 기간은?",
    options: [
      { value: "12개월", label: "12개월" },
      { value: "24개월", label: "24개월" },
      { value: "36개월이상", label: "36개월 이상" },
      { value: "미정", label: "아직 미정" },
    ],
    field: "auto_contract_months",
    next: () => "AZ",
  },

  // ---- TRACK M: 이사/청소 ----
  {
    id: "M1", track: "M.이사청소", type: "single",
    text: "어떤 서비스가 필요하세요?",
    options: [
      { value: "이사", label: "이사 (포장이사 등)" },
      { value: "청소", label: "청소 (입주청소 등)" },
      { value: "둘다", label: "둘 다" },
    ],
    field: "moving_service_type",
    next: () => "M2",
  },
  {
    id: "M2", track: "M.이사청소", type: "single",
    text: "예정 공간 규모는 어느 정도인가요?",
    options: [
      { value: "10평이하", label: "10평 이하" },
      { value: "10~30평", label: "10~30평" },
      { value: "30평이상", label: "30평 이상" },
      { value: "모름", label: "잘 모름" },
    ],
    field: "moving_space_size",
    next: () => "M3",
  },
  {
    id: "M3", track: "M.이사청소", type: "single",
    text: "희망 시기는 언제인가요?",
    options: [
      { value: "1주이내", label: "1주 이내" },
      { value: "2~4주내", label: "2~4주 내" },
      { value: "미정", label: "아직 미정" },
    ],
    field: "moving_timing",
    next: () => "AZ",
  },

  // ---- TRACK S: 상조 ----
  {
    id: "S1", track: "S.상조", type: "single",
    text: "상조 상담이 필요한 이유는 무엇인가요?",
    options: [
      { value: "신규검토", label: "신규 가입 검토" },
      { value: "비교해지", label: "기존 가입 상품 비교·해지 문의" },
      { value: "임박한상", label: "임박한 상(喪) - 급히 필요" },
    ],
    field: "funeral_reason",
    next: (a) => (a.funeral_reason === "임박한상" ? "S2" : "AZ"),
  },
  {
    id: "S2", track: "S.상조", type: "single",
    text: "매우 급한 상황이신가요?",
    options: [
      { value: "예", label: "예, 바로 연락 주세요" },
      { value: "아니오", label: "아니요, 여유 있게 상담받고 싶어요" },
    ],
    field: "funeral_urgent",
    next: () => "AZ",
  },

  // ---- TRACK N: 보험 ----
  {
    id: "N1", track: "N.보험", type: "single",
    text: "어떤 보험을 알아보세요?",
    options: [
      { value: "실손건강", label: "실손·건강보험" },
      { value: "암질병", label: "암·질병 보장" },
      { value: "자동차운전자", label: "자동차·운전자보험" },
      { value: "어린이태아", label: "어린이·태아보험" },
      { value: "모름", label: "잘 모름 - 상담받고 정하고 싶음" },
    ],
    field: "insurance_type",
    next: () => "N2",
  },
  {
    id: "N2", track: "N.보험", type: "single",
    text: "어떤 상담이 필요하세요?",
    options: [
      { value: "신규검토", label: "새로 가입 검토" },
      { value: "기존점검", label: "지금 가입한 보험 점검 (중복·과다 확인)" },
      { value: "청구문의", label: "보험금 청구 문의" },
    ],
    field: "insurance_purpose",
    next: () => "AZ",
  },
];

const CONTACT_SCREEN = {
  id: "AZ", track: "공통 마감", type: "contact",
  text: "연락처, 성함을 남겨주세요",
};

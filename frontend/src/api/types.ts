export type LegalForm = "IP" | "OOO";
export type ActorRole = "CEO_OWNER" | "IP_OWNER" | "ACCOUNTANT" | "UNDERWRITER";
export type ProductType = "INVEST_LEASING" | "VKL" | "OVERDRAFT";
export type ViewMode = "business" | "bank";
export type ScreenId = 1 | 2 | 3;

export interface CompanyUser {
  id: string;
  full_name: string;
  role: ActorRole;
  role_label: string;
}

export interface CompanyBrief {
  id: string;
  inn: string;
  name: string;
  legal_form: LegalForm;
  okved_code: string;
  okved_cluster: string;
  account_balance: number;
  demo_key: string | null;
  users: CompanyUser[];
}

export interface CompanyDetail extends CompanyBrief {
  director_name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  age_months: number;
  is_egrul_active: boolean;
  business_model: string;
  annual_revenue: number;
  monthly_revenue_alfa: number;
  monthly_revenue_multibank: number;
  declared_monthly_revenue: number;
  revenue_growth_pct: number;
  geo_score: number;
  buyer_score: number;
  competitors_count: number;
  anchor_buyer: string;
  bki_overdue_days: number;
  bki_history_months: number;
  fssp_amount: number;
  is_multibank_verified: boolean;
}

export interface DnaBlock {
  code: string;
  title: string;
  value: string;
  description: string;
  status: "GOOD" | "WARN" | "RISK";
}

export interface ForecastDay {
  day: number;
  date: string;
  balance_rub: number;
  trigger: string | null;
}

export interface CashForecast {
  days: ForecastDay[];
  min_balance_rub: number;
  min_day: number;
  days_negative: number;
  has_gap: boolean;
}

export interface RadarTrigger {
  code: string;
  title: string;
  value: string;
  action_label: string;
  severity: "GOOD" | "WARN" | "RISK";
}

export interface NewsItem {
  id: string;
  title: string;
  text: string;
  cta: string;
  cluster: string;
  source: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  occurred_at: string;
  description: string;
  amount_rub: number;
  direction: "IN" | "OUT";
  category: string;
  can_installment: boolean;
  installment_taken: boolean;
}

export interface Dashboard {
  company: CompanyDetail;
  business_dna: { blocks: DnaBlock[]; completeness_pct: number };
  cash_forecast: CashForecast;
  radar_triggers: RadarTrigger[];
  news_feed: NewsItem[];
  transactions: Transaction[];
  search_chips: string[];
  account_balance: number;
  okved_cluster: string;
}

export interface CreditBadge {
  product_type: ProductType;
  product_label: string;
  amount_rub: number;
  term_months: number;
  rate_pct: number;
  monthly_payment_rub: number;
  max_payment_rub: number;
  limit_rub: number;
  is_preapproved: boolean;
  query: string;
  disclaimer: string;
}

export interface SearchResult {
  query: string;
  intent: "CAPEX" | "WORKING_CAPITAL" | "OVERDRAFT" | "INFO_ONLY";
  intent_label: string;
  silence_mode: boolean;
  silence_reason: string | null;
  amount_estimate_rub: number;
  amount_source: string;
  market_prices: Array<{
    item: string;
    price_rub: number;
    price_label: string;
    unit: string;
    supplier_name: string;
  }>;
  suppliers: Array<{
    name: string;
    inn: string;
    fssp_amount_rub: number;
    fssp_label: string;
    is_verified: boolean;
    price_label: string;
    delivery_days: number;
  }>;
  credit_badge: CreditBadge | null;
  news_item: NewsItem | null;
  classification_ms: number;
  ai_provider_mode: string;
  ai_enrichment: { text: string; model: string; latency_ms: number } | null;
  total_ms: number;
}

export interface Factor {
  group: string;
  code: string;
  label: string;
  score_delta: number;
  condition: string;
}

export interface CounterOffer {
  index: number;
  product_type: ProductType;
  product_label: string;
  amount_rub: number;
  term_months: number;
  rate_pct: number;
  monthly_payment_rub: number;
  label: string;
  features: string[];
}

export interface ApplicationCheck {
  id: string;
  code: string;
  status: string;
  message: string;
  details: Record<string, unknown>;
  created_at: string | null;
}

export interface Application {
  application_id: string;
  company: CompanyBrief;
  status: string;
  status_label: string;
  outcome: string;
  outcome_label: string;
  product_type: ProductType;
  product_label: string;
  risk_score: number;
  raw_score: number;
  is_hard_stop: boolean;
  hard_stop_reason: string | null;
  requested_amount_rub: number;
  approved_amount_rub: number;
  term_months: number;
  final_rate_pct: number;
  monthly_payment_rub: number;
  declared_monthly_revenue: number;
  monthly_revenue_alfa: number;
  monthly_revenue_multibank: number;
  fcf_rub: number;
  max_payment_rub: number;
  limit_rub: number;
  k_sector: number;
  factors_breakdown: Factor[];
  counter_offers: CounterOffer[];
  rejection_checklist: string[];
  selected_offer_index: number | null;
  anomaly: {
    detected: boolean;
    declared_monthly_revenue: number;
    alfa_monthly_revenue: number;
    deviation_pct: number;
    message: string;
  } | null;
  checks: ApplicationCheck[];
  multibank: { available: boolean; verified: boolean; external_revenue_rub: number };
  invoice: Record<string, unknown> | null;
  account_balance: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface InvoiceTemplate {
  code: string;
  file_name: string;
  supplier_name: string;
  supplier_inn: string;
  amount_rub: number;
  vat_rub: number;
  purpose: string;
  company_demo_key: string;
}

export interface ParsedInvoice {
  source: string;
  supplier_name: string;
  supplier_inn: string;
  amount_rub: number;
  vat_rub: number;
  purpose: string;
  template_code: string | null;
}

export interface InvoiceParseResult {
  invoice: ParsedInvoice;
  antifraud: {
    is_verified: boolean;
    egrul_status: string;
    fssp_amount_rub: number;
    message: string;
  };
  draft: Application;
  parsing_ms: number;
}

export interface BankPnl {
  requested_amount_rub: number;
  approved_amount_rub: number;
  expected_interest_income_rub: number;
  funding_cost_rub: number;
  risk_cost_rub: number;
  opex_rub: number;
  expected_margin_rub: number;
  margin_pct: number;
  ltv_rub: number;
  approval_probability_pct: number;
  probability_of_default_pct: number;
}

export interface XrayEvent {
  id: string;
  event_type: string;
  actor_role: string;
  previous_status: string | null;
  new_status: string | null;
  details: string;
  created_at: string | null;
}

export interface Xray {
  application: Application;
  bank_pnl: BankPnl;
  waterfall: {
    base_score: number;
    factors: Factor[];
    final_score: number;
    raw_score: number;
  };
  geo: {
    map_url: string;
    latitude: number;
    longitude: number;
    geo_score: number;
    buyer_score: number;
    competitors_count: number;
    business_model: string;
    anchor_buyer: string;
    city: string;
    address: string;
  };
  bank_value: {
    title: string;
    points: string[];
    pdf_value: string[];
    cash_forecast_value: string[];
  };
  events: XrayEvent[];
  checks: ApplicationCheck[];
  cash_forecast_summary: {
    min_balance_rub: number;
    min_day: number;
    days_negative: number;
    has_gap: boolean;
  };
}

export interface InstallmentResult {
  transaction_id: string;
  months: number;
  monthly_payment_rub: number;
  restored_amount_rub: number;
  account_balance: number;
}

export interface ApplicationCreateInput {
  company_id: string;
  product_type: ProductType;
  requested_amount_rub: number;
  term_months: number;
  declared_monthly_revenue: number;
  actor_role: ActorRole;
  draft_application_id?: string;
}

export interface HealthInfo {
  status: string;
  service: string;
  cbr_key_rate: number;
  ai_provider_mode: string;
  database: string;
}

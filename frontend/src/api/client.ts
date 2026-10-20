import type {
  ActorRole,
  Application,
  ApplicationCreateInput,
  CompanyBrief,
  CompanyDetail,
  Dashboard,
  HealthInfo,
  InstallmentResult,
  InvoiceParseResult,
  InvoiceTemplate,
  ProductType,
  SearchResult,
  Xray,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api/v1";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    let detail = `Ошибка ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail
          .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item)))
          .join("; ");
      }
    } catch {
      detail = `${detail}: ${await response.text()}`;
    }
    throw new ApiError(response.status, detail);
  }
  return (await response.json()) as T;
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  async health(): Promise<HealthInfo> {
    const response = await fetch("/health");
    if (!response.ok) {
      throw new ApiError(response.status, "Backend недоступен");
    }
    return (await response.json()) as HealthInfo;
  },

  getCompanies(): Promise<{ companies: CompanyBrief[] }> {
    return request("/companies");
  },

  lookupInn(inn: string): Promise<{ company: CompanyDetail; source: string }> {
    return request("/companies/lookup-inn", jsonInit({ inn }));
  },

  getDashboard(companyId: string): Promise<Dashboard> {
    return request(`/companies/${companyId}/dashboard`);
  },

  smartSearch(companyId: string, query: string): Promise<SearchResult> {
    return request(`/companies/${companyId}/smart-search`, jsonInit({ query }));
  },

  getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return request("/applications/invoice-templates");
  },

  parseInvoiceTemplate(companyId: string, templateCode: string): Promise<InvoiceParseResult> {
    const form = new FormData();
    form.append("company_id", companyId);
    form.append("template_code", templateCode);
    return request("/applications/parse-invoice", { method: "POST", body: form });
  },

  parseInvoiceFile(companyId: string, file: File): Promise<InvoiceParseResult> {
    const form = new FormData();
    form.append("company_id", companyId);
    form.append("file", file);
    return request("/applications/parse-invoice", { method: "POST", body: form });
  },

  createApplication(input: ApplicationCreateInput): Promise<Application> {
    return request("/applications", jsonInit(input));
  },

  getApplication(applicationId: string): Promise<Application> {
    return request(`/applications/${applicationId}`);
  },

  verifyMultibank(applicationId: string): Promise<{
    application: Application;
    previous_score: number;
    new_score: number;
    score_delta: number;
    previous_limit: number;
    new_limit: number;
    external_revenue_rub: number;
  }> {
    return request(`/applications/${applicationId}/verify-multibank`, { method: "POST" });
  },

  acceptOffer(applicationId: string, offerIndex: number, actorRole: ActorRole): Promise<Application> {
    return request(
      `/applications/${applicationId}/accept-offer`,
      jsonInit({ offer_index: offerIndex, actor_role: actorRole }),
    );
  },

  ceoApprove(applicationId: string, actorRole: ActorRole): Promise<Application> {
    return request(`/applications/${applicationId}/ceo-approve`, jsonInit({ actor_role: actorRole }));
  },

  underwriterAction(
    applicationId: string,
    payload: {
      action: "APPROVE" | "COUNTER_OFFER" | "NEED_MORE_INFO" | "REJECT";
      actor_role: ActorRole;
      comment?: string;
      document_name?: string;
    },
  ): Promise<Application> {
    return request(`/applications/${applicationId}/underwriter-action`, jsonInit(payload));
  },

  getXray(applicationId: string): Promise<Xray> {
    return request(`/applications/${applicationId}/xray`);
  },

  installment(transactionId: string, months: number): Promise<InstallmentResult> {
    return request(`/transactions/${transactionId}/installment`, jsonInit({ months }));
  },
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  INVEST_LEASING: "Инвест-кредит / лизинг",
  VKL: "Возвратная кредитная линия",
  OVERDRAFT: "Овердрафт",
};

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api } from "../api/client";
import type {
  ActorRole,
  Application,
  ApplicationCreateInput,
  ApplicationSummary,
  CompanyBrief,
  Dashboard,
  InstallmentResult,
  InvoiceParseResult,
  InvoiceTemplate,
  ProductType,
  ScreenId,
  SearchResult,
  ViewMode,
  Xray,
} from "../api/types";
import { notifyClientAboutStatus, useDemoStore } from "./demoStore";
import { formatMoney } from "../utils/format";

export interface MultibankResult {
  previousScore: number;
  newScore: number;
  scoreDelta: number;
  previousLimit: number;
  newLimit: number;
  externalRevenue: number;
}

interface AppContextValue {
  companies: CompanyBrief[];
  companyId: string | null;
  dashboard: Dashboard | null;
  application: Application | null;
  applications: ApplicationSummary[];
  xray: Xray | null;
  userRole: ActorRole;
  effectiveRole: ActorRole;
  viewMode: ViewMode;
  screen: ScreenId;
  isReady: boolean;
  isBusy: boolean;
  error: string | null;
  cbrRate: number | null;
  searchResult: SearchResult | null;
  invoiceResult: InvoiceParseResult | null;
  templates: InvoiceTemplate[];
  multibankResult: MultibankResult | null;
  selectCompany: (companyId: string, options?: { nextScreen?: ScreenId }) => Promise<void>;
  lookupInn: (inn: string) => Promise<{ ok: true; name: string } | { ok: false; message: string }>;
  setUserRole: (role: ActorRole) => void;
  setViewMode: (mode: ViewMode) => void;
  goToScreen: (screen: ScreenId) => void;
  runSearch: (query: string) => Promise<void>;
  parseTemplate: (code: string) => Promise<InvoiceParseResult | undefined>;
  parseFile: (file: File) => Promise<void>;
  submitDraft: (productType: ProductType, termMonths: number) => Promise<void>;
  createApplication: (
    input: Omit<ApplicationCreateInput, "company_id" | "actor_role">,
    next?: ScreenId,
  ) => Promise<void>;
  openBankCase: (
    companyId: string,
    input: Omit<ApplicationCreateInput, "company_id" | "actor_role">,
  ) => Promise<void>;
  loadApplications: () => Promise<void>;
  openApplication: (applicationId: string) => Promise<void>;
  verifyMultibank: () => Promise<void>;
  acceptOffer: (index: number) => Promise<void>;
  signApplication: () => Promise<void>;
  uploadDocument: (file: File) => Promise<boolean>;
  underwriterAction: (
    action: "APPROVE" | "COUNTER_OFFER" | "NEED_MORE_INFO" | "REJECT",
    comment?: string,
    documentName?: string,
  ) => Promise<void>;
  runInstallment: (transactionId: string, months: number) => Promise<InstallmentResult>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function ownerRole(company: CompanyBrief): ActorRole {
  return company.users.find((user) => user.role === "CEO_OWNER" || user.role === "IP_OWNER")?.role
    ?? company.users[0]?.role
    ?? "ACCOUNTANT";
}

function preferredRole(company: CompanyBrief): ActorRole {
  if (company.legal_form === "IP") {
    return ownerRole(company);
  }
  return company.users.find((user) => user.role === "ACCOUNTANT")?.role ?? ownerRole(company);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<CompanyBrief[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [xray, setXray] = useState<Xray | null>(null);
  const screen = useDemoStore((state) => state.screen);
  const viewMode = useDemoStore((state) => state.viewMode);
  const userRole = useDemoStore((state) => state.userRole);
  const setScreen = useDemoStore((state) => state.setScreen);
  const setUserRole = useDemoStore((state) => state.setUserRole);
  const setViewModeStore = useDemoStore((state) => state.setViewMode);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cbrRate, setCbrRate] = useState<number | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceParseResult | null>(null);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [multibankResult, setMultibankResult] = useState<MultibankResult | null>(null);
  const companyRef = useRef<string | null>(null);

  const effectiveRole: ActorRole = viewMode === "bank" ? "UNDERWRITER" : userRole;

  const handleError = useCallback((cause: unknown) => {
    const message = cause instanceof ApiError ? `${cause.status} · ${cause.detail}` : String(cause);
    setError(message);
  }, []);

  const syncCompanyBalance = useCallback((balance: number) => {
    setCompanies((current) =>
      current.map((company) =>
        company.id === companyId ? { ...company, account_balance: balance } : company,
      ),
    );
  }, [companyId]);

  const loadDashboard = useCallback(async (id: string) => {
    const payload = await api.getDashboard(id);
    if (companyRef.current && companyRef.current !== id) {
      return null;
    }
    setDashboard(payload);
    return payload;
  }, []);

  const loadXray = useCallback(async (applicationId: string) => {
    const payload = await api.getXray(applicationId);
    if (companyRef.current && payload.application.company.id !== companyRef.current) {
      return null;
    }
    setXray(payload);
    return payload;
  }, []);

  const selectCompany = useCallback(async (id: string, options?: { nextScreen?: ScreenId }) => {
    companyRef.current = id;
    setCompanyId(id);
    setSearchResult(null);
    setInvoiceResult(null);
    setApplication(null);
    setApplications([]);
    setXray(null);
    setMultibankResult(null);
    const stayInBank = viewMode === "bank" || (options?.nextScreen?.startsWith("bank-") ?? false);
    setScreen(options?.nextScreen ?? (stayInBank ? "bank-queue" : "home"));
    setError(null);
    setIsBusy(true);
    try {
      const payload = await loadDashboard(id);
      if (!payload || companyRef.current !== id) {
        return;
      }
      setUserRole(preferredRole(payload.company));
      const listed = await api.listApplications(id);
      if (!listed || companyRef.current !== id) {
        return;
      }
      setApplications(listed.applications);
      const latest = listed.applications[0];
      if (latest) {
        const opened = await api.getApplication(latest.application_id);
        if (companyRef.current === id) {
          setApplication(opened);
          if ((options?.nextScreen ?? "").startsWith("bank-")) {
            await loadXray(opened.application_id);
          }
        }
      }
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [handleError, loadDashboard, loadXray, setScreen, setUserRole, viewMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [health, companyResponse, templateResponse] = await Promise.all([
          api.health().catch(() => null),
          api.getCompanies(),
          api.getInvoiceTemplates().catch(() => []),
        ]);
        if (cancelled) {
          return;
        }
        setCbrRate(health?.cbr_key_rate ?? null);
        setCompanies(companyResponse.companies);
        setTemplates(templateResponse);
        if (companyResponse.companies.length > 0) {
          const first = companyResponse.companies.find((company) => company.demo_key === "rosters")
            ?? companyResponse.companies[0];
          companyRef.current = first.id;
          setCompanyId(first.id);
          setUserRole(preferredRole(first));
          const payload = await api.getDashboard(first.id);
          if (!cancelled && companyRef.current === first.id) {
            setDashboard(payload);
            setUserRole(preferredRole(payload.company));
            const listed = await api.listApplications(first.id).catch(() => null);
            if (listed && companyRef.current === first.id) {
              setApplications(listed.applications);
              const latest = listed.applications[0];
              if (latest) {
                const opened = await api.getApplication(latest.application_id);
                if (companyRef.current === first.id) {
                  setApplication(opened);
                }
              }
            }
          }
        }
      } catch (cause) {
        if (!cancelled) {
          handleError(cause);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const lookupInn = useCallback(async (inn: string) => {
    setIsBusy(true);
    setError(null);
    try {
      const { company } = await api.lookupInn(inn.trim());
      setCompanies((current) => {
        const exists = current.some((row) => row.id === company.id);
        return exists ? current : [...current, company];
      });
      companyRef.current = company.id;
      setCompanyId(company.id);
      setSearchResult(null);
      setInvoiceResult(null);
      setApplication(null);
      setApplications([]);
      setXray(null);
      setMultibankResult(null);
      const stayInBank = viewMode === "bank";
      setScreen(stayInBank ? "bank-queue" : "home");
      const payload = await api.getDashboard(company.id);
      setDashboard(payload);
      setUserRole(preferredRole(payload.company));
      return { ok: true as const, name: company.name };
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Проверьте корректность номера";
      return { ok: false as const, message };
    } finally {
      setIsBusy(false);
    }
  }, [setScreen, setUserRole, viewMode]);

  const screenForApplication = useCallback((app: Application): ScreenId => {
    if (app.status === "FUNDED" || app.status === "AWAITING_CEO_APPROVAL" || app.status === "APPROVED") {
      return "signing";
    }
    if (
      ["COUNTER_OFFER", "REJECTED", "NEED_MORE_INFO", "MANUAL_REVIEW", "ANOMALY_VERIFICATION"].includes(app.status)
    ) {
      return "decision";
    }
    return "apply";
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeStore(mode);
    const phase = companyId ? useDemoStore.getState().monitoring[companyId] ?? "none" : "none";
    const offerIsSent = companyId ? Boolean(useDemoStore.getState().offerSent[companyId]) : false;
    if (mode === "bank") {
      if (application?.status === "FUNDED") {
        setScreen(phase === "none" ? "bank-payout" : "bank-clients");
      } else if (application) {
        setScreen("bank-xray");
      } else if (offerIsSent) {
        setScreen("bank-queue");
      } else {
        setScreen("bank-signal");
      }
      if (application) {
        loadXray(application.application_id).catch(handleError);
      }
      return;
    }
    if (application?.status === "FUNDED" && (phase === "restructure" || phase === "limit")) {
      setScreen("home");
      return;
    }
    setScreen(application ? screenForApplication(application) : "home");
  }, [application, companyId, handleError, loadXray, screenForApplication, setScreen, setViewModeStore]);

  const goToScreen = useCallback((next: ScreenId) => {
    setScreen(next);
    if (
      (next === "bank-xray" || next === "bank-signal" || next === "bank-queue" || next === "bank-payout") &&
      application
    ) {
      loadXray(application.application_id).catch(handleError);
    }
  }, [application, handleError, loadXray, setScreen]);

  const refresh = useCallback(async () => {
    if (!companyId) {
      return;
    }
    try {
      const payload = await loadDashboard(companyId);
      if (payload && payload.company.account_balance !== dashboard?.account_balance) {
        syncCompanyBalance(payload.company.account_balance);
      }
    } catch (cause) {
      handleError(cause);
    }
  }, [companyId, dashboard?.account_balance, handleError, loadDashboard, syncCompanyBalance]);

  const runSearch = useCallback(async (query: string) => {
    if (!companyId) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await api.smartSearch(companyId, query);
      if (companyRef.current !== companyId) {
        return;
      }
      setSearchResult(result);
      await loadDashboard(companyId);
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [companyId, handleError, loadDashboard]);

  const parseTemplate = useCallback(async (code: string) => {
    if (!companyId) {
      return undefined;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await api.parseInvoiceTemplate(companyId, code);
      if (companyRef.current !== companyId) {
        return undefined;
      }
      setInvoiceResult(result);
      return result;
    } catch (cause) {
      handleError(cause);
      return undefined;
    } finally {
      setIsBusy(false);
    }
  }, [companyId, handleError]);

  const parseFile = useCallback(async (file: File) => {
    if (!companyId) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const result = await api.parseInvoiceFile(companyId, file);
      if (companyRef.current !== companyId) {
        return;
      }
      setInvoiceResult(result);
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [companyId, handleError]);

  const afterApplicationChange = useCallback(async (updated: Application) => {
    if (companyRef.current && updated.company.id !== companyRef.current) {
      return;
    }
    setApplication(updated);
    setMultibankResult(null);
    setCompanies((current) =>
      current.map((company) =>
        company.id === updated.company.id
          ? { ...company, account_balance: updated.account_balance }
          : company,
      ),
    );
    if (companyId) {
      await loadDashboard(companyId);
    }
    await loadXray(updated.application_id);
  }, [companyId, loadDashboard, loadXray]);

  const submitDraft = useCallback(async (productType: ProductType, termMonths: number) => {
    if (!companyId || !invoiceResult) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const created = await api.createApplication({
        company_id: companyId,
        product_type: productType,
        requested_amount_rub: invoiceResult.invoice.amount_rub,
        term_months: termMonths,
        declared_monthly_revenue: dashboard?.company.declared_monthly_revenue
          ?? invoiceResult.invoice.amount_rub,
        actor_role: effectiveRole === "UNDERWRITER" ? "ACCOUNTANT" : effectiveRole,
        draft_application_id: invoiceResult.draft.application_id,
      });
      if (companyRef.current !== companyId) {
        return;
      }
      await afterApplicationChange(created);
      setScreen(screenForApplication(created));
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, companyId, dashboard?.company.declared_monthly_revenue, effectiveRole, handleError, invoiceResult, screenForApplication]);

  const loadApplications = useCallback(async () => {
    if (!companyId) {
      setApplications([]);
      return;
    }
    try {
      const payload = await api.listApplications(companyId);
      if (companyRef.current !== companyId) {
        return;
      }
      setApplications(payload.applications);
    } catch (cause) {
      handleError(cause);
    }
  }, [companyId, handleError]);

  const createApplication = useCallback(async (
    input: Omit<ApplicationCreateInput, "company_id" | "actor_role">,
    next?: ScreenId,
  ) => {
    const targetCompanyId = companyRef.current ?? companyId;
    if (!targetCompanyId) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const created = await api.createApplication({
        ...input,
        company_id: targetCompanyId,
        actor_role: effectiveRole === "UNDERWRITER" ? "ACCOUNTANT" : effectiveRole,
      });
      if (companyRef.current !== targetCompanyId) {
        return;
      }
      await afterApplicationChange(created);
      notifyClientAboutStatus(
        created.status,
        created.application_id,
        formatMoney(created.requested_amount_rub),
      );
      if (next === "applications") {
        const payload = await api.listApplications(targetCompanyId);
        if (companyRef.current === targetCompanyId) {
          setApplications(payload.applications);
        }
      }
      setScreen(next ?? screenForApplication(created));
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, companyId, effectiveRole, handleError, screenForApplication, setScreen]);

  const openBankCase = useCallback(async (
    id: string,
    input: Omit<ApplicationCreateInput, "company_id" | "actor_role">,
  ) => {
    setIsBusy(true);
    setError(null);
    try {
      companyRef.current = id;
      setCompanyId(id);
      setSearchResult(null);
      setInvoiceResult(null);
      setMultibankResult(null);
      setApplications([]);
      setApplication(null);
      setXray(null);
      setScreen("bank-xray");
      const payload = await loadDashboard(id);
      if (!payload || companyRef.current !== id) {
        return;
      }
      setUserRole(ownerRole(payload.company));

      // Сначала открываем уже отправленную клиентом заявку — не плодим новую.
      const listed = await api.listApplications(id);
      if (companyRef.current !== id) {
        return;
      }
      setApplications(listed.applications);
      const priority = [
        "NEED_MORE_INFO",
        "MANUAL_REVIEW",
        "COUNTER_OFFER",
        "ANOMALY_VERIFICATION",
        "APPROVED",
        "AWAITING_CEO_APPROVAL",
      ];
      const existing =
        priority
          .map((status) => listed.applications.find((row) => row.status === status))
          .find((row) => row !== undefined) ?? listed.applications[0];

      if (existing) {
        const opened = await api.getApplication(existing.application_id);
        if (companyRef.current !== id) {
          return;
        }
        await afterApplicationChange(opened);
        await loadXray(opened.application_id);
        setScreen("bank-xray");
        return;
      }

      const created = await api.createApplication({
        ...input,
        company_id: id,
        actor_role: "ACCOUNTANT",
      });
      if (companyRef.current !== id) {
        return;
      }
      await afterApplicationChange(created);
      await loadXray(created.application_id);
      setScreen("bank-xray");
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, handleError, loadDashboard, loadXray, setScreen, setUserRole]);

  const openApplication = useCallback(async (applicationId: string) => {
    setIsBusy(true);
    setError(null);
    try {
      const opened = await api.getApplication(applicationId);
      if (companyRef.current && opened.company.id !== companyRef.current) {
        return;
      }
      await afterApplicationChange(opened);
      setScreen(screenForApplication(opened));
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, handleError, screenForApplication, setScreen]);

  const verifyMultibank = useCallback(async () => {
    if (!application) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const response = await api.verifyMultibank(application.application_id);
      if (response.application.company.id !== companyRef.current) {
        return;
      }
      await afterApplicationChange(response.application);
      setMultibankResult({
        previousScore: response.previous_score,
        newScore: response.new_score,
        scoreDelta: response.score_delta,
        previousLimit: response.previous_limit,
        newLimit: response.new_limit,
        externalRevenue: response.external_revenue_rub,
      });
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, application, handleError]);

  const acceptOffer = useCallback(async (index: number) => {
    if (!application) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const updated = await api.acceptOffer(application.application_id, index, effectiveRole);
      if (updated.company.id !== companyRef.current) {
        return;
      }
      setApplication(updated);
      await loadXray(updated.application_id);
      if (updated.status === "AWAITING_CEO_APPROVAL") {
        const signer = updated.company.legal_form === "OOO" ? "CEO_OWNER" : "IP_OWNER";
        useDemoStore.getState().markCeoNotified(updated.application_id, signer);
      }
      setScreen("signing");
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [application, effectiveRole, handleError, loadXray, setScreen]);

  const signApplication = useCallback(async () => {
    if (!application) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const updated = await api.ceoApprove(application.application_id, effectiveRole);
      if (updated.company.id !== companyRef.current) {
        return;
      }
      await afterApplicationChange(updated);
      setScreen("signing");
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, application, effectiveRole, handleError, setScreen]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!application) {
      return false;
    }
    setIsBusy(true);
    setError(null);
    try {
      const updated = await api.uploadDocument(application.application_id, effectiveRole, file);
      if (updated.company.id !== companyRef.current) {
        return false;
      }
      await afterApplicationChange(updated);
      notifyClientAboutStatus(updated.status, updated.application_id);
      useDemoStore.getState().addCreditDoc(file.name);
      return true;
    } catch (cause) {
      handleError(cause);
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, application, effectiveRole, handleError]);

  const underwriterAction = useCallback(async (
    action: "APPROVE" | "COUNTER_OFFER" | "NEED_MORE_INFO" | "REJECT",
    comment?: string,
    documentName?: string,
  ) => {
    if (!application) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const updated = await api.underwriterAction(application.application_id, {
        action,
        actor_role: effectiveRole,
        comment,
        document_name: documentName,
      });
      if (updated.company.id !== companyRef.current) {
        return;
      }
      await afterApplicationChange(updated);
      notifyClientAboutStatus(
        updated.status,
        updated.application_id,
        formatMoney(updated.approved_amount_rub || updated.requested_amount_rub),
      );
    } catch (cause) {
      handleError(cause);
    } finally {
      setIsBusy(false);
    }
  }, [afterApplicationChange, application, effectiveRole, handleError]);

  const runInstallment = useCallback(async (transactionId: string, months: number) => {
    setIsBusy(true);
    setError(null);
    try {
      const result = await api.installment(transactionId, months);
      if (companyId) {
        await loadDashboard(companyId);
      }
      return result;
    } catch (cause) {
      handleError(cause);
      throw cause;
    } finally {
      setIsBusy(false);
    }
  }, [companyId, handleError, loadDashboard]);

  const value = useMemo<AppContextValue>(() => ({
    companies,
    companyId,
    dashboard,
    application,
    applications,
    xray,
    userRole,
    effectiveRole,
    viewMode,
    screen,
    isReady,
    isBusy,
    error,
    cbrRate,
    searchResult,
    invoiceResult,
    templates,
    multibankResult,
    selectCompany,
    lookupInn,
    setUserRole,
    setViewMode,
    goToScreen,
    runSearch,
    parseTemplate,
    parseFile,
    submitDraft,
    createApplication,
    openBankCase,
    loadApplications,
    openApplication,
    verifyMultibank,
    acceptOffer,
    signApplication,
    uploadDocument,
    underwriterAction,
    runInstallment,
    refresh,
    clearError: () => setError(null),
  }), [
    acceptOffer, application, applications, cbrRate, companies, companyId, createApplication, dashboard,
    effectiveRole, error, goToScreen, invoiceResult, isBusy, isReady, loadApplications, lookupInn, multibankResult,
    openApplication, openBankCase, parseFile, parseTemplate, refresh, runInstallment, runSearch, screen, searchResult,
    selectCompany, setViewMode, signApplication, submitDraft, templates, underwriterAction, uploadDocument, userRole,
    verifyMultibank, viewMode, xray,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp должен использоваться внутри AppProvider");
  }
  return context;
}

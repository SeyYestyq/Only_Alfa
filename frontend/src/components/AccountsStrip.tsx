import type { Dashboard } from "../api/types";
import { formatMoney } from "../utils/format";

export function AccountsStrip({ dashboard }: { dashboard: Dashboard }) {
  const company = dashboard.company;
  const accounts = [
    {
      id: "settlement",
      title: "Расчётный счёт",
      subtitle: `·${company.inn.slice(-4)} · ${company.legal_form === "IP" ? "ИП" : "ООО"}`,
      balance: dashboard.account_balance,
      tone: "primary" as const,
    },
    {
      id: "turnover",
      title: "Оборот в Альфе",
      subtitle: "среднемесячная выручка",
      balance: company.monthly_revenue_alfa,
      tone: "neutral" as const,
    },
    {
      id: "growth",
      title: "Динамика 3 мес.",
      subtitle: company.revenue_growth_pct >= 0 ? "рост выручки" : "снижение выручки",
      balance: null as number | null,
      growthPct: company.revenue_growth_pct,
      tone: company.revenue_growth_pct >= 0 ? ("good" as const) : ("risk" as const),
    },
  ];

  return (
    <section className="accounts-strip" aria-label="Счета компании">
      {accounts.map((account) => (
        <article key={account.id} className={`account-card tone-${account.tone}`}>
          <div className="account-card-label">{account.title}</div>
          <div className="account-card-value mono">
            {account.balance !== null && account.balance !== undefined
              ? formatMoney(account.balance)
              : `${account.growthPct! >= 0 ? "+" : ""}${account.growthPct!.toFixed(0)}%`}
          </div>
          <div className="account-card-sub">{account.subtitle}</div>
        </article>
      ))}
    </section>
  );
}

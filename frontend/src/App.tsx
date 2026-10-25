import { Chrome } from "./components/v2/Chrome";
import { Toasts } from "./components/v2/Toasts";
import { ApplicationsScreen } from "./screens/ApplicationsScreen";
import { DocumentsScreen } from "./screens/DocumentsScreen";
import { InvoiceScreen } from "./screens/InvoiceScreen";
import { PaymentsScreen } from "./screens/PaymentsScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { BankCase } from "./screens/v2/BankCase";
import { BankCustomers } from "./screens/v2/BankCustomers";
import { BankEffect } from "./screens/v2/BankEffect";
import { BankPayout } from "./screens/v2/BankPayout";
import { BankPortfolio } from "./screens/v2/BankPortfolio";
import { BankQueue } from "./screens/v2/BankQueue";
import { BankSignal } from "./screens/v2/BankSignal";
import { BankStates } from "./screens/v2/BankStates";
import { ClientApply } from "./screens/v2/ClientApply";
import { ClientDecision } from "./screens/v2/ClientDecision";
import { ClientEdges } from "./screens/v2/ClientEdges";
import { ClientHome } from "./screens/v2/ClientHome";
import { ClientSign } from "./screens/v2/ClientSign";
import { FeedsScreen } from "./screens/v2/FeedsScreen";
import { MessagesScreenV2 } from "./screens/v2/MessagesScreenV2";
import { useApp } from "./state/AppState";

export default function App() {
  const { isReady, screen, viewMode } = useApp();

  if (!isReady) {
    return (
      <div className="loading" style={{ minHeight: "100vh" }}>
        <span className="spinner" />
        Поднимаем кредитный кабинет…
      </div>
    );
  }

  const bank = viewMode === "bank" || screen.startsWith("bank-");

  return (
    <div className="v2-app">
      <Chrome />
      <main className="v2-main">
        {bank ? (
          <>
            {screen === "bank-queue" && <BankQueue />}
            {screen === "bank-signal" && <BankSignal />}
            {(screen === "bank-xray" || screen === "bank-messages" || screen === "bank-profile") && <BankCase />}
            {screen === "bank-payout" && <BankPayout />}
            {screen === "bank-clients" && <BankPortfolio />}
            {screen === "bank-customers" && <BankCustomers />}
            {screen === "bank-effect" && <BankEffect />}
            {screen === "bank-states" && <BankStates />}
            {screen === "messages" && <MessagesScreenV2 />}
          </>
        ) : (
          <>
            {screen === "home" && <ClientHome />}
            {screen === "apply" || screen === "passport" ? <ClientApply /> : null}
            {screen === "decision" && <ClientDecision />}
            {screen === "signing" && <ClientSign />}
            {screen === "edges" && <ClientEdges />}
            {screen === "feeds" && <FeedsScreen />}
            {screen === "messages" && <MessagesScreenV2 />}
            {screen === "payments" && <PaymentsScreen />}
            {screen === "documents" && <DocumentsScreen />}
            {screen === "applications" && <ApplicationsScreen />}
            {screen === "search" && <SearchScreen />}
            {screen === "invoice" && <InvoiceScreen />}
          </>
        )}
      </main>
      <Toasts />
    </div>
  );
}

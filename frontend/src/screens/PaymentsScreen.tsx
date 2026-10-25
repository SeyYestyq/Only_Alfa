import { useEffect } from "react";
import { useApp } from "../state/AppState";
import { DashboardScreen } from "./DashboardScreen";

/** К — Выручка и платежи: возвращает заёмщика на главную, где операции и модальное окно рассрочки открываются в едином контексте. */
export function PaymentsScreen() {
  const { goToScreen } = useApp();

  useEffect(() => {
    goToScreen("home");
  }, [goToScreen]);

  return <DashboardScreen />;
}



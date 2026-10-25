import { useEffect } from "react";
import { useApp } from "../state/AppState";

/**
 * Бывший раздел «Документы» слит с шагом подписи / вкладкой «Кредит».
 * Оставляем экран как редирект на случай старых переходов.
 */
export function DocumentsScreen() {
  const { application, goToScreen } = useApp();

  useEffect(() => {
    goToScreen(application ? "signing" : "applications");
  }, [application, goToScreen]);

  return (
    <div className="loading">
      <span className="spinner" /> Открываем документы в кредите…
    </div>
  );
}

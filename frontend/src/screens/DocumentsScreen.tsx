import { useEffect } from "react";
import { useApp } from "../state/AppState";

/** Старый маршрут «Документы» открывает страницу «Компания». */
export function DocumentsScreen() {
  const { goToScreen } = useApp();

  useEffect(() => {
    goToScreen("company");
  }, [goToScreen]);

  return (
    <div className="loading">
        <span className="spinner" /> Документы
    </div>
  );
}

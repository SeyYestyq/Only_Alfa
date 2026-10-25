import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initTheme } from "./hooks/useTheme";
import { AppProvider } from "./state/AppState";
import "./styles/global.css";
import "./styles/figma-layout.css";
import "./styles/clarity.css";
import "./styles/bank-bento-cockpit.css";

initTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);

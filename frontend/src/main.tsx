import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { CurrencyProvider } from "./context/CurrencyContext"; // <-- 1. Імпортуємо наш Провайдер

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 2. Обгортаємо App у CurrencyProvider */}
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </StrictMode>,
);

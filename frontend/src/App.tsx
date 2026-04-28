// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Приклад захищеної сторінки, куди ми потрапляємо після логіну */}
        <Route
          path="/dashboard"
          element={
            <div style={{ padding: "20px" }}>
              <h1>Головна панель</h1>
              <p>Ви успішно авторизувалися!</p>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/login";
                }}
              >
                Вийти
              </button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", { email, password });
      alert("Реєстрація успішна! Тепер ви можете увійти.");
      navigate("/login"); // Перенаправляємо на сторінку логіну
    } catch (err: any) {
      setError(err.response?.data?.message || "Помилка реєстрації");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "50px auto" }}>
      <h2>Реєстрація</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form
        onSubmit={handleRegister}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Зареєструватися</button>
      </form>
      <p>
        Вже є акаунт? <Link to="/login">Увійти</Link>
      </p>
    </div>
  );
};

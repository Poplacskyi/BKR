// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });
      // Зберігаємо отриманий токен
      localStorage.setItem("token", response.data.access_token);

      // Перенаправляємо на головну сторінку або дашборд
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Невірний email або пароль");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "50px auto" }}>
      <h2>Вхід</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form
        onSubmit={handleLogin}
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
        <button type="submit">Увійти</button>
      </form>
      <p>
        Немає акаунта? <Link to="/register">Зареєструватися</Link>
      </p>
    </div>
  );
};

// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", response.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Ворог не пройшов. Перевір дані.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Фоновий ефект вогню/свічення */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-900/30 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-900/20 rounded-full blur-[128px] pointer-events-none"></div>

      {/* Козацька Цитадель (Картка) */}
      <div className="w-full max-w-lg bg-[#0a0a0a] rounded-3xl border-4 border-[#1a1a1a] shadow-[0_0_60px_rgba(255,0,0,0.15)] relative overflow-hidden group">
        {/* Декоративна смуга зверху (Кована сталь + Золото) */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-950 via-amber-500 to-red-950"></div>

        <div className="p-10 sm:p-12">
          {/* Логотип та Гасло */}
          <div className="text-center mb-12 relative">
            {/* Стилізований Тризуб (SVG) */}
            <svg
              className="w-16 h-16 mx-auto text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L10 6H6L8 10L4 14H8L10 18L12 22L14 18L16 14H20L16 10L18 6H14L12 2Z" />
            </svg>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-white uppercase flex flex-col gap-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500">
                Козацька Варта
              </span>
              <span className="text-xs text-red-500 tracking-[0.3em] font-light">
                Аналітика Перемоги
              </span>
            </h2>
            <p className="absolute -top-6 -right-6 text-[100px] font-black text-white/[0.02] uppercase pointer-events-none rotate-12">
              Воля
            </p>
          </div>

          {/* Повідомлення про помилку (Бойове) */}
          {error && (
            <div className="mb-8 p-5 rounded-xl bg-red-950/50 border-2 border-red-700 flex items-center gap-4 animate-[shake_0.5s_ease-in-out]">
              <svg
                className="w-8 h-8 text-red-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="font-bold text-red-300">Напад відбито!</h4>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            {/* Поле Email */}
            <div className="relative group/input">
              <label className="block text-sm font-medium text-amber-300/80 mb-2 uppercase tracking-wider">
                Логін (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-xl bg-black border-2 border-[#2a2a2a] text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 text-lg shadow-inner"
                placeholder="chupryna@sich.ua"
              />
              <svg
                className="absolute right-5 top-[50px] w-6 h-6 text-[#3a3a3a] group-focus-within/input:text-amber-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            {/* Поле Пароль */}
            <div className="relative group/input">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-amber-300/80 uppercase tracking-wider">
                  Пароль
                </label>
                <button
                  type="button"
                  className="text-xs text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold"
                >
                  Втратили шифр?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-xl bg-black border-2 border-[#2a2a2a] text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 text-lg shadow-inner"
                placeholder="••••••••"
              />
              <svg
                className="absolute right-5 top-[50px] w-6 h-6 text-[#3a3a3a] group-focus-within/input:text-red-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            {/* ПОТУЖНА КНОПКА (Перемога) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 px-6 bg-gradient-to-r from-red-800 to-red-600 hover:from-amber-500 hover:to-amber-400 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xl shadow-[0_10px_20px_rgba(185,28,28,0.3)] hover:shadow-[0_15px_30px_rgba(251,191,36,0.4)] transition-all duration-500 transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-3 active:scale-95"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Йде бій...
                </>
              ) : (
                "Увійти в Цитадель"
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 text-center border-t-2 border-[#1a1a1a] text-sm text-slate-500 tracking-wide">
            Ще не в строю?{" "}
            <Link
              to="/register"
              className="font-bold text-amber-400 hover:text-white transition-colors uppercase tracking-widest ml-1 bg-amber-950/30 px-3 py-1 rounded-md"
            >
              Приєднатися до побратимів
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

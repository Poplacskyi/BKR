// src/pages/RegisterPage.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/register", { email, password });
      alert("Відтепер ти в строю! Увійди до Цитаделі.");
      navigate("/login");
    } catch (err: any) {
      const apiError = err.response?.data?.message;
      const errorMessage = Array.isArray(apiError) ? apiError[0] : apiError;
      setError(errorMessage || "Зрада! Не вдалося зареєструватися.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Фоновий ефект свічення (світлий, Переможний) */}
      <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_50%_50%,#1a1a1a_0%,#000_100%)] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Картка Реєстрації (Біла Сталь) */}
      <div className="w-full max-w-lg bg-[#0d0d0d] rounded-3xl border-2 border-amber-900/50 shadow-[0_0_80px_rgba(251,191,36,0.07)] relative overflow-hidden group">
        {/* Декоративний Тризуб на фоні */}
        <div className="absolute -bottom-16 -right-16 text-amber-500/[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <svg className="w-80 h-80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L10 6H6L8 10L4 14H8L10 18L12 22L14 18L16 14H20L16 10L18 6H14L12 2Z" />
          </svg>
        </div>

        <div className="p-10 sm:p-12 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white uppercase tracking-tight">
              ВІЙСЬКОВА ПРИСЯГА
            </h2>
            <p className="mt-3 text-base text-amber-300 font-medium tracking-wide">
              Створіть акаунт та отримайте доступ до стратегічних даних
            </p>
          </div>

          {error && (
            <div className="mb-8 p-5 rounded-xl bg-red-950/40 border border-red-800 flex items-center gap-4 animate-[shake_0.5s_ease-in-out]">
              <svg
                className="w-7 h-7 text-red-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-400 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-7 relative">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-widest">
                Твоя пошта (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-xl bg-black border-2 border-slate-800 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 transition-all duration-300 text-lg shadow-inner"
                placeholder="hetman@sich.ua"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-widest">
                Бойовий Шифр (Пароль)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-6 py-4 rounded-xl bg-black border-2 border-slate-800 text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 transition-all duration-300 text-lg shadow-inner pr-16"
                placeholder="Мінімум 6 символів"
              />
              <span className="absolute right-5 top-[50px] text-xs text-amber-600 font-mono tracking-tighter">
                SECURE
              </span>
            </div>

            {/* ПОТУЖНА БІЛА КНОПКА (Шлях Самурая) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 px-6 bg-white hover:bg-slate-200 text-black font-black rounded-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center uppercase text-xl tracking-[0.2em]"
            >
              {isLoading ? "Присяга складається..." : "Скласти Присягу"}
            </button>
          </form>

          <div className="mt-10 text-center text-sm text-slate-600 tracking-wide">
            Вже склав присягу?{" "}
            <Link
              to="/login"
              className="font-extrabold text-white hover:text-amber-400 transition-colors uppercase tracking-widest ml-1 underline decoration-amber-500/50 hover:decoration-amber-400"
            >
              Повернутися до строю
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// src/pages/HomePage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Знищуємо токен і повертаємося на кордон (сторінку логіну)
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#000000_100%)] text-slate-200 font-sans selection:bg-red-900/50">
      {/* ВЕРХНЯ ПАНЕЛЬ (Навігація) */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-[#2a2a2a] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Логотип */}
          <div className="flex items-center gap-3">
            <svg
              className="w-10 h-10 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L10 6H6L8 10L4 14H8L10 18L12 22L14 18L16 14H20L16 10L18 6H14L12 2Z" />
            </svg>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-widest leading-none">
                Козацька Варта
              </h1>
              <span className="text-[10px] text-red-500 uppercase tracking-[0.3em] font-bold">
                Генеральний Штаб
              </span>
            </div>
          </div>

          {/* Кнопка Виходу */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-red-950/40 border border-[#333] hover:border-red-800 rounded-lg transition-all duration-300"
          >
            <span className="text-sm font-bold text-slate-400 group-hover:text-red-400 uppercase tracking-wider transition-colors">
              Покинути Цитадель
            </span>
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ГОЛОВНИЙ КОНТЕНТ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        {/* Декоративні відблиски на фоні */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-900/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-900/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Вітання */}
        <div className="mb-12 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-500 uppercase tracking-tight drop-shadow-lg">
            Вітаємо, Отамане!
          </h2>
          <p className="mt-4 text-lg text-amber-500/70 font-medium tracking-wide border-l-4 border-red-600 pl-4">
            Зведення по запасах та торгових операціях за сьогодні. Усі системи в
            бойовій готовності.
          </p>
        </div>

        {/* СТАТИСТИЧНІ КАРТКИ (Дашборд) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
          {/* Картка 1: Скарбниця (Продажі) */}
          <div className="bg-[#0a0a0a] border border-[#222] hover:border-amber-500/50 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                  Золота Скарбниця
                </p>
                <h3 className="text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
                  ₴ 142,500
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-green-500 font-bold flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              +12.5% за тиждень
            </p>
          </div>

          {/* Картка 2: Арсенал (Управління запасами) */}
          <div className="bg-[#0a0a0a] border border-[#222] hover:border-red-500/50 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                  Запаси на складах
                </p>
                <h3 className="text-3xl font-black text-white group-hover:text-red-400 transition-colors">
                  1,248 од.
                </h3>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-amber-500 font-bold flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              14 позицій закінчуються
            </p>
          </div>

          {/* Картка 3: Клієнти (Побратими) */}
          <div className="bg-[#0a0a0a] border border-[#222] hover:border-slate-400/50 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                  Активні контрагенти
                </p>
                <h3 className="text-3xl font-black text-white group-hover:text-slate-300 transition-colors">
                  342
                </h3>
              </div>
              <div className="p-3 bg-slate-500/10 rounded-lg text-slate-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-bold flex items-center gap-1">
              Стабільний приріст бази
            </p>
          </div>

          {/* Картка 4: Стан Системи */}
          <div className="bg-[#0a0a0a] border border-[#222] hover:border-green-500/50 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
                  Бойова готовність
                </p>
                <h3 className="text-3xl font-black text-white group-hover:text-green-400 transition-colors">
                  100%
                </h3>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-green-500 font-bold flex items-center gap-1">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Сервери стабільні
            </p>
          </div>
        </div>

        {/* ВЕЛИКИЙ БЛОК АНАЛІТИКИ (Заглушка для таблиці/графіка) */}
        <div className="bg-[#050505] border border-[#222] rounded-3xl p-8 relative z-10 shadow-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-[#222] pb-6">
            <h3 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Динаміка Продажів
            </h3>
            <button className="px-4 py-2 border border-amber-900/50 hover:bg-amber-900/20 text-amber-500 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors">
              Завантажити Звіт
            </button>
          </div>

          {/* Місце для майбутнього графіка */}
          <div className="h-64 w-full flex items-center justify-center border-2 border-dashed border-[#222] rounded-xl bg-[#0a0a0a]">
            <p className="text-slate-600 font-bold uppercase tracking-widest flex flex-col items-center gap-2">
              <svg
                className="w-10 h-10 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Поле для графіка аналітики
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

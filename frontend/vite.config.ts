import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // <--- 1. Додай цей імпорт

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- 2. Додай сюди виклик функції
  ],
});

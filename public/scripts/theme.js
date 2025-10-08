// public/scripts/theme.js
(function () {
  // Aplica el tema inmediatamente sin parpadeo
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") document.documentElement.classList.add("dark");

  // Alternar tema
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    const btn = document.getElementById("toggle-theme");
    if (btn) btn.textContent = isDark ? "☀️ Claro" : "🌙 Oscuro";
  };

  // Actualizar texto del botón
  const updateButtonText = () => {
    const btn = document.getElementById("toggle-theme");
    if (btn)
      btn.textContent = document.documentElement.classList.contains("dark")
        ? "☀️ Claro"
        : "🌙 Oscuro";
  };

  // Inicializar cuando el nav se cargue
  const initButton = () => {
    updateButtonText();
    const btn = document.getElementById("toggle-theme");
    if (btn && !btn.dataset.bound) {
      btn.addEventListener("click", toggleTheme);
      btn.dataset.bound = "true";
    }
  };

  document.addEventListener("DOMContentLoaded", initButton);
  document.addEventListener("navLoaded", initButton);
})();
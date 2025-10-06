// public/scripts/nav.js

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  const token = localStorage.getItem("token");

  if (!nav) return; 

  if (token) {
    nav.innerHTML = `
      <a href="index.html" class="active">Buscar</a>
      <a href="perfil.html">Mi Perfil</a>
      <button id="logout" class="btn">Cerrar Sesión</button>
      <button id="toggle-theme" class="theme-toggle">🌙 Oscuro</button>
    `;

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "iniciar-sesion.html";
      });
    }

  } else {
    nav.innerHTML = `
      <a href="index.html" class="active">Buscar</a>
      <a href="prestador.html">Prestador</a>
      <a href="publicar-servicio.html" class="btn">Publicar</a>
      <a href="iniciar-sesion.html">Iniciar Sesión</a>
      <a href="registro.html">Registrarme</a>
      <button id="toggle-theme" class="theme-toggle">🌙 Oscuro</button>
    `;
  }
});
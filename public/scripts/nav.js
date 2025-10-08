// public/scripts/nav.js
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const token = localStorage.getItem("token");
  let rol = localStorage.getItem("rol");

  // 🧠 Intentar recuperar el rol desde el objeto usuario si no está guardado
  if (!rol) {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      if (usuario?.rol) {
        rol = usuario.rol;
        localStorage.setItem("rol", rol);
      }
    } catch (e) {
      console.warn("⚠️ No se pudo obtener el rol del usuario.");
    }
  }

  // ===============================
  // 🔐 Usuario logueado
  // ===============================
  if (token) {
    nav.innerHTML = `
      <a href="index.html" class="active">Buscar</a>
      <a href="perfil.html">Mi Perfil</a>
      ${
        rol === "PRESTADOR"
          ? `<a href="publicar-servicio.html" class="btn btn-publicar">🛠 Publicar</a>`
          : ""
      }
      <button id="logout" class="btn logout-btn">Cerrar Sesión</button>
      <button id="toggle-theme" class="theme-toggle">🌙 Oscuro</button>
    `;

    // 🚪 Cerrar sesión (sin perder avatar ni tema)
    document.getElementById("logout").addEventListener("click", () => {
      if (confirm("¿Seguro que querés cerrar sesión?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        localStorage.removeItem("rol");
        window.location.href = "iniciar-sesion.html";
      }
    });

  // ===============================
  // 🌐 Usuario sin sesión
  // ===============================
  } else {
    nav.innerHTML = `
      <a href="index.html" class="active">Buscar</a>
      <a href="iniciar-sesion.html">Iniciar Sesión</a>
      <a href="registro.html">Registrarme</a>
      <button id="toggle-theme" class="theme-toggle">🌙 Oscuro</button>
    `;
  }

  // 🔄 Notificar carga del nav
  const event = new Event("navLoaded");
  document.dispatchEvent(event);
});

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const servicioId = params.get("id");

  const contenedor = document.getElementById("prestador-view");

  if (!servicioId) {
    contenedor.innerHTML = "<p class=\"muted\">⚠️ Servicio no especificado.</p>";
    return;
  }

  try {
    // ✅ Obtener servicio + datos del prestador con validación de respuesta JSON
    const res = await fetch(`/api/servicios/${servicioId}`);
    if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
      throw new Error("Respuesta no válida del servidor");
    }
    const servicio = await res.json();

    if (!servicio || servicio.error) {
      contenedor.innerHTML = `<p class="muted">⚠️ ${servicio.error || "No se pudo cargar el servicio."}</p>`;
      return;
    }

    const prestador = servicio.usuario;

    // ✅ Render del perfil, servicio, turnos y reseñas
    contenedor.innerHTML = `
      <section class="prestador-header">
        <img src="${prestador.imagen || "/assets/avatar-placeholder.png"}" class="prestador-foto" alt="${prestador.nombre}">
        <div class="prestador-info">
          <h1>${prestador.nombre}</h1>
          <p><strong>Email:</strong> ${prestador.email}</p>
          <p><strong>Teléfono:</strong> ${prestador.telefono || "—"}</p>
          <p><strong>Localidad:</strong> ${prestador.localidad || "—"}</p>
        </div>
      </section>

      <section class="prestador-servicios">
        <h2>${servicio.titulo}</h2>
        <p><strong>Categoría:</strong> ${servicio.categoria}</p>
        <p><strong>Ubicación:</strong> ${servicio.ubicacion}</p>
        <p><strong>Descripción:</strong> ${servicio.descripcion || servicio.comentario}</p>
        <p><strong>⭐ Rating promedio:</strong> ${servicio.rating?.toFixed(1) ?? "—"} / 5</p>
      </section>

      <section class="prestador-turno">
        <h2>Solicitar turno</h2>
        <form id="form-turno">
          <label>Nombre</label>
          <input type="text" id="turno-nombre" required>

          <label>Email</label>
          <input type="email" id="turno-email" required>

          <label>Fecha (opcional)</label>
          <input type="date" id="turno-fecha">

          <label>Detalle (opcional)</label>
          <textarea id="turno-detalle" placeholder="Ej: preferencia de horario..."></textarea>

          <button type="submit" class="btn">Reservar turno</button>
          <p id="turno-ok" class="success-msg" style="display:none;">✅ Turno reservado correctamente.</p>
        </form>
      </section>

      <section class="prestador-resenas">
        <h2>Reseñas</h2>
        <ul id="lista-resenas" class="resenas-list"></ul>

        <h3>Dejá tu reseña</h3>
        <form id="form-resena">
          <label>Nombre</label>
          <input type="text" id="resena-nombre" required>

          <label>Email</label>
          <input type="email" id="resena-email" required>

          <label>Puntaje</label>
          <select id="resena-puntaje" required>
            <option value="">Seleccioná</option>
            <option value="5">⭐ 5 - Excelente</option>
            <option value="4">⭐ 4 - Muy bueno</option>
            <option value="3">⭐ 3 - Bueno</option>
            <option value="2">⭐ 2 - Regular</option>
            <option value="1">⭐ 1 - Malo</option>
          </select>

          <label>Comentario</label>
          <textarea id="resena-comentario" required></textarea>

          <button type="submit" class="btn">Enviar reseña</button>
          <p id="resena-ok" class="success-msg" style="display:none;">✅ ¡Gracias por tu reseña!</p>
        </form>
      </section>
    `;

    // ================================
    // 📅 Solicitar turno
    // ================================
    const formTurno = document.getElementById("form-turno");
    const msgOK = document.getElementById("turno-ok");

    formTurno.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("turno-nombre").value.trim();
      const email = document.getElementById("turno-email").value.trim();
      const fecha = document.getElementById("turno-fecha").value;
      const detalle = document.getElementById("turno-detalle").value.trim();

      try {
        const res = await fetch("/api/turnos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, fecha, detalle, servicioId }),
        });

        const data = await res.json();
        if (res.ok) {
          msgOK.style.display = "block";
          formTurno.reset();
          setTimeout(() => (msgOK.style.display = "none"), 3000);
        } else {
          alert("⚠️ " + (data.error || "No se pudo reservar el turno."));
        }
      } catch (err) {
        console.error("❌ Error al crear turno:", err);
        alert("❌ Error al conectar con el servidor.");
      }
    });

    // ================================
    // ⭐ Cargar reseñas existentes
    // ================================
    async function cargarResenas() {
      try {
        const res = await fetch(`/api/resenas/servicio/${servicioId}`);
        if (!res.ok) throw new Error("Error al cargar reseñas");
        const data = await res.json();
        const lista = document.getElementById("lista-resenas");

        if (!data.length) {
          lista.innerHTML = "<p class='muted'>Aún no hay reseñas.</p>";
          return;
        }

        lista.innerHTML = data
          .map(
            (r) => `
          <li class="resena-item">
            <p><strong>${r.nombre}</strong> (${new Date(r.createdAt).toLocaleDateString()})</p>
            <p>⭐ ${r.puntaje}/5</p>
            <p>${r.comentario}</p>
          </li>`
          )
          .join("");
      } catch (error) {
        console.error("❌ Error al cargar reseñas:", error);
      }
    }

    await cargarResenas();

    // ================================
    // ✏️ Enviar nueva reseña
    // ================================
    const formResena = document.getElementById("form-resena");
    const resenaOk = document.getElementById("resena-ok");

    formResena.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = document.getElementById("resena-nombre").value.trim();
      const email = document.getElementById("resena-email").value.trim();
      const comentario = document.getElementById("resena-comentario").value.trim();
      const puntaje = document.getElementById("resena-puntaje").value;

      try {
        const res = await fetch("/api/resenas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, comentario, puntaje, servicioId }),
        });

        const data = await res.json();
        if (res.ok) {
          resenaOk.style.display = "block";
          formResena.reset();
          await cargarResenas();
          setTimeout(() => (resenaOk.style.display = "none"), 3000);
        } else {
          alert("⚠️ " + (data.error || "No se pudo enviar la reseña."));
        }
      } catch (err) {
        console.error("❌ Error al enviar reseña:", err);
        alert("❌ Error al conectar con el servidor.");
      }
    });
  } catch (err) {
    console.error("❌ Error al cargar perfil:", err);
    contenedor.innerHTML = "<p class=\"muted\">❌ Error al cargar el perfil del prestador.</p>";
  }
});





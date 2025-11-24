// public/scripts/prestador.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  const params = new URLSearchParams(window.location.search);
  const servicioId = params.get("id");
  const contenedor = document.getElementById("prestador-view");

  if (!servicioId) {
    contenedor.innerHTML =
      "<p class=\"muted\">⚠️ Servicio no especificado.</p>";
    return;
  }

  try {
    // ✅ Obtener servicio + datos del prestador
    const res = await fetch(`/api/servicios/${servicioId}`);
    if (
      !res.ok ||
      !res.headers.get("content-type")?.includes("application/json")
    ) {
      throw new Error("Respuesta no válida del servidor");
    }

    const servicio = await res.json();

    if (!servicio || servicio.error) {
      contenedor.innerHTML = `<p class="muted">⚠️ ${
        servicio.error || "No se pudo cargar el servicio."
      }</p>`;
      return;
    }

    const prestador = servicio.usuario;

    // ✅ Render del perfil, servicio, turnos y reseñas
    contenedor.innerHTML = `
      <section class="prestador-header">
        <img src="${
          prestador.imagen || "/assets/avatar-placeholder.png"
        }" class="prestador-foto" alt="${prestador.nombre}">
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
        <p><strong>Descripción:</strong> ${
          servicio.descripcion || servicio.comentario || "Sin descripción"
        }</p>
        <p><strong>⭐ Rating promedio:</strong> ${
          servicio.rating?.toFixed(1) ?? "—"
        } / 5</p>
      </section>

      <section class="prestador-turno">
        <h2>Solicitar turno</h2>
        <form id="form-turno">
          <label>Nombre</label>
          <input type="text" id="turno-nombre" required>

          <label>Email</label>
          <input type="email" id="turno-email" required>

          <div class="campo-fecha-hora">
            <div class="campo">
              <label>Fecha</label>
              <input type="date" id="turno-fecha" required>
            </div>
            <div class="campo">
              <label>Hora</label>
              <input type="time" id="turno-hora" required>
            </div>
          </div>

          <label>Detalle (opcional)</label>
          <textarea id="turno-detalle" placeholder="Ej: preferencia de horario..."></textarea>

          <button type="submit" class="btn">Reservar turno</button>
          <p id="turno-ok" class="success-msg" style="display:none;">✅ Turno reservado correctamente.</p>
        </form>
      </section>

      <section class="prestador-resenas">
        <h2>Reseñas</h2>

        <ul id="lista-resenas"></ul>

        <p id="msg-requiere-login" style="display:none; color: red;">
          Debes iniciar sesión para dejar una reseña.
        </p>

        <form id="form-resena" style="display:none;">
          <label>Puntaje</label>
          <select id="resena-puntaje">
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>

          <label>Comentario</label>
          <textarea id="resena-comentario"></textarea>

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

    if (formTurno) {
      formTurno.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document
          .getElementById("turno-nombre")
          .value.trim();
        const email = document
          .getElementById("turno-email")
          .value.trim();
        const fecha = document.getElementById("turno-fecha").value;
        const hora = document.getElementById("turno-hora").value;
        const detalle = document
          .getElementById("turno-detalle")
          .value.trim();

        if (!nombre || !email || !fecha || !hora) {
          alert("⚠️ Completá nombre, email, fecha y hora.");
          return;
        }

        const fechaHoraISO = `${fecha}T${hora}`;

        try {
          const resTurno = await fetch("/api/turnos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre,
              email,
              fecha: fechaHoraISO,
              detalle,
              servicioId,
            }),
          });

          const dataTurno = await resTurno.json();
          if (resTurno.ok) {
            msgOK.style.display = "block";
            formTurno.reset();
            setTimeout(() => (msgOK.style.display = "none"), 3000);
          } else {
            alert(
              "⚠️ " +
                (dataTurno.error || "No se pudo reservar el turno.")
            );
          }
        } catch (err) {
          console.error("❌ Error al crear turno:", err);
          alert("❌ Error al conectar con el servidor.");
        }
      });
    }

    // ================================
    // ⭐ Cargar reseñas existentes
    // ================================
    const listaResenas = document.getElementById("lista-resenas");

    async function cargarResenas() {
      if (!listaResenas) return;

      try {
        const resResenas = await fetch(
          `/api/resenas/servicio/${servicioId}`
        );
        if (!resResenas.ok) {
          throw new Error("Error al cargar reseñas");
        }
        const data = await resResenas.json();

        if (!data.length) {
          listaResenas.innerHTML =
            "<p class='muted'>Aún no hay reseñas.</p>";
          return;
        }

        listaResenas.innerHTML = data
          .map(
            (r) => `
          <li class="resena-item card-servicio">
            <div class="servicio-info">
              <p><strong>${r.nombre}</strong> (${new Date(
              r.createdAt
            ).toLocaleDateString()})</p>
              <p>⭐ ${r.puntaje}/5</p>
              <p>${r.comentario}</p>
            </div>
          </li>`
          )
          .join("");
      } catch (error) {
        console.error("❌ Error al cargar reseñas:", error);
        listaResenas.innerHTML =
          "<p class='muted'>⚠️ No se pudieron cargar las reseñas.</p>";
      }
    }

    await cargarResenas();

    // ================================
    // 🔐 Mostrar/ocultar formulario de reseña según login
    // ================================
    const formResenaEl = document.getElementById("form-resena");
    const msgLoginEl = document.getElementById("msg-requiere-login");
    const resenaOk = document.getElementById("resena-ok");

    if (formResenaEl && msgLoginEl) {
      if (!token) {
        formResenaEl.style.display = "none";
        msgLoginEl.style.display = "block";
      } else {
        formResenaEl.style.display = "block";
        msgLoginEl.style.display = "none";
      }
    }

    // ================================
    // ✏️ Enviar nueva reseña (requiere login)
    // ================================
    if (formResenaEl && token) {
      formResenaEl.addEventListener("submit", async (e) => {
        e.preventDefault();

        const comentario = document
          .getElementById("resena-comentario")
          .value.trim();
        const puntaje = document.getElementById("resena-puntaje").value;

        if (!comentario || !puntaje) {
          alert("⚠️ Completá puntaje y comentario.");
          return;
        }

        try {
          const resCrear = await fetch("/api/resenas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ comentario, puntaje, servicioId }),
          });

          const dataCrear = await resCrear.json();

          if (resCrear.ok) {
            if (resenaOk) resenaOk.style.display = "block";
            formResenaEl.reset();
            await cargarResenas();
            setTimeout(() => {
              if (resenaOk) resenaOk.style.display = "none";
            }, 3000);
          } else {
            alert(
              "⚠️ " +
                (dataCrear.error || "No se pudo enviar la reseña.")
            );
          }
        } catch (err) {
          console.error("❌ Error al enviar reseña:", err);
          alert("❌ Error al conectar con el servidor.");
        }
      });
    }
  } catch (err) {
    console.error("❌ Error al cargar perfil del prestador:", err);
    contenedor.innerHTML =
      "<p class=\"muted\">❌ Error al cargar el perfil del prestador.</p>";
  }
});





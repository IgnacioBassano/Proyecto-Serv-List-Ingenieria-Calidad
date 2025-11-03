// public/app.js

// 🧭 Selector corto
function $(sel, ctx = document) {
  return ctx.querySelector(sel);
}

// ============================
// 🧱 Render de tarjetas de servicio
// ============================
function servicioCardLink(s) {
  const href = `prestador.html?id=${encodeURIComponent(s.id)}`;
  const foto = s.imagen || "/assets/placeholder.jpg";
  const descripcion = s.comentario?.length > 100
    ? s.comentario.slice(0, 100) + "..."
    : s.comentario || "Sin descripción disponible.";

  return `
  <a class="card" href="${href}" aria-label="Ver perfil de ${s.titulo}">
    <img src="${foto}" alt="Foto de ${s.titulo}" onerror="this.src='/assets/placeholder.jpg';" />
    <div class="card-body">
      <h3>${s.titulo}</h3>
      <p class="muted">${s.categoria} · ${s.ubicacion}</p>
      <p class="muted">⭐ ${s.rating?.toFixed(1) ?? "—"} · ${s.experiencia || "Sin reseñas"}</p>
      <p>${descripcion}</p>
    </div>
  </a>`;
}

// ============================
// 🔍 Buscar servicios
// ============================
async function buscarServicios(params) {
  const url = new URL("/api/servicios", location.origin);
  if (params?.categoria) url.searchParams.set("categoria", params.categoria);
  if (params?.ubicacion) url.searchParams.set("ubicacion", params.ubicacion);
  if (params?.q) url.searchParams.set("q", params.q);

  const resultados = $("#resultados");
  const sinResultados = $("#sin-resultados");

  if (resultados) resultados.innerHTML = "<p class='muted'>Cargando resultados...</p>";
  if (sinResultados) sinResultados.style.display = "none";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en la API");
    const data = await res.json();

    if (data.length) {
      resultados.innerHTML = data.map(servicioCardLink).join("");
      sinResultados.style.display = "none";
    } else {
      resultados.innerHTML = "";
      sinResultados.style.display = "block";
      sinResultados.textContent = "No encontramos servicios con esos filtros.";
    }
  } catch (e) {
    console.error("❌ Error en buscarServicios:", e);
    resultados.innerHTML = "";
    sinResultados.textContent = "Error al cargar los resultados. Verificá el servidor.";
    sinResultados.style.display = "block";
  }
}

// ============================
// Cargar prestador
// ============================
async function cargarPrestadorDesdeQuery() {
  const root = document.getElementById("prestador-view");
  if (!root || root.dataset.rendered === "1") return;
  root.dataset.rendered = "1";

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    root.innerHTML = "<p class=\"muted\">❌ Falta el parámetro <code>id</code>.</p>";
    return;
  }

  try {
    const res = await fetch(`/api/servicios/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("No encontrado");
    const s = await res.json();

    root.innerHTML = `
      <section class="prestador-perfil">
        <div class="prestador-header">
          <img src="${s.imagen || "/assets/placeholder.jpg"}" alt="${s.titulo}" class="prestador-foto">
          <div class="prestador-info">
            <h1>${s.titulo}</h1>
            <p class="muted">${s.categoria} · ${s.ubicacion}</p>
            <p id="rating-text" class="rating">${s.rating?.toFixed(1) ?? "—"} ★</p>
            <p>📧 <a href="mailto:${s.email || "contacto@example.com"}">${s.email || "contacto@example.com"}</a></p>
          </div>
        </div>

        <section class="prestador-descripcion">
          <h2>Acerca de este servicio</h2>
          <p>${s.descripcion || "Profesional con experiencia en el rubro."}</p>
        </section>

        <section class="prestador-turno">
          <h2>Solicitar turno</h2>
          <form id="form-turno" class="form">
            <label>Nombre<input type="text" name="nombre" required></label>
            <label>Email<input type="email" name="email" required></label>
            <label>Fecha<input type="date" name="fecha"></label>
            <label>Detalle<textarea name="detalle" rows="3" placeholder="Detalles del trabajo o preferencia horaria"></textarea></label>
            <input type="hidden" name="servicioId" value="${s.id}">
            <button class="btn" type="submit">Reservar turno</button>
          </form>
          <p id="turno-ok" style="display:none;color:green;">✅ Turno reservado correctamente.</p>
        </section>

        <!-- ⭐ Reseñas -->
        <section class="prestador-reseñas">
          <h2>Reseñas de clientes</h2>
          <ul id="lista-reseñas" class="reseñas-list"></ul>

          <h3>Dejar una reseña</h3>
          <form id="form-reseña" class="form">
            <label>Nombre<input type="text" name="nombre" required></label>
            <label>Email<input type="email" name="email" required></label>
            <label>Comentario<textarea name="comentario" rows="3" required></textarea></label>
            <label>Puntaje
              <select name="puntaje" required>
                <option value="">Seleccionar</option>
                <option value="5">⭐️⭐️⭐️⭐️⭐️ - Excelente</option>
                <option value="4">⭐️⭐️⭐️⭐️ - Muy bueno</option>
                <option value="3">⭐️⭐️⭐️ - Bueno</option>
                <option value="2">⭐️⭐️ - Regular</option>
                <option value="1">⭐️ - Malo</option>
              </select>
            </label>
            <input type="hidden" name="servicioId" value="${s.id}">
            <button class="btn" type="submit">Enviar reseña</button>
          </form>
          <p id="reseña-ok" style="display:none;color:green;">✅ ¡Gracias por tu reseña!</p>
        </section>
      </section>
    `;

    // =============================
    // 📅 Enviar turno
    // =============================
    const formTurno = document.getElementById("form-turno");
    formTurno.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(formTurno));
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        document.getElementById("turno-ok").style.display = "block";
        formTurno.reset();
      } else {
        alert("⚠️ No se pudo enviar la solicitud.");
      }
    });

    // =============================
    // ⭐ Mostrar reseñas existentes
    // =============================
    const lista = document.getElementById("lista-reseñas");
    const reseñasRes = await fetch(`/api/resenas/servicio/${s.id}`);
    const reseñas = await reseñasRes.json();

    if (reseñas.length) {
      lista.innerHTML = reseñas
        .map(r => {
          // 🔹 Normalizamos la fecha segura
          const fecha = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Sin fecha";

          return `
            <li class="reseña-item">
              <p><strong>${r.nombre}</strong> (${r.email})</p>
              <p>⭐ ${r.puntaje}/5</p>
              <p>${r.comentario}</p>
              <p class="muted">${fecha}</p>
            </li>
          `;
        })
        .join("");
    } else {
      lista.innerHTML = "<p class=\"muted\">Aún no hay reseñas para este servicio.</p>";
    }

    // =============================
    // ✏️ Enviar nueva reseña
    // =============================
    const formReseña = document.getElementById("form-reseña");
    const msgReseña = document.getElementById("reseña-ok");
    const ratingText = document.getElementById("rating-text");

    formReseña.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(formReseña));
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (res.ok) {
        msgReseña.style.display = "block";
        formReseña.reset();

        // agregar reseña nueva
        const fechaNow = new Date().toLocaleDateString();
        const nueva = `
          <li class="reseña-item">
            <p><strong>${data.nombre}</strong> (${data.email})</p>
            <p>⭐ ${data.puntaje}/5</p>
            <p>${data.comentario}</p>
            <p class="muted">${fechaNow}</p>
          </li>`;
        lista.innerHTML = nueva + lista.innerHTML;

        // actualizar rating en pantalla
        if (json.nuevoRating !== undefined) {
          ratingText.textContent = `${json.nuevoRating.toFixed(1)} ★`;
        }

        setTimeout(() => (msgReseña.style.display = "none"), 2500);
      } else {
        alert("⚠️ " + (json.error || "No se pudo enviar la reseña."));
      }
    });

  } catch (err) {
    console.error(err);
    root.innerHTML = "<p class=\"muted\">❌ No encontramos el servicio solicitado.</p>";
  }
}

// ============================
// 🚀 Inicialización general
// ============================
window.addEventListener("DOMContentLoaded", () => {
  // Buscar servicios (index.html)
  const fb = $("#form-busqueda");
  if (fb) {
    fb.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = new FormData(fb);
      buscarServicios({
        categoria: form.get("categoria") || "",
        ubicacion: form.get("ubicacion") || "",
        q: form.get("q") || "",
      });
    });
    buscarServicios({});
  }

  // Publicar servicio (publicar-servicio.html)
  const fp = document.getElementById("form-publicar");
  if (fp) {
    fp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Tenés que iniciar sesión para publicar un servicio.");
        window.location.href = "iniciar-sesion.html";
        return;
      }
      const form = new FormData(fp);
      const payload = Object.fromEntries(form.entries());
      if (payload.items) {
        payload.items = payload.items.split(",").map(s => s.trim()).filter(Boolean);
      }
      try {
        const res = await fetch("/api/servicios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (res.ok) {
          document.getElementById("publicado-ok").style.display = "block";
          fp.reset();
        } else {
          alert("⚠️ " + (json.error || "Error al publicar el servicio"));
        }
      } catch (err) {
        console.error("❌ Error al publicar:", err);
        alert("❌ No se pudo conectar con el servidor.");
      }
    });
  }

  // Cargar prestador (prestador.html)
  cargarPrestadorDesdeQuery();
});

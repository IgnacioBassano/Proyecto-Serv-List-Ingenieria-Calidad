function $(sel, ctx = document) {
  return ctx.querySelector(sel);
}


function servicioCardLink(s) {
  const href = `prestador.html?id=${encodeURIComponent(s.id)}`;
  const foto = s.imagen || "/assets/placeholder.jpg";
  return `
  <a class="card" href="${href}" aria-label="Ver perfil de ${s.titulo}">
    <img src="${foto}" alt="Foto de ${s.titulo}" onerror="this.src='/assets/placeholder.jpg';" />
    <div class="card-body">
      <h3><span class="nombre-link">${s.titulo}</span> · ${s.categoria}</h3>
      <p class="muted">${s.ubicacion} · ${s.rating?.toFixed(1) ?? "—"} ★</p>
      <p>${s.comentario}</p>
    </div>
  </a>`;
}


async function buscarServicios(params) {
  const url = new URL("/api/servicios", location.origin);
  if (params?.categoria) url.searchParams.set("categoria", params.categoria);
  if (params?.ubicacion) url.searchParams.set("ubicacion", params.ubicacion);
  if (params?.q) url.searchParams.set("q", params.q);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en API");
    const data = await res.json();
    const html = data.length ? data.map(servicioCardLink).join("") : "";
    const resultados = $("#resultados");
    if (resultados) resultados.innerHTML = html;
    const sinResultados = $("#sin-resultados");
    if (sinResultados) sinResultados.style.display = html ? "none" : "block";
  } catch (e) {
    console.error(e);
    const resultados = $("#resultados");
    if (resultados) resultados.innerHTML = "";
    const sinResultados = $("#sin-resultados");
    if (sinResultados) {
      sinResultados.textContent = "No pudimos cargar los resultados (revisá el servidor).";
      sinResultados.style.display = "block";
    }
  }
}


async function cargarPrestadorDesdeQuery() {
  const root = $("#prestador-view");
  if (!root) return;
  if (root.dataset.rendered === "1") return;
  root.dataset.rendered = "1";

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) {
    root.innerHTML = `<p class="muted">Falta el parámetro <code>id</code>.</p>`;
    return;
  }

  try {
    const res = await fetch(`/api/servicios/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("No encontrado");
    const s = await res.json();

    root.innerHTML = `
      <section class="profile">
        <img class="avatar" src="${s.imagen || "/assets/placeholder.jpg"}" alt="Foto de ${s.titulo}" onerror="this.src='/assets/placeholder.jpg';" />
        <div class="profile-info">
          <h1>${s.titulo}</h1>
          <p class="muted">Categoría: ${s.categoria} · ${s.rating?.toFixed(1) ?? "—"} ★ · 
            <a href="mailto:${s.email || "contacto@example.com"}">${s.email || "contacto@example.com"}</a>
          </p>
          <p class="muted">${s.ubicacion}</p>
        </div>
      </section>

      <nav class="tabs">
        <a href="#acerca-de" class="tab">Acerca de</a>
        <a href="#servicios" class="tab">Servicios</a>
        <a href="#turno" class="tab">Solicitar turno</a>
        <a href="#contacto" class="tab">Contacto</a>
      </nav>

      <section id="acerca-de" class="panel">
        <h2>Acerca de</h2>
        <p>${s.descripcion || "Profesional con experiencia demostrable en el rubro."}</p>
      </section>

      <section id="servicios" class="panel">
        <h2>Servicios</h2>
        <ul>
          ${(s.items || []).map(it => `<li>${it}</li>`).join("")}
        </ul>
      </section>

      <section id="turno" class="panel">
        <h2>Solicitar turno</h2>
        <form class="form" id="form-turno">
          <label><span>Nombre</span><input type="text" name="nombre" required /></label>
          <label><span>Email</span><input type="email" name="email" required /></label>
          <label><span>Fecha preferida</span><input type="date" name="fecha" /></label>
          <label class="grow"><span>Detalle</span><textarea name="detalle" rows="4"></textarea></label>
          <input type="hidden" name="servicioId" value="${s.id}" />
          <button class="btn" type="submit">Enviar solicitud</button>
        </form>
        <p id="turno-ok" class="muted" style="display:none;">¡Solicitud enviada!</p>
      </section>

      <section id="contacto" class="panel">
        <h2>Contacto</h2>
        <p>Teléfono: <a href="tel:+54000000000">+54 000 000 000</a></p>
        <p>Email: <a href="mailto:${s.email || "contacto@example.com"}">${s.email || "contacto@example.com"}</a></p>
      </section>
    `;

    
    const ft = $("#form-turno");
    if (ft) {
      ft.addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = new FormData(ft);
        const payload = Object.fromEntries(form.entries());
        const r = await fetch("/api/turnos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          $("#turno-ok").style.display = "block";
          ft.reset();
        }
      });
    }
  } catch (err) {
    console.error(err);
    root.innerHTML = `<p class="muted">No encontramos el prestador solicitado.</p>`;
  }
}


window.addEventListener("DOMContentLoaded", () => {
  
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

  
  const fp = $("#form-publicar");
  if (fp) {
    fp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = new FormData(fp);
      const payload = Object.fromEntries(form.entries());

      
      if (payload.items) {
        payload.items = payload.items.split(",").map(s => s.trim()).filter(Boolean);
      }

      const r = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (r.ok) {
        $("#publicado-ok").style.display = "block";
        fp.reset();
      } else {
        const err = await r.json();
        alert("Error: " + (err.error || "No se pudo publicar"));
      }
    });
  }

  
  cargarPrestadorDesdeQuery();


  const toggleBtn = document.getElementById("toggle-theme");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      toggleBtn.textContent = isDark ? "☀️ Claro" : "🌙 Oscuro";
    });
  }
});
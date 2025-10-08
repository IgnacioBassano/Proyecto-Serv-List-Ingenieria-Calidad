document.addEventListener("DOMContentLoaded", async () => {
  const avatarImg = document.getElementById("avatar-img");
  const avatarInput = document.getElementById("avatar-input");
  const form = document.getElementById("perfil-form");
  const saveBtn = document.querySelector(".guardar-btn");

  const modal = document.getElementById("editar-modal");
  const cerrarModalBtn = document.getElementById("cerrar-modal");
  const formEditar = document.getElementById("editar-form");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ Tenés que iniciar sesión para acceder al perfil.");
    window.location.href = "iniciar-sesion.html";
    return;
  }

  // ===============================
  // 👤 Cargar perfil desde backend
  // ===============================
  async function cargarPerfil() {
    try {
      const res = await fetch("/api/usuarios/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || data.error)
        throw new Error(data.error || "Error al cargar perfil.");

      document.getElementById("nombre-usuario").textContent = data.nombre;
      document.getElementById("email-usuario").textContent = data.email;
      document.getElementById("rol-usuario").textContent = `Rol: ${data.rol}`;
      document.getElementById("localidad-resumen").textContent = data.localidad || "—";
      document.getElementById("telefono-resumen").textContent = data.telefono || "—";

      document.getElementById("nombre").value = data.nombre;
      document.getElementById("email").value = data.email;
      document.getElementById("telefono").value = data.telefono || "";
      document.getElementById("localidad").value = data.localidad || "";

      if (data.imagen) {
        avatarImg.src = data.imagen;
        localStorage.setItem("avatar", data.imagen);
      }

      localStorage.setItem("usuario", JSON.stringify(data));
    } catch (err) {
      console.error("❌ Error al cargar perfil:", err);
      alert("⚠️ No se pudo obtener el perfil del usuario. Iniciá sesión de nuevo.");
      window.location.href = "iniciar-sesion.html";
    }
  }

  await cargarPerfil();

  // ===============================
  // 📝 Edición de datos personales
  // ===============================
  const editButtons = document.querySelectorAll(".edit-btn");
  const guardarBtn = document.querySelector(".guardar-btn");

  if (editButtons && guardarBtn && form) {
    editButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const fieldGroup = e.target.closest(".field-group");
        const input = fieldGroup.querySelector("input");
        input.removeAttribute("readonly");
        input.focus();
        btn.style.display = "none";
        guardarBtn.style.display = "block";
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        nombre: document.getElementById("nombre").value.trim(),
        email: document.getElementById("email").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        localidad: document.getElementById("localidad").value.trim(),
      };

      try {
        const usuario = JSON.parse(localStorage.getItem("usuario"));
const res = await fetch("/api/usuarios/update", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ id: usuario.id, ...data }),
});


        const result = await res.json();

        if (res.ok) {
          alert("✅ Perfil actualizado correctamente.");
          await cargarPerfil();
          guardarBtn.style.display = "none";
          editButtons.forEach((b) => (b.style.display = "inline-block"));
        } else {
          alert("⚠️ " + (result.error || "No se pudo actualizar el perfil."));
        }
      } catch (err) {
        console.error("❌ Error al guardar perfil:", err);
        alert("⚠️ No se pudo guardar el perfil.");
      }
    });
  }

  // 🖼️ Actualización de foto/avatar
if (avatarInput) {
  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files[0];
    if (!file) return;

    // Convertir a Base64 (más simple que usar upload multipart)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      try {
        const res = await fetch("/api/usuarios/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: usuario.id,
            imagen: base64Image,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          avatarImg.src = data.usuario.imagen;
          localStorage.setItem("avatar", data.usuario.imagen);
          alert("✅ Imagen de perfil actualizada.");
        } else {
          alert("⚠️ " + (data.error || "No se pudo actualizar la imagen."));
        }
      } catch (err) {
        console.error("❌ Error al subir avatar:", err);
      }
    };

    reader.readAsDataURL(file); // Lee la imagen y la convierte a Base64
  });
}


  // ===============================
  // 📦 Mostrar servicios del usuario
  // ===============================
  async function cargarServicios() {
    const listaServicios = document.querySelector(".servicios-list");
    const contador = document.getElementById("servicios-count");

    try {
      const res = await fetch("/api/servicios/mios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Error al cargar servicios.");

      if (!data.length) {
        listaServicios.innerHTML = `<p class="muted">Aún no publicaste servicios.</p>`;
        if (contador) contador.textContent = "0";
        return;
      }

      if (contador) contador.textContent = data.length;

      listaServicios.innerHTML = data
        .map(
          (s) => `
          <li class="servicio-item card-servicio">
            <img src="${s.imagen || "/assets/placeholder.jpg"}" alt="servicio" class="servicio-img">
            <div class="servicio-info">
              <h3>${s.titulo}</h3>
              <p>${s.categoria} · ${s.ubicacion}</p>
              <p class="muted">${s.comentario || "Sin descripción"}</p>
              <div class="servicio-actions">
                <button class="btn-editar" 
                  data-id="${s.id}" 
                  data-titulo="${s.titulo}" 
                  data-categoria="${s.categoria}" 
                  data-ubicacion="${s.ubicacion}" 
                  data-comentario="${s.comentario || ""}">✏️ Editar</button>
                <button class="btn-eliminar" data-id="${s.id}">🗑️ Eliminar</button>
              </div>
            </div>
          </li>`
        )
        .join("");
    } catch (err) {
      console.error("❌ Error al cargar servicios:", err);
      listaServicios.innerHTML = `<p class="muted">⚠️ No se pudieron cargar los servicios.</p>`;
      if (contador) contador.textContent = "0";
    }
  }

  await cargarServicios();

  // ===============================
  // 📅 Cargar turnos del prestador
  // ===============================
  async function cargarTurnos() {
    try {
      const res = await fetch("/api/turnos/mios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const listaTurnos = document.getElementById("lista-turnos");
      if (!res.ok || data.error) throw new Error(data.error);

      if (!data.length) {
        listaTurnos.innerHTML = "<p class='muted'>Aún no tenés turnos reservados.</p>";
        return;
      }

      listaTurnos.innerHTML = data
        .map(
          (t) => `
          <li class="servicio-item card-servicio">
            <div class="servicio-info">
              <h3>${t.servicio}</h3>
              <p>🗓️ ${t.fecha ? new Date(t.fecha).toLocaleDateString() : "Sin fecha"}</p>
              <p>👤 ${t.nombre} (${t.email})</p>
              <p class="muted">💬 ${t.detalle || "Sin detalle"}</p>
              <p>📍 Estado: 
                <strong class="estado ${t.estado}">
                  ${t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                </strong>
              </p>
              <div class="turno-acciones">
                <button class="btn-confirmar" data-id="${t.id}">✅ Confirmar</button>
                <button class="btn-cancelar" data-id="${t.id}">❌ Cancelar</button>
              </div>
            </div>
          </li>`
        )
        .join("");

      document.querySelectorAll(".btn-confirmar").forEach((btn) => {
        btn.addEventListener("click", () => actualizarEstadoTurno(btn.dataset.id, "confirmado"));
      });
      document.querySelectorAll(".btn-cancelar").forEach((btn) => {
        btn.addEventListener("click", () => actualizarEstadoTurno(btn.dataset.id, "cancelado"));
      });
    } catch (err) {
      console.error("❌ Error al cargar turnos:", err);
    }
  }

  async function actualizarEstadoTurno(id, nuevoEstado) {
    try {
      const res = await fetch(`/api/turnos/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Turno ${nuevoEstado} correctamente.`);
        await cargarTurnos();
      } else {
        alert("⚠️ " + (data.error || "No se pudo actualizar el turno."));
      }
    } catch (err) {
      console.error("❌ Error al actualizar turno:", err);
    }
  }

  await cargarTurnos();

  // ===============================
  // ⭐ Cargar reseñas recibidas
  // ===============================
  async function cargarResenasRecibidas() {
    const contenedor = document.getElementById("lista-resenas");
    if (!contenedor) return;

    try {
      const res = await fetch("/api/resenas/mias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || "Error al obtener reseñas");

      if (!data.length) {
        contenedor.innerHTML = `<p class="muted">Aún no recibiste reseñas.</p>`;
        return;
      }

      contenedor.innerHTML = data
        .map(
          (r) => `
        <li class="reseña-item card-servicio">
          <div class="servicio-info">
            <p><strong>${r.nombre}</strong> (${r.email})</p>
            <p>Servicio: <em>${r.servicio}</em></p>
            <p>⭐ ${r.puntaje}/5</p>
            <p>${r.comentario}</p>
            <p class="muted">${new Date(r.createdAt).toLocaleDateString()}</p>
          </div>
        </li>`
        )
        .join("");
    } catch (err) {
      console.error("❌ Error al cargar reseñas recibidas:", err);
      contenedor.innerHTML = `<p class="muted">⚠️ No se pudieron cargar tus reseñas.</p>`;
    }
  }

  // ===============================
  // ✏️ Editar servicio (modal)
  // ===============================
  document.querySelector(".servicios-list").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-editar")) {
      const s = e.target.dataset;
      document.getElementById("edit-id").value = s.id;
      document.getElementById("edit-titulo").value = s.titulo;
      document.getElementById("edit-categoria").value = s.categoria;
      document.getElementById("edit-ubicacion").value = s.ubicacion;
      document.getElementById("edit-comentario").value = s.comentario;
      modal.classList.add("show");
      modal.style.display = "flex";
    }
  });

  formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const servicioActualizado = {
      titulo: document.getElementById("edit-titulo").value,
      categoria: document.getElementById("edit-categoria").value,
      ubicacion: document.getElementById("edit-ubicacion").value,
      comentario: document.getElementById("edit-comentario").value,
    };

    try {
      const res = await fetch(`/api/servicios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(servicioActualizado),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Servicio actualizado correctamente.");
        modal.classList.remove("show");
        setTimeout(() => (modal.style.display = "none"), 200);
        await cargarServicios();
      } else {
        alert("⚠️ " + (data.error || "No se pudo actualizar el servicio."));
      }
    } catch (error) {
      console.error("❌ Error al actualizar servicio:", error);
      alert("❌ Error al conectar con el servidor.");
    }
  });

  // Eliminar servicio
  document.querySelector(".servicios-list").addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-eliminar")) {
      const id = e.target.dataset.id;
      if (!confirm("¿Seguro que querés eliminar este servicio?")) return;

      try {
        const res = await fetch(`/api/servicios/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          alert("🗑️ Servicio eliminado correctamente.");
          await cargarServicios();
        } else {
          alert("⚠️ " + (data.error || "No se pudo eliminar el servicio."));
        }
      } catch (error) {
        console.error("❌ Error al eliminar servicio:", error);
        alert("❌ Error al conectar con el servidor.");
      }
    }
  });

  // ===============================
  // 🗂️ Tabs del perfil
  // ===============================
  const tabs = document.querySelectorAll(".perfil-tab");
  const contents = document.querySelectorAll(".tab-content");
  tabs.forEach((btn) =>
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      contents.forEach((c) => (c.style.display = "none"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).style.display = "block";

      if (btn.dataset.tab === "reseñas") {
        cargarResenasRecibidas();
      }
    })
  );

  // ===============================
  // 🚪 Cerrar modal
  // ===============================
  cerrarModalBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    setTimeout(() => (modal.style.display = "none"), 200);
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
      setTimeout(() => (modal.style.display = "none"), 200);
    }
  });
});


document.addEventListener("DOMContentLoaded", async () => {
  const avatarImg = document.getElementById("avatar-img");
  const avatarInput = document.getElementById("avatar-input");
  const formPerfil = document.getElementById("perfil-form");

  const modal = document.getElementById("editar-modal");
  const cerrarModalBtn = document.getElementById("cerrar-modal");
  const formEditar = document.getElementById("editar-form");

  const token = localStorage.getItem("token");
  if (!token) {
    alert("⚠️ Tenés que iniciar sesión para acceder al perfil.");
    window.location.href = "iniciar-sesion.html";
    return;
  }

  let usuarioRol = null; // CLIENTE o PRESTADOR

  // ===============================
  // 👤 Cargar perfil
  // ===============================
  async function cargarPerfil() {
    try {
      const res = await fetch("/api/usuarios/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok || data.error)
        throw new Error(data.error || "Error al cargar perfil");

      document.getElementById("nombre-usuario").textContent = data.nombre;
      document.getElementById("email-usuario").textContent = data.email;
      document.getElementById("rol-usuario").textContent = `Rol: ${data.rol}`;
      document.getElementById("localidad-resumen").textContent =
        data.localidad || "—";
      document.getElementById("telefono-resumen").textContent =
        data.telefono || "—";

      document.getElementById("nombre").value = data.nombre;
      document.getElementById("email").value = data.email;
      document.getElementById("telefono").value = data.telefono || "";
      document.getElementById("localidad").value = data.localidad || "";

      if (data.imagen) {
        avatarImg.src = data.imagen;
        localStorage.setItem("avatar", data.imagen);
      }

      localStorage.setItem("usuario", JSON.stringify(data));
      usuarioRol = data.rol;

      // Ajustes de UI según rol (label de servicios, tab Servicios, reseñas, etc.)
      ajustarVistaPorRol();
    } catch (err) {
      console.error("❌ Error al cargar perfil:", err);
      alert("No se pudo cargar el perfil. Volvé a iniciar sesión.");
      window.location.href = "iniciar-sesion.html";
    }
  }

  // ===============================
  // 🎭 Ajustes visuales según rol
  // ===============================
  function ajustarVistaPorRol() {
    const tituloResenas = document.getElementById("titulo-reseñas");
    const serviciosLabel = document.getElementById("servicios-label");
    const tabServiciosBtn = document.querySelector("[data-tab=\"servicios\"]");

    if (usuarioRol === "PRESTADOR") {
      // Prestador → servicios publicados, turnos de sus servicios, reseñas RECIBIDAS
      if (tituloResenas) tituloResenas.textContent = "Reseñas recibidas";
      if (serviciosLabel)
        serviciosLabel.textContent = "🛠️ Servicios publicados:";
      if (tabServiciosBtn) tabServiciosBtn.style.display = "inline-block";
    } else {
      // Cliente → servicios contratados (concepto), reseñas ENVIADAS
      if (tituloResenas) tituloResenas.textContent = "Mis reseñas enviadas";
      if (serviciosLabel)
        serviciosLabel.textContent = "🛎️ Servicios contratados:";
      // Si querés que cliente NO vea nunca la pestaña Servicios:
      if (tabServiciosBtn) tabServiciosBtn.style.display = "none";
    }
  }

    // Carga inicial de perfil
  await cargarPerfil();

  // 👉 Actualizar contador inicial según rol
  if (usuarioRol === "CLIENTE") {
    // Cuenta cuántos turnos reservaste y actualiza "Servicios contratados"
    cargarServiciosContratadosCliente();
  } else if (usuarioRol === "PRESTADOR") {
    // Carga tus servicios publicados y actualiza "Servicios publicados"
    cargarServicios();
  }


  // ===============================
  // 📝 Edición de datos personales
  // ===============================
  const editButtons = document.querySelectorAll(".edit-btn");
  const guardarBtn = document.querySelector(".guardar-btn");

  if (editButtons && guardarBtn && formPerfil) {
    editButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const group = e.target.closest(".field-group");
        const input = group.querySelector("input");
        input.removeAttribute("readonly");
        input.focus();
        btn.style.display = "none";
        guardarBtn.style.display = "block";
      });
    });

    formPerfil.addEventListener("submit", async (e) => {
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

        const out = await res.json();

        if (res.ok) {
          alert("✅ Perfil actualizado correctamente.");
          await cargarPerfil();
          guardarBtn.style.display = "none";
          editButtons.forEach((b) => (b.style.display = "inline-block"));
        } else {
          alert(out.error || "No se pudo actualizar.");
        }
      } catch (err) {
        console.error("❌ Error:", err);
      }
    });
  }

  // ===============================
  // 🖼️ Avatar
  // ===============================
  if (avatarInput) {
    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        try {
          const res = await fetch("/api/usuarios/update", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: usuario.id, imagen: base64 }),
          });

          const out = await res.json();

          if (res.ok) {
            avatarImg.src = out.usuario.imagen;
            localStorage.setItem("avatar", out.usuario.imagen);
          } else {
            alert(out.error || "Error al actualizar imagen.");
          }
        } catch (err) {
          console.error("❌", err);
        }
      };

      reader.readAsDataURL(file);
    });
  }

  // ===============================
  // 📦 Servicios (solo PRESTADOR)
  // ===============================
  async function cargarServicios() {
    const lista = document.querySelector(".servicios-list");
    const contador = document.getElementById("servicios-count");
    if (!lista) return;

    // Si es cliente, por ahora no hay servicios propios que mostrar
    if (usuarioRol !== "PRESTADOR") {
      lista.innerHTML =
        "<p class='muted'>Como cliente no publicás servicios.</p>";
      if (contador && contador.textContent === "") contador.textContent = "0";
      return;
    }

    try {
      const res = await fetch("/api/servicios/mios", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok || data.error) throw new Error();

      if (!data.length) {
        lista.innerHTML =
          "<p class='muted'>Aún no publicaste servicios.</p>";
        if (contador) contador.textContent = "0";
        return;
      }

      if (contador) contador.textContent = data.length;

      lista.innerHTML = data
        .map(
          (s) => `
        <li class="servicio-item card-servicio">
          <img src="${s.imagen || "/assets/placeholder.jpg"}" class="servicio-img">
          <div class="servicio-info">
            <h3>${s.titulo}</h3>
            <p>${s.categoria} · ${s.ubicacion}</p>
            <p class="muted">${s.comentario || ""}</p>
            <div class="servicio-actions">
              <button class="btn-editar"
                data-id="${s.id}"
                data-titulo="${s.titulo}"
                data-categoria="${s.categoria}"
                data-ubicacion="${s.ubicacion}"
                data-comentario="${s.comentario}">✏️ Editar</button>
              <button class="btn-eliminar" data-id="${s.id}">🗑️ Eliminar</button>
            </div>
          </div>
        </li>`
        )
        .join("");
    } catch (err) {
      console.error("❌ Error al cargar servicios:", err);
      lista.innerHTML =
        "<p class='muted'>No se pudieron cargar servicios.</p>";
      if (contador) contador.textContent = "0";
    }
  }

  // ===============================
  // 📅 Turnos (PRESTADOR vs CLIENTE)
  // ===============================
  async function cargarTurnos() {
    const listaTurnos = document.getElementById("lista-turnos");
    if (!listaTurnos) return;

    try {
      // 👉 Elegimos el endpoint según el rol
      const url =
        usuarioRol === "PRESTADOR"
          ? "/api/turnos/mios"
          : "/api/turnos/reservados";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("❌ Error desde backend:", data.error);
        listaTurnos.innerHTML =
          "<p class='muted'>⚠ No se pudieron cargar los turnos.</p>";
        return;
      }

      // 👉 Sin turnos
      if (!data.length) {
        listaTurnos.innerHTML =
          "<p class='muted'>Aún no reservaste turnos.</p>";
        return;
      }

      // 👉 Hay turnos: render distinto según rol
      if (usuarioRol === "PRESTADOR") {
        // VISTA PRESTADOR (puede confirmar / cancelar)
        listaTurnos.innerHTML = data
          .map((t) => {
            const clienteNombre = t.nombre || "Cliente";
            const clienteEmail = t.email || "sin-email";
            const comentario = t.detalle || "Sin detalle";

            return `
            <li class="servicio-item card-servicio">
              <div class="servicio-info">
                <h3>${t.servicio}</h3>
                <p>🗓️ ${
                  t.fecha
                    ? new Date(t.fecha).toLocaleString()
                    : "Sin fecha"
                }</p>
                <p>👤 ${clienteNombre} (${clienteEmail})</p>
                <p class="muted">💬 ${comentario}</p>
                <p>📍 Estado:
                  <strong class="estado ${t.estado}">
                    ${
                      t.estado
                        ? t.estado.charAt(0).toUpperCase() +
                          t.estado.slice(1)
                        : "Pendiente"
                    }
                  </strong>
                </p>
                <div class="turno-acciones">
                  <button class="btn-confirmar" data-id="${
                    t.id
                  }">✅ Confirmar</button>
                  <button class="btn-cancelar" data-id="${
                    t.id
                  }">❌ Cancelar</button>
                </div>
              </div>
            </li>`;
          })
          .join("");
      } else {
        // VISTA CLIENTE (solo consulta sus turnos reservados)
        listaTurnos.innerHTML = data
          .map((t) => {
            const comentario = t.detalle || "Sin detalle";

            return `
            <li class="servicio-item card-servicio">
              <div class="servicio-info">
                <h3>${t.servicio}</h3>
                <p>🗓️ ${
                  t.fecha
                    ? new Date(t.fecha).toLocaleString()
                    : "Sin fecha"
                }</p>
                <p class="muted">💬 ${comentario}</p>
                <p>📍 Estado:
                  <strong class="estado ${t.estado}">
                    ${
                      t.estado
                        ? t.estado.charAt(0).toUpperCase() +
                          t.estado.slice(1)
                        : "Pendiente"
                    }
                  </strong>
                </p>
              </div>
            </li>`;
          })
          .join("");
      }
    } catch (err) {
      console.error("❌ Error al cargar turnos:", err);
      listaTurnos.innerHTML =
        "<p class='muted'>⚠ Error al cargar turnos.</p>";
    }
  }

  // 🔄 Cambiar estado de turno (solo PRESTADOR)
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

      if (!res.ok) {
        alert("⚠ " + (data.error || "No se pudo actualizar el turno."));
        return;
      }

      if (nuevoEstado === "confirmado") {
        alert("✅ Turno confirmado con éxito.");
      } else if (nuevoEstado === "cancelado") {
        alert("✅ Turno cancelado con éxito.");
      }

      await cargarTurnos();
    } catch (error) {
      console.error("❌ Error al actualizar turno:", error);
      alert("⚠ No se pudo conectar con el servidor para actualizar el turno.");
    }
  }

  const listaTurnosEl = document.getElementById("lista-turnos");
  if (listaTurnosEl) {
    listaTurnosEl.addEventListener("click", (e) => {
      if (!usuarioRol || usuarioRol !== "PRESTADOR") return;

      if (e.target.classList.contains("btn-confirmar")) {
        const id = e.target.dataset.id;
        actualizarEstadoTurno(id, "confirmado");
      }

      if (e.target.classList.contains("btn-cancelar")) {
        const id = e.target.dataset.id;
        actualizarEstadoTurno(id, "cancelado");
      }
    });
  }

  // ===============================
  // 📊 Servicios contratados (CLIENTE)
  // ===============================
  async function cargarServiciosContratadosCliente() {
    if (usuarioRol !== "CLIENTE") return;

    const contador = document.getElementById("servicios-count");
    if (!contador) return;

    try {
      const res = await fetch("/api/turnos/reservados", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("❌ Error al obtener turnos reservados:", data.error);
        contador.textContent = "0";
        return;
      }

      // Por ahora contamos CANTIDAD DE TURNOS reservados
      const cantidad = data.length;
      contador.textContent = String(cantidad);
    } catch (err) {
      console.error("❌ Error al calcular servicios contratados:", err);
      contador.textContent = "0";
    }
  }

  // ===============================
  // ⭐ Reseñas recibidas / enviadas
  // ===============================
  async function cargarResenasRecibidas() {
    const lista = document.getElementById("lista-resenas");
    if (!lista) return;

    const res = await fetch("/api/resenas/mias", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!data.length) {
      lista.innerHTML = "<p class='muted'>Aún no recibiste reseñas.</p>";
      return;
    }

    lista.innerHTML = data
      .map(
        (r) => `
      <li class="reseña-item card-servicio">
        <div class="servicio-info">
          <p><strong>${r.nombre}</strong></p>
          <p>Servicio: ${r.servicio}</p>
          <p>⭐ ${r.puntaje}/5</p>
          <p>${r.comentario}</p>
          <p>${r.fecha ? new Date(r.fecha).toLocaleDateString() : ""}</p>
        </div>
      </li>`
      )
      .join("");
  }

  async function cargarResenasEnviadas() {
    const lista = document.getElementById("lista-resenas");
    if (!lista) return;

    const res = await fetch("/api/resenas/enviadas", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!data.length) {
      lista.innerHTML = "<p class='muted'>Todavía no dejaste reseñas.</p>";
      return;
    }

    lista.innerHTML = data
      .map(
        (r) => `
      <li class="reseña-item card-servicio">
        <div class="servicio-info">
          <p>Servicio: ${r.servicio}</p>
          <p>⭐ ${r.puntaje}/5</p>
          <p>${r.comentario}</p>
          <p>${r.fecha ? new Date(r.fecha).toLocaleDateString() : ""}</p>
        </div>
      </li>`
      )
      .join("");
  }

  // ===============================
  // ✏️ Edición / eliminación de servicios
  // ===============================
  const listaServiciosEl = document.querySelector(".servicios-list");

  if (listaServiciosEl) {
    listaServiciosEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-editar")) {
        const d = e.target.dataset;
        document.getElementById("edit-id").value = d.id;
        document.getElementById("edit-titulo").value = d.titulo;
        document.getElementById("edit-categoria").value = d.categoria;
        document.getElementById("edit-ubicacion").value = d.ubicacion;
        document.getElementById("edit-comentario").value = d.comentario;
        modal.classList.add("show");
        modal.style.display = "flex";
      }

      if (e.target.classList.contains("btn-eliminar")) {
        const id = e.target.dataset.id;
        if (!confirm("¿Seguro que querés eliminar este servicio?")) return;

        fetch(`/api/servicios/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((out) => {
            if (out.error) {
              alert(out.error || "No se pudo eliminar el servicio.");
            } else {
              alert("🗑️ Servicio eliminado.");
              if (usuarioRol === "PRESTADOR") cargarServicios();
            }
          })
          .catch((err) => {
            console.error("❌ Error al eliminar servicio:", err);
            alert("❌ Error al conectar con el servidor.");
          });
      }
    });
  }

  formEditar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;

    const body = {
      titulo: document.getElementById("edit-titulo").value,
      categoria: document.getElementById("edit-categoria").value,
      ubicacion: document.getElementById("edit-ubicacion").value,
      comentario: document.getElementById("edit-comentario").value,
    };

    const res = await fetch(`/api/servicios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const out = await res.json();

    if (res.ok) {
      alert("✅ Servicio modificado.");
      modal.style.display = "none";
      if (usuarioRol === "PRESTADOR") cargarServicios();
    } else {
      alert(out.error || "No se pudo actualizar el servicio.");
    }
  });

  // ===============================
  // 🗂️ Tabs (sin bug)
  // ===============================
  const tabs = document.querySelectorAll(".perfil-tab");
  const contents = document.querySelectorAll(".tab-content");

  contents.forEach((c) => (c.style.display = "none"));
  document.getElementById("datos").style.display = "block";

  tabs.forEach((t) => t.classList.remove("active"));
  document.querySelector("[data-tab=\"datos\"]").classList.add("active");

  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      contents.forEach((c) => (c.style.display = "none"));
      tabs.forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).style.display = "block";

      if (tabId === "servicios" && usuarioRol === "PRESTADOR") {
        cargarServicios();
      }
      if (tabId === "turnos") {
        cargarTurnos();
      }
      if (tabId === "reseñas") {
        if (usuarioRol === "PRESTADOR") cargarResenasRecibidas();
        else cargarResenasEnviadas();
      }
    });
  });

  // ===============================
  // Cerrar modal
  // ===============================
  cerrarModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // ===============================
  // Contraseña + seguridad
  // ===============================
  const passForm = document.getElementById("password-form");
  if (passForm) {
    passForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const body = {
        id: usuario.id,
        passwordActual:
          document.getElementById("current-pass").value.trim(),
        nuevaPassword:
          document.getElementById("new-pass").value.trim(),
        confirmarPassword:
          document.getElementById("confirm-pass").value.trim(),
      };

      const res = await fetch("/api/usuarios/cambiar-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const out = await res.json();

      if (res.ok) {
        alert("✅ Contraseña cambiada.");
        passForm.reset();
      } else {
        alert(out.error || "Error al cambiar contraseña.");
      }
    });

    // 🔍 Indicador de fortaleza de contraseña
    const newPass = document.getElementById("new-pass");
    const confirmPass = document.getElementById("confirm-pass");

    if (newPass && confirmPass) {
      const reqLength  = document.getElementById("req-length");
      const reqUpper   = document.getElementById("req-upper");
      const reqLower   = document.getElementById("req-lower");
      const reqNumber  = document.getElementById("req-number");
      const reqMatch   = document.getElementById("req-match");
      const strengthBar  = document.getElementById("strength-bar");
      const strengthText = document.getElementById("strength-text");

      function actualizarFortaleza() {
        const pass    = newPass.value;
        const confirm = confirmPass.value;
        let score = 0;

        if (pass.length >= 6) {
          reqLength.classList.add("valid");
          reqLength.classList.remove("invalid");
          score++;
        } else {
          reqLength.classList.remove("valid");
          reqLength.classList.add("invalid");
        }

        if (/[A-Z]/.test(pass)) {
          reqUpper.classList.add("valid");
          reqUpper.classList.remove("invalid");
          score++;
        } else {
          reqUpper.classList.remove("valid");
          reqUpper.classList.add("invalid");
        }

        if (/[a-z]/.test(pass)) {
          reqLower.classList.add("valid");
          reqLower.classList.remove("invalid");
          score++;
        } else {
          reqLower.classList.remove("valid");
          reqLower.classList.add("invalid");
        }

        if (/\d/.test(pass)) {
          reqNumber.classList.add("valid");
          reqNumber.classList.remove("invalid");
          score++;
        } else {
          reqNumber.classList.remove("valid");
          reqNumber.classList.add("invalid");
        }

        if (pass === confirm && pass !== "") {
          reqMatch.classList.add("valid");
          reqMatch.classList.remove("invalid");
          score++;
        } else {
          reqMatch.classList.remove("valid");
          reqMatch.classList.add("invalid");
        }

        const porcentaje = (score / 5) * 100;
        strengthBar.style.width = porcentaje + "%";

        if (porcentaje < 40) {
          strengthBar.style.backgroundColor = "#f87171"; // rojo
          strengthText.textContent = "Débil";
        } else if (porcentaje < 80) {
          strengthBar.style.backgroundColor = "#facc15"; // amarillo
          strengthText.textContent = "Media";
        } else {
          strengthBar.style.backgroundColor = "#16a34a"; // verde
          strengthText.textContent = "Fuerte";
        }
      }

      newPass.addEventListener("input", actualizarFortaleza);
      confirmPass.addEventListener("input", actualizarFortaleza);
    }
  }
});
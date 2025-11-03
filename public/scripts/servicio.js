document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const servicioId = params.get("id");
  const contenedor = document.getElementById("servicio-detalle");
  const formTurno = document.getElementById("form-turno");
  const turnoSection = document.getElementById("solicitud-turno");
  const msgOK = document.getElementById("turno-ok");

  if (!servicioId) {
    contenedor.innerHTML = "<p class='muted'>⚠️ No se especificó el servicio.</p>";
    return;
  }

  // 🔹 Cargar detalle del servicio
  try {
    const res = await fetch(`/api/servicios/${servicioId}`);
    const servicio = await res.json();

    if (!res.ok || servicio.error) throw new Error(servicio.error);

    contenedor.innerHTML = `
      <div class="servicio-info">
        <img src="${servicio.imagen || "/assets/placeholder.jpg"}" alt="servicio" class="servicio-img">
        <div>
          <h1>${servicio.titulo}</h1>
          <p><strong>Categoría:</strong> ${servicio.categoria}</p>
          <p><strong>Ubicación:</strong> ${servicio.ubicacion}</p>
          <p><strong>Descripción:</strong> ${servicio.descripcion || servicio.comentario}</p>
          <hr>
          <h3>Prestador</h3>
          <p><strong>Nombre:</strong> ${servicio.usuario?.nombre || "—"}</p>
          <p><strong>Email:</strong> ${servicio.usuario?.email || "—"}</p>
          <p><strong>Teléfono:</strong> ${servicio.usuario?.telefono || "—"}</p>
          <p><strong>Localidad:</strong> ${servicio.usuario?.localidad || "—"}</p>
        </div>
      </div>
    `;

    turnoSection.style.display = "block";
  } catch (err) {
    console.error("❌ Error al cargar servicio:", err);
    contenedor.innerHTML = "<p class='muted'>⚠️ No se pudo cargar el servicio.</p>";
  }

  // 🗓️ Enviar turno
  formTurno.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("turno-nombre").value.trim();
    const email = document.getElementById("turno-email").value.trim();
    const fecha = document.getElementById("turno-fecha").value;
    const detalle = document.getElementById("turno-detalle").value.trim();

    if (!nombre || !email) {
      alert("Completá tu nombre y correo para reservar el turno.");
      return;
    }

    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, fecha, detalle, servicioId: Number(servicioId) }),
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
});

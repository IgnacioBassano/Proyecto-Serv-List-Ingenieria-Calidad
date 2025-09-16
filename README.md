# Serv-list (HTML/CSS + API mock)

Incluye todos los cambios pedidos:
- Nombre **Serv-list** más grande y llamativo (Montserrat, 1.8rem).
- **Footer centrado**.
- **Tema claro tipo crema**.
- Front conectado a **API mock** (Node + Express).

## Requisitos
- Node.js 18+

## Instalar y ejecutar
```bash
npm install
npm start
# Abrí http://localhost:3000
```

## Endpoints
- `GET /api/servicios?categoria=&ubicacion=&q=`
- `POST /api/servicios` -> { titulo, categoria, ubicacion, comentario }
- `POST /api/turnos` -> { nombre, email, fecha?, detalle? }

> Los datos viven en memoria y se reinician al parar el servidor.

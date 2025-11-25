// utils/validaciones.js

/**
 * Valida formato básico de email
 * Regla simple para pruebas unitarias
 */
function esEmailValido(email) {
  if (typeof email !== "string") return false;
  if (!email.includes("@")) return false;
  if (!email.includes(".")) return false;
  return email.length >= 6;
}

/**
 * Verifica que la password tenga longitud mínima
 * y mezcla de letras y números
 */
function esPasswordFuerte(password) {
  if (typeof password !== "string") return false;
  if (password.length < 6) return false;

  const tieneNumero = /\d/.test(password);
  const tieneLetra = /[a-zA-Z]/.test(password);

  return tieneNumero && tieneLetra;
}

module.exports = {
  esEmailValido,
  esPasswordFuerte,
};

// Texto sin espacios sobrantes; devuelve null si no es texto o está vacío
const limpiar = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

// ¿Cabe en la columna? (null es válido: significa campo opcional vacío)
const cabe = (v, max) => v === null || v.length <= max;

// Entero positivo (para ids)
const esEntero = (v) => Number.isInteger(v) && v > 0;

// Número entre 0 y el máximo que admite NUMERIC(10,2)
const esNumero = (v) => typeof v === 'number' && v >= 0 && v <= 99999999;

module.exports = { limpiar, cabe, esEntero, esNumero };
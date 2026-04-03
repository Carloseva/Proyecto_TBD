export function getImageUrl(rutaOriginal) {
  if (!rutaOriginal) return '';

  const API_BASE_URL = 'http://localhost:3000';

  let rutaLimpia = rutaOriginal.replace(/\\/g, '/');

  if (rutaLimpia.startsWith('http')) {
    return rutaLimpia;
  }
  if (rutaLimpia.startsWith('/')) {
    rutaLimpia = rutaLimpia.substring(1);
  }
  return `${API_BASE_URL}/${rutaLimpia}`;
}
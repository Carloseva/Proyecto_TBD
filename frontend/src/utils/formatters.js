export function getImageUrl(rutaOriginal) {
    if (!rutaOriginal) return '';
    const API_BASE_URL = 'http://localhost:3000';
    // Reemplaza barras invertidas de Windows por normales
    const rutaCorregida = rutaOriginal.replace(/\\/g, '/');
    return `${API_BASE_URL}/${rutaCorregida}`;
}
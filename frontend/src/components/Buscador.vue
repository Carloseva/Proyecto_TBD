<script setup>
import { ref, onMounted, computed } from 'vue'; // 1. Importamos 'computed'
import { useRouter } from 'vue-router';
import axios from 'axios';

// --- ESTADO ---
const todosLosVehiculos = ref([]); // Almacenará la lista completa de vehículos
const terminoBusqueda = ref('');    // Almacenará lo que el usuario escribe
const router = useRouter();

// --- LÓGICA DE DATOS ---
// 1. Al cargar el componente, pide TODOS los vehículos al backend
onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/vehiculos');
    todosLosVehiculos.value = response.data.reverse(); // Guardamos la lista completa (y la invertimos)
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
  }
});

// 2. LA MAGIA: El buscador (Propiedad Computada)
// Esta función se re-ejecuta automáticamente CADA VEZ que 'terminoBusqueda' cambia
const resultadosFiltrados = computed(() => {
  // Si no hay nada escrito en la barra, no muestres nada
  if (terminoBusqueda.value.trim() === '') {
    return [];
  }

  // Normalizamos el término de búsqueda:
  // lo convertimos a minúsculas y quitamos espacios
  const busqueda = terminoBusqueda.value.toLowerCase().trim();

  // Usamos .filter() para crear un nuevo array solo con las coincidencias
  return todosLosVehiculos.value.filter(vehiculo => {
    // Convertimos todos los campos a string y minúsculas para comparar
    const placa = (vehiculo.placa || '').toLowerCase();
    const marca = (vehiculo.marca || '').toLowerCase();
    const modelo = (vehiculo.modelo || '').toLowerCase();
    const color = (vehiculo.color || '').toLowerCase();
    const anio = (vehiculo.anio || '').toString();

    // Retorna 'true' si CUALQUIERA de los campos incluye el término de búsqueda
    return (
      placa.includes(busqueda) ||
      marca.includes(busqueda) ||
      modelo.includes(busqueda) ||
      color.includes(busqueda) ||
      anio.includes(busqueda)
    );
  });
});

// --- FUNCIONES AUXILIARES (Copiadas de Inventario.vue) ---
function formatFecha(timestamp) {
  if (!timestamp) return 'No registrada';
  return new Date(timestamp).toLocaleDateString('es-MX');
}

function verDetalle(id) {
  router.push({ name: 'vehiculoDetalle', params: { id } });
}
</script>

<template>
  <div class="buscador-view">
    <div class="buscador-container">
      <h1>Busca un Vehículo en el Inventario</h1>
      <p>Busca por placa, marca, modelo, color o año. Los resultados aparecen mientras escribes.</p>
      <div class="search-form">
        <input 
          type="text" 
          placeholder="Escribe la placa, marca, modelo..."
          v-model="terminoBusqueda"
          class="search-input"
        >
      </div>
    </div>

    <table v-if="resultadosFiltrados.length > 0" class="inventario-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Placa</th>
          <th>Marca</th>
          <th>Modelo</th>
          <th>Año</th>
          <th>Fecha de Ingreso</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vehiculo in resultadosFiltrados" :key="vehiculo.id" @click="verDetalle(vehiculo.id)">
          <td>
            <img 
              v-if="vehiculo.fotos && vehiculo.fotos.length > 0" 
              :src="`http://localhost:3000/${vehiculo.fotos[0]}`" 
              alt="Foto del vehículo" 
              class="vehiculo-imagen"
            >
          </td>
          <td>{{ vehiculo.placa }}</td>
          <td>{{ vehiculo.marca }}</td>
          <td>{{ vehiculo.modelo }}</td>
          <td>{{ vehiculo.anio }}</td>
          <td>{{ formatFecha(vehiculo.id) }}</td>
        </tr>
      </tbody>
    </table>
    
    <p v-if="!terminoBusqueda" class="empty-message">
      Escribe en la barra para comenzar la búsqueda.
    </p>
    <p v-if="terminoBusqueda && resultadosFiltrados.length === 0" class="empty-message">
      No se encontraron vehículos que coincidan con "{{ terminoBusqueda }}".
    </p>

  </div>
</template>

<style scoped>
/* --- Estilos para el buscador --- */
.buscador-container {
  max-width: 900px;
  margin: 0 auto 2rem auto;
  text-align: center;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}
.search-form {
  margin-top: 1.5rem;
}
.search-input {
  width: 100%;
  padding: 0.8rem 1rem;
  font-size: 1.1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

/* --- Estilos para la tabla (Copiados de Inventario.vue) --- */
.inventario-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}
th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;
}
thead { background-color: #f8f9fa; }
th { font-weight: 600; }
tbody tr:hover {
  background-color: #f1f1f1;
  cursor: pointer;
}
.vehiculo-imagen {
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}
.empty-message {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.1rem;
  color: #777;
}
</style>
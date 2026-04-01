<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const inventario = ref([]);
const router = useRouter();

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/vehiculos');
    inventario.value = response.data.reverse();
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
  }
});

// Función para formatear la fecha que viene del servidorg
function formatFecha(timestamp) {
  if (!timestamp) return 'No registrada';
  return new Date(timestamp).toLocaleDateString('es-MX');
}

function verDetalle(id){
  router.push({ name: 'vehiculoDetalle', params: { id } });
}
</script>

<template>
  <div class="inventario-view">
    <div class="header-banner">
      <h1>🚗 Inventario Actual del Corralón</h1>
      <p>Aquí puedes ver todos los vehículos actualmente bajo resguardo.</p>
    </div>

    <table class="inventario-table">
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
      <tr v-for="vehiculo in inventario" :key="vehiculo.id" @click="verDetalle(vehiculo.id)">
        
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

    <p v-if="inventario.length === 0" class="empty-message">No hay vehículos registrados en el inventario.</p>
  </div>
</template>

<style scoped>
.inventario-view {
  animation: fadeIn 0.5s ease-in-out;
}

/* --- Estilos para el nuevo banner --- */
.header-banner {
  background: linear-gradient(to right, #34495e, #2c3e50);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.header-banner h1 {
  margin: 0;
  font-size: 1.8rem;
}

.header-banner p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
}

/* --- Estilos para la tabla y la imagen --- */
.inventario-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden; /* Para que los bordes redondeados se apliquen a la tabla */
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle; /* Centra el contenido verticalmente */
}

thead {
  background-color: #f8f9fa;
}

th {
  font-weight: 600;
}

tbody tr:hover {
  background-color: #f1f1f1;
  cursor: pointer;
}

.vehiculo-imagen {
  width: 100px;
  height: 60px;
  object-fit: cover; /* Asegura que la imagen no se deforme */
  border-radius: 6px;
}

.empty-message {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.1rem;
  color: #777;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
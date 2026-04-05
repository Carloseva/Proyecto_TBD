<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const inventario = ref([]);
const router = useRouter();
const terminoBusqueda = ref('');
const mensajeSistema = ref('');

async function cargarInventario() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vehiculos`);
    inventario.value = response.data;
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
  }
}

onMounted(() => {
  cargarInventario();
});

const inventarioFiltrado = computed(() => {
  if (!terminoBusqueda.value) return inventario.value;
  
  const busqueda = terminoBusqueda.value.toLowerCase().trim();
  return inventario.value.filter(vehiculo => {
    const placa = (vehiculo.placa || '').toLowerCase();
    const marca = (vehiculo.marca || '').toLowerCase();
    const modelo = (vehiculo.modelo || '').toLowerCase();
    const color = (vehiculo.color || '').toLowerCase();
    const anio = (vehiculo.anio || '').toString();

    return (
      placa.includes(busqueda) || marca.includes(busqueda) ||
      modelo.includes(busqueda) || color.includes(busqueda) || anio.includes(busqueda)
    );
  });
});

function formatFecha(timestamp) {
  if (!timestamp) return 'No registrada';
  return new Date(timestamp).toLocaleDateString('es-MX');
}

function verDetalle(id){
  router.push({ name: 'vehiculoDetalle', params: { id }, query: { modo: 'editar' } });
}

async function eliminarVehiculo(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar este vehículo permanentemente? Esta acción no se puede deshacer.')) {
    return;
  }

  try {
    await axios.delete(`${API_BASE_URL}/api/vehiculos/${id}`);
    mensajeSistema.value = 'Vehículo eliminado correctamente.';
    cargarInventario();
    setTimeout(() => mensajeSistema.value = '', 3000);
  } catch (error) {
    alert('Error al eliminar el vehículo');
    console.error(error);
  }
}

async function limpiarRegistrosViejos() {
  if (!confirm('🧹 ¿Eliminar PERMANENTEMENTE todos los registros que fueron liberados hace más de 7 días?')) {
    return;
  }
  
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/maintenance/clean-releases`);
    mensajeSistema.value = response.data.message;
    cargarInventario();
    setTimeout(() => mensajeSistema.value = '', 5000);
  } catch (error) {
    alert('Error en mantenimiento');
  }
}

function getImageUrl(rutaOriginal) {
  if (!rutaOriginal) return '';
  const rutaCorregida = rutaOriginal.replace(/\\/g, '/');
  return `${API_BASE_URL}/${rutaCorregida}`;
}
</script>

<template>
  <div class="inventario-view">
    
    <div class="header-banner">
      <div class="banner-info">
        <h1>🚗 Inventario Actual</h1>
        <p>Administración y control de vehículos.</p>
      </div>
      
      <div class="search-bar-container">
        <input 
          type="text" 
          v-model="terminoBusqueda" 
          placeholder="Buscar por placa, marca..." 
          class="search-input"
        >
      </div>
    </div>

    <div class="admin-toolbar">
        <button @click="limpiarRegistrosViejos" class="btn-maintenance">
            🧹 Limpiar Liberados Antiguos
        </button>
        <span v-if="mensajeSistema" class="mensaje-exito">{{ mensajeSistema }}</span>
    </div>

    <table class="inventario-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Placa</th>
          <th>Marca</th>
          <th>Modelo</th>
          <th>Año</th>
          <th>Fecha</th>
          <th>Acciones</th> </tr>
      </thead>
      <tbody>
        <tr 
          v-for="vehiculo in inventarioFiltrado" 
          :key="vehiculo.id" 
          @click="verDetalle(vehiculo.id)"
        >
          <td>
            <img 
              v-if="vehiculo.fotos && vehiculo.fotos.length > 0" 
              :src="getImageUrl(vehiculo.fotos[0])" 
              class="vehiculo-imagen"
            >
          </td>
          <td>{{ vehiculo.placa }}</td>
          <td>{{ vehiculo.marca }}</td>
          <td>{{ vehiculo.modelo }}</td>
          <td>{{ vehiculo.anio }}</td>
          <td>{{ formatFecha(vehiculo.fecha_ingreso) }}</td>
          
          <td class="acciones-td">
            <button 
                class="btn-trash" 
                @click.stop="eliminarVehiculo(vehiculo.id)"
                title="Eliminar permanentemente"
            >
                🗑️
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="inventarioFiltrado.length === 0" class="empty-message">
      <span v-if="terminoBusqueda">Sin resultados para "{{ terminoBusqueda }}".</span>
      <span v-else>No hay vehículos registrados.</span>
    </p>
  </div>
</template>

<style scoped>
.inventario-view {
  animation: fadeIn 0.5s ease-in-out;
}

.header-banner {
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  color: white;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-banner h1 { margin: 0; font-size: 1.8rem; }
.header-banner p { margin: 0.5rem 0 0; opacity: 0.9; }

.search-bar-container {
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border-radius: 6px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.inventario-table {
  width: 100%;
  border-collapse: collapse;
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}
th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  vertical-align: middle;

  font-size: 1.2rem;
  font-weight: 600;
  color: #ffff;
}
thead { background: linear-gradient(to right, #2c3e50, #01655c, #2c3e50) }
th { font-weight: 600; }
tbody tr {
  transition: all 0.5s ease-in-out;
  position: relative;
}
tbody tr:hover { background: linear-gradient(to right, #2c3e50, #01655c, #2c3e50); cursor: pointer; }

.vehiculo-imagen {
  width: 160px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  display: block;
}

.admin-toolbar {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 15px;
}

.btn-maintenance {
    background: linear-gradient(to right, #f0620bff, #e1ae14ff);
    color: white; border: none;
    padding: 0.6rem 1rem; border-radius: 6px;
    cursor: pointer; font-weight: bold;
    transition: background-color 0.3s;
}
.btn-maintenance:hover { background-color: #d35400; }

.btn-trash {
    background-color: transparent;
    border: 1px solid #e74c3c;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 5px 10px;
    transition: all 0.2s;
}
.btn-trash:hover {
    background-color: #e74c3c;
    color: white;
}

.acciones-td { text-align: center; }

.mensaje-exito {
    color: #27ae60;
    font-weight: bold;
    animation: fadeIn 0.5s;
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

tbody tr:has(.btn-trash:hover) {
  background: linear-gradient(to right, #5c1818, #c0392b, #5c1818) !important;
  transform: scale(1.01);
  box-shadow: 0 0 15px rgba(192, 57, 43, 0.6);
}

tbody tr:has(.btn-trash:hover) td {
  color: #ffcccc;
  text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
}
</style>
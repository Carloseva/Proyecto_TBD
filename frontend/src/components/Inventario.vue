<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
// Importamos la utilidad que ya tienes en tu carpeta utils
import { getImageUrl } from '../utils/formatters';

const inventario = ref([]);
const router = useRouter();
const terminoBusqueda = ref('');
const mensajeSistema = ref('');

// Carga inicial de datos
async function cargarInventario() {
  try {
    const response = await axios.get('http://localhost:3000/api/vehiculos');
    inventario.value = response.data.reverse();
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
  }
}

onMounted(cargarInventario);

// Lógica de búsqueda en tiempo real
const inventarioFiltrado = computed(() => {
  if (!terminoBusqueda.value) return inventario.value;
  const busqueda = terminoBusqueda.value.toLowerCase().trim();
  return inventario.value.filter(v => 
    v.placa?.toLowerCase().includes(busqueda) || 
    v.marca?.toLowerCase().includes(busqueda) ||
    v.modelo?.toLowerCase().includes(busqueda)
  );
});

function formatFecha(timestamp) {
  if (!timestamp) return 'No registrada';
  return new Date(timestamp).toLocaleDateString('es-MX');
}

async function eliminarVehiculo(id) {
  if (!confirm('⚠️ ¿Estás seguro de eliminar este vehículo permanentemente?')) return;
  try {
    await axios.delete(`http://localhost:3000/api/vehiculos/${id}`);
    mensajeSistema.value = 'Vehículo eliminado correctamente.';
    await cargarInventario();
    setTimeout(() => mensajeSistema.value = '', 3000);
  } catch (error) {
    alert('Error al eliminar');
  }
}

async function limpiarRegistrosViejos() {
  if (!confirm('🧹 ¿Eliminar registros liberados hace más de 7 días?')) return;
  try {
    const response = await axios.delete('http://localhost:3000/api/maintenance/clean-releases');
    mensajeSistema.value = response.data.message;
    await cargarInventario();
    setTimeout(() => mensajeSistema.value = '', 5000);
  } catch (error) {
    alert('Error en mantenimiento');
  }
}

function verDetalle(id){
  router.push({ name: 'vehiculoDetalle', params: { id } });
}
</script>

<template>
  <div class="inventario-view">
    
    <div class="header-banner">
      <div class="banner-info">
        <h1>🚗 Inventario Actual</h1>
        <p>Administración y control de vehículos bajo resguardo.</p>
      </div>
      
      <div class="search-container">
        <input 
          v-model="terminoBusqueda" 
          type="text" 
          placeholder="Buscar por placa o marca..." 
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
          <th>Acciones</th>
        </tr>
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
      No se encontraron vehículos.
    </p>
  </div>
</template>

<style scoped>
.inventario-view { animation: fadeIn 0.5s ease-in-out; }

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

.search-input {
  padding: 0.6rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1);
  color: white;
  width: 250px;
}

.search-input::placeholder { color: rgba(255,255,255,0.5); }

.admin-toolbar {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 15px;
}

.btn-maintenance {
    background: linear-gradient(to right, #f0620b, #e1ae14);
    color: white; border: none;
    padding: 0.6rem 1rem; border-radius: 6px;
    cursor: pointer; font-weight: bold;
    transition: transform 0.2s;
}
.btn-maintenance:hover { transform: scale(1.02); }

.inventario-table {
  width: 100%;
  border-collapse: collapse;
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: white;
}

thead { background: linear-gradient(to right, #2c3e50, #01655c, #2c3e50); }

tbody tr:hover { 
  background: rgba(1, 101, 92, 0.4); 
  cursor: pointer; 
}

.vehiculo-imagen {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.btn-trash {
    background-color: transparent;
    border: 1px solid #e74c3c;
    border-radius: 4px;
    cursor: pointer;
    padding: 5px 10px;
    font-size: 1.1rem;
}

tbody tr:has(.btn-trash:hover) {
  background: linear-gradient(to right, #5c1818, #c0392b) !important;
}

.mensaje-exito { color: #27ae60; font-weight: bold; }

.empty-message { text-align: center; margin-top: 2rem; color: #bdc3c7; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
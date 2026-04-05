<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { getImageUrl } from '../utils/formatters';

const inventario = ref([]);
const terminoBusqueda = ref('');
const router = useRouter();

const cargarInventario = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/vehiculos');
    inventario.value = res.data.reverse();
  } catch (error) {
    console.error('Error al obtener el inventario:', error);
  }
};

onMounted(cargarInventario);

const inventarioFiltrado = computed(() => {
  if (!terminoBusqueda.value) return inventario.value;
  const q = terminoBusqueda.value.toLowerCase().trim();
  return inventario.value.filter(v => 
    v.placa?.toLowerCase().includes(q) || 
    v.marca?.toLowerCase().includes(q)
  );
});

function formatFecha(timestamp) {
  if (!timestamp) return 'No registrada';
  return new Date(timestamp).toLocaleDateString('es-MX');
}

// NUEVA FUNCIÓN: Cambiar estatus a Liberado
async function liberarVehiculo(id, estatusActual) {
  if (estatusActual === 'Liberado') {
    alert('Esta unidad ya se encuentra liberada.');
    return;
  }
  
  if (!confirm('🟢 ¿Confirmas la salida y liberación de esta unidad del corralón?')) return;

  try {
    await axios.patch(`http://localhost:3000/api/vehiculos/${id}/estatus`, { estatus: 'Liberado' });
    await cargarInventario(); // Recargamos para ver el cambio de color
  } catch (error) {
    alert('Error al liberar el vehículo');
  }
}

async function eliminarVehiculo(id) {
  if (!confirm('⚠️ ¿Estás seguro de ELIMINAR permanentemente este registro y sus fotos?')) return;
  try {
    await axios.delete(`http://localhost:3000/api/vehiculos/${id}`);
    await cargarInventario();
  } catch (error) {
    alert('Error al eliminar');
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
        <h1>🚗 Gestión de Inventario</h1>
        <p>Administración de unidades y liberación de vehículos.</p>
      </div>
      <input 
        v-model="terminoBusqueda" 
        type="text" 
        placeholder="Buscar placa o marca..." 
        class="search-input"
      >
    </div>

    <table class="inventario-table">
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Placa</th>
          <th>Marca / Modelo</th>
          <th>Fecha Ingreso</th>
          <th>Estatus</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="vehiculo in inventarioFiltrado" 
          :key="vehiculo.id" 
          @click="verDetalle(vehiculo.id)"
          :class="{ 'fila-liberada': vehiculo.estatus === 'Liberado' }"
        >
          <td>
            <img 
              v-if="vehiculo.fotos && vehiculo.fotos.length > 0" 
              :src="getImageUrl(vehiculo.fotos[0])" 
              class="vehiculo-imagen"
            >
            <div v-else class="img-placeholder">🚗</div>
          </td>
          <td class="resaltar">{{ vehiculo.placa }}</td>
          <td>{{ vehiculo.marca }} {{ vehiculo.modelo }}</td>
          <td>{{ formatFecha(vehiculo.fecha_ingreso) }}</td>
          
          <td>
            <span :class="['badge-estatus', vehiculo.estatus === 'Liberado' ? 'bg-liberado' : 'bg-ingresado']">
              {{ vehiculo.estatus || 'Ingresado' }}
            </span>
          </td>
          
          <td class="acciones-td">
            <button 
                class="btn-accion btn-check" 
                @click.stop="liberarVehiculo(vehiculo.id, vehiculo.estatus)"
                title="Liberar Unidad"
                :disabled="vehiculo.estatus === 'Liberado'"
            >
                ✅
            </button>
            <button 
                class="btn-accion btn-trash" 
                @click.stop="eliminarVehiculo(vehiculo.id)"
                title="Eliminar Registro"
            >
                🗑️
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <p v-if="inventarioFiltrado.length === 0" class="empty-message">No se encontraron resultados.</p>
  </div>
</template>

<style scoped>
.inventario-view { animation: fadeIn 0.4s; }

.header-banner {
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  color: white; padding: 1.5rem 2rem; border-radius: 8px; margin-bottom: 1.5rem;
  display: flex; justify-content: space-between; align-items: center;
}
.search-input {
  padding: 0.6rem 1rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1); color: white; width: 250px;
}

.inventario-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
thead { background: #34495e; color: white; }
tbody tr { transition: background 0.2s; cursor: pointer; }
tbody tr:hover { background: #f8f9fa; }

/* Estilo para los liberados */
.fila-liberada { opacity: 0.6; background-color: #f1f2f6; }
.fila-liberada:hover { background-color: #e2e5ec; }

.vehiculo-imagen { width: 90px; height: 60px; object-fit: cover; border-radius: 6px; }
.img-placeholder { width: 90px; height: 60px; background: #ddd; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 1.5rem; }
.resaltar { font-weight: bold; color: #2c3e50; }

.badge-estatus { padding: 0.3rem 0.6rem; border-radius: 20px; font-size: 0.85rem; font-weight: bold; color: white; }
.bg-ingresado { background: #e67e22; }
.bg-liberado { background: #27ae60; }

.acciones-td { display: flex; gap: 0.5rem; align-items: center; height: 100%; }
.btn-accion { background: transparent; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; padding: 6px; transition: 0.2s; }
.btn-check:hover:not(:disabled) { border-color: #27ae60; background: #eafaf1; }
.btn-check:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-trash:hover { border-color: #e74c3c; background: #fceae9; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
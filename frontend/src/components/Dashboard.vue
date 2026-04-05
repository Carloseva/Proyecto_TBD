<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const router = useRouter();
const stats = ref({
  totalVehiculos: 0,
  ingresosHoy: 0,
  liberadosHoy: 0
});

const inventario = ref([]);
const filtroSeleccionado = ref('Recientes');

onMounted(async () => {
  try {
    const [statsRes, inventarioRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/stats`),
      axios.get(`${API_BASE_URL}/api/vehiculos`)
    ]);

    stats.value = statsRes.data;
    inventario.value = inventarioRes.data;

  } catch (error) {
    console.error('Error al cargar los datos del dashboard:', error);
  }
});

const inventarioFiltrado = computed(() => {
    let resultado = [...inventario.value];

    if (filtroSeleccionado.value === 'Venta') {
        resultado = resultado.filter(v => v.estatus === 'Para vender');
    } else if (filtroSeleccionado.value === 'Sin especificar') {
        resultado = resultado.filter(v => v.estatus === 'Sin especificar');
    }

    if (filtroSeleccionado.value === 'Viejos') {
        resultado.reverse();
    }
    
    return resultado;
});

function verDetalle(id) {
  router.push({ name: 'vehiculoDetalle', params: { id } });
}

function getImageUrl(rutaOriginal) {
  if (!rutaOriginal) return '';
  const rutaCorregida = rutaOriginal.replace(/\\/g, '/');
  return `${API_BASE_URL}/${rutaCorregida}`;
}
</script>

<template>
  <div class="dashboard-view">
    
    <div class="header-banner">
      <h1>Dashboard: Corralón Nuevo Laredo</h1>
      <p>Resumen de la operación del día.</p>
    </div>
    
    <div class="stats-container">
      <div class="stat-card">
        <h2>{{ stats.totalVehiculos }}</h2>
        <p>Vehículos en Corralón</p>
      </div>

      <div class="stat-card green">
        <h2>{{ stats.ingresosHoy }}</h2>
        <p>Ingresados Hoy</p>
      </div>

      <div class="stat-card red">
        <h2>{{ stats.liberadosHoy }}</h2>
        <p>Liberados Hoy</p>
      </div>
    </div>

    <div class="filter-controls">
        <label for="filtro">Filtrar:</label>
        <select id="filtro" v-model="filtroSeleccionado" class="filter-select">
            <option value="Recientes">📅 Más Recientes</option>
            <option value="Viejos">⏳ Más Viejos</option>
            <option disabled>--- ESTATUS ---</option>
            <option value="Venta">💰 En Venta</option>
            <option value="Sin especificar">❓ Sin Especificar</option>
        </select>
    </div>
    
    <div class="gallery-header">
      <h2>Vehiculos en el Corralón:</h2>
      <p>Mostrando {{ inventarioFiltrado.length }} de {{ inventario.length }} vehículos</p>
    </div>

    <div class="vehiculo-grid">
      <div 
        v-for="vehiculo in inventarioFiltrado" 
        :key="vehiculo.id" 
        class="vehiculo-card" 
        @click="verDetalle(vehiculo.id)"
      >
        <img 
          v-if="vehiculo.fotos && vehiculo.fotos.length > 0" 
          :src="getImageUrl(vehiculo.fotos[0])" 
          alt="Foto del vehículo" 
          class="card-img"
        >
        <div v-else class="card-img-placeholder">
          <span>🚗</span>
          <p>Sin Foto</p>
        </div>
        
        <div class="card-banner">
          <h4>{{ vehiculo.marca }} {{ vehiculo.modelo }}</h4>
          <p>{{ vehiculo.anio }}</p>
        </div>
      </div>
    </div>
    
    <p v-if="inventarioFiltrado.length === 0" class="empty-message">Aún no hay vehículos registrados.</p>

  </div>
</template>

<style scoped>
.dashboard-view {
  margin-bottom: 0.5rem;
  animation: fadeIn 0.5s ease-in-out;
}

.header-banner {
  background: linear-gradient(to right, #2c3e50, #0a0e12);
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

.stats-container {
  display: flex;
  gap: 1.5rem;
}

.stat-card {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  flex-grow: 1;
  text-align: center;
  border-bottom: 4px solid #3498db;
}
.stat-card h2 {
  font-size: 2.5rem;
  margin: 0;
}
.stat-card p {
  margin: 0;
  color: #666;
}
.stat-card.green {
  border-color: #2ecc71;
}
.stat-card.red {
  border-color: #e74c3c;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #444;
  padding-bottom: 0.5rem;
}

.gallery-header h2 { color: #fff; margin: 0; }
.gallery-header p { color: #bdc3c7; margin: 0; }

.vehiculo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.vehiculo-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.vehiculo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
}

.card-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.card-img-placeholder {
  width: 100%;
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #34495e;
  color: #95a5a6;
}
.card-img-placeholder span { font-size: 3rem; }

.card-banner {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 60%, rgba(0, 0, 0, 0));
  color: white;
}

.card-banner h4 { margin: 0; font-size: 1.1rem; font-weight: bold; }
.card-banner p { margin: 0.25rem 0 0; font-size: 0.9rem; opacity: 0.8; }

.empty-message {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.1rem;
  color: #777;
}

.filter-controls {
  margin-top: 2rem;
  padding-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-controls label {
  color: white;
  font-weight: bold;
}

.filter-select {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: white;
  font-size: 1rem;
  cursor: pointer;
}
</style>
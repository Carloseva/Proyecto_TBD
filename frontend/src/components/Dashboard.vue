<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // <-- 1. Importamos el router
import axios from 'axios';
import { getImageUrl } from '../utils/formatters';

const router = useRouter(); // <-- 2. Lo inicializamos

// Guardará las estadísticas
const stats = ref({});

// Guardará la lista de vehículos
const inventario = ref([]); // <-- 3. Creamos el ref para el inventario

onMounted(async () => {
  try {
    const [invRes, statsRes] = await Promise.all([
      axios.get('http://localhost:3000/api/vehiculos'),
      axios.get('http://localhost:3000/api/stats')
    ]);
    inventario.value = invRes.data.reverse().slice(0, 6); // Solo los últimos 6
    stats.value = statsRes.data;
  } catch (error) {
    console.error('Error al cargar datos del dashboard', error);
  }
});

// 4. La función para navegar al detalle
function verDetalle(id) {
  router.push({ name: 'vehiculoDetalle', params: { id } });
}
</script>

<template>
  <div class="dashboard-view">
    <div class="stats-banner">
      <div class="stat-card green">
        <h3>{{ stats.total || 0 }}</h3>
        <p>Total en Resguardo</p>
      </div>
      <div class="stat-card blue">
        <h3>{{ stats.hoy || 0 }}</h3>
        <p>Ingresos de Hoy</p>
      </div>
      <div class="stat-card orange">
        <h3>{{ stats.liberados || 0 }}</h3>
        <p>Vehículos Liberados</p>
      </div>
    </div>

    <div class="section-title">
      <h2>🚗 Unidades Recientes</h2>
      <hr>
    </div>

    <div class="vehiculo-grid">
      <div 
        v-for="vehiculo in inventario" 
        :key="vehiculo.id" 
        class="vehiculo-card" 
        @click="verDetalle(vehiculo.id)"
      >
        <div class="card-image-container">
          <img 
            v-if="vehiculo.fotos && vehiculo.fotos.length > 0" 
            :src="getImageUrl(vehiculo.fotos[0])" 
            class="card-img"
          >
          <div v-else class="card-img-placeholder">
            <span>🚗</span>
            <p>Sin Foto</p>
          </div>
        </div>
        
        <div class="card-info">
          <h4>{{ vehiculo.marca }} {{ vehiculo.modelo }}</h4>
          <span class="placa-badge">{{ vehiculo.placa }}</span>
          <p class="fecha-card">{{ formatFecha(vehiculo.fecha_ingreso) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

    <div class="gallery-header">
      <h2>Recién Llegados al Corralón</h2>
      <p>Total: {{ stats.totalVehiculos }} vehículos</p>
    </div>

    <div class="vehiculo-grid">
      <div 
        v-for="vehiculo in inventario" 
        :key="vehiculo.id" 
        class="vehiculo-card" 
        @click="verDetalle(vehiculo.id)"
      >
        <img 
          v-if="vehiculo.fotos && vehiculo.fotos.length > 0" 
          :src="getImageUrl(vehiculo.fotos[0])" 
          alt="Vehículo"
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
    
    <p v-if="inventario.length === 0" class="empty-message">Aún no hay vehículos registrados.</p>

  </div>
</template>

<style scoped>
.dashboard-view {
  margin-bottom: 0.5rem;
  animation: fadeIn 0.5s ease-in-out;
}

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
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Estilos para la nueva galería --- */

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #444; /* Línea divisora */
  padding-bottom: 0.5rem;
}

.gallery-header h2 {
  color: #fff;
  margin: 0;
}

.gallery-header p {
  color: #bdc3c7;
  margin: 0;
}

.vehiculo-grid {
  display: grid;
  /* El "3 columnas" que pediste */
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.vehiculo-card {
  position: relative; /* Clave para el banner superpuesto */
  border-radius: 8px;
  overflow: hidden; /* Asegura que la imagen no se salga */
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
  object-fit: cover; /* La imagen cubre el espacio sin deformarse */
  display: block;
}

/* Estilo para cuando no hay foto */
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
.card-img-placeholder span {
  font-size: 3rem;
}

/* --- EL BANNER SUPERPUESTO --- */
.card-banner {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  box-sizing: border-box; /* Para que el padding no afecte el ancho */
  
  /* El truco del 1/4: un gradiente que se hace sólido */
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 60%, rgba(0, 0, 0, 0));
  
  color: white;
}

.card-banner h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
}

.card-banner p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.empty-message {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.1rem;
  color: #777;
}

</style>
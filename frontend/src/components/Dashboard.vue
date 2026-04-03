<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { getImageUrl } from '../utils/formatters';

const router = useRouter();
const stats = ref({ total: 0, hoy: 0, liberados: 0 });
const inventario = ref([]);

onMounted(async () => {
  try {
    const [invRes, statsRes] = await Promise.all([
      axios.get('http://localhost:3000/api/vehiculos'),
      axios.get('http://localhost:3000/api/stats')
    ]);
    inventario.value = invRes.data.reverse().slice(0, 6);
    stats.value = statsRes.data;
  } catch (error) {
    console.error('Error al cargar datos del dashboard', error);
  }
});

function verDetalle(id) {
  router.push({ name: 'vehiculoDetalle', params: { id } });
}

// Función auxiliar para fechas dentro del componente
function formatFecha(timestamp) {
  if (!timestamp) return 'Reciente';
  return new Date(timestamp).toLocaleDateString('es-MX');
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
        <p>Liberados (Mes)</p>
      </div>
    </div>

    <div class="gallery-header">
      <h2>🚗 Unidades Recién Ingresadas</h2>
      <p>Mostrando los últimos registros</p>
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
        
        <div class="card-banner">
          <h4>{{ vehiculo.marca }} {{ vehiculo.modelo }}</h4>
          <p>{{ vehiculo.anio }} • {{ vehiculo.placa }}</p>
        </div>
      </div>
    </div>

    <p v-if="inventario.length === 0" class="empty-message">No hay vehículos registrados para mostrar.</p>
  </div>
</template>

<style scoped>
.dashboard-view { animation: fadeIn 0.5s ease-in-out; padding: 1rem; }

.stats-banner {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  flex: 1;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border-bottom: 5px solid #ccc;
}
.stat-card h3 { font-size: 2.5rem; margin: 0; color: #2c3e50; }
.stat-card p { margin: 5px 0 0; color: #7f8c8d; font-weight: bold; text-transform: uppercase; font-size: 0.8rem; }

.stat-card.green { border-color: #2ecc71; }
.stat-card.blue { border-color: #3498db; }
.stat-card.orange { border-color: #e67e22; }

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid rgba(255,255,255,0.1);
  padding-bottom: 0.8rem;
}
.gallery-header h2 { color: white; margin: 0; }
.gallery-header p { color: #bdc3c7; margin: 0; }

.vehiculo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.vehiculo-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: transform 0.3s ease;
  background: #1a252f;
}

.vehiculo-card:hover { transform: translateY(-8px); }

.card-img { width: 100%; height: 230px; object-fit: cover; }

.card-img-placeholder {
  width: 100%; height: 230px;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: #2c3e50; color: #95a5a6;
}

.card-banner {
  position: absolute;
  bottom: 0; left: 0; width: 100%;
  padding: 1.2rem 1rem;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 70%, transparent);
  color: white;
}
.card-banner h4 { margin: 0; font-size: 1.1rem; }
.card-banner p { margin: 3px 0 0; font-size: 0.85rem; opacity: 0.8; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
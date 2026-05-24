<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { getImageUrl } from '../utils/formatters';

const router = useRouter();
const todosLosVehiculos = ref([]);
const terminoBusqueda = ref('');

onMounted(async () => {
  try {
    // Descargamos todo de golpe (Lógica "Lazy")
    const response = await axios.get('http://localhost:3000/api/vehiculos');
    todosLosVehiculos.value = response.data;
  } catch (error) {
    console.error('Error al precargar inventario:', error);
  }
});

// Filtro dinámico en el cliente
const resultados = computed(() => {
  if (!terminoBusqueda.value.trim()) return [];
  
  const query = terminoBusqueda.value.toLowerCase();
  return todosLosVehiculos.value.filter(v => 
    // Actualizamos a las variables de SQL Server y agregamos un fallback seguro
    (v.Placa || '').toLowerCase().includes(query) ||
    (v.Marca || '').toLowerCase().includes(query) ||
    (v.Modelo || '').toLowerCase().includes(query)
  );
});

function verDetalle(id) {
  router.push({ name: 'vehiculoDetalle', params: { id } });
}
</script>

<template>
  <div class="buscador-view">
    <div class="search-card">
      <h1>🔍 Consulta de Inventario</h1>
      <p>Introduce la placa o marca para localizar la unidad.</p>
      
      <input 
        v-model="terminoBusqueda" 
        type="text" 
        placeholder="Ej: ABC-123 o Nissan..." 
        class="main-search-input"
      >
    </div>

    <div v-if="resultados.length > 0" class="results-grid">
      <div 
        v-for="vehiculo in resultados" 
        :key="vehiculo.ID_Registro" 
        class="mini-card"
        @click="verDetalle(vehiculo.ID_Registro)"
      >
        <img v-if="vehiculo.fotos && vehiculo.fotos.length > 0" :src="getImageUrl(vehiculo.fotos[0])" alt="Auto">
        <div v-else class="img-placeholder">🚗</div>
        
        <div class="mini-info">
          <span class="placa">{{ vehiculo.Placa }}</span>
          <span class="modelo">{{ vehiculo.Marca }} {{ vehiculo.Modelo }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="terminoBusqueda" class="no-results">
      <p>No se encontraron coincidencias para "{{ terminoBusqueda }}"</p>
    </div>
  </div>
</template>

<style scoped>
.buscador-view { padding: 1rem; }

.search-card {
  background: white;
  padding: 3rem;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.search-card h1 { color: #2c3e50; margin-bottom: 0.5rem; }

.main-search-input {
  width: 100%;
  max-width: 500px;
  padding: 1rem 1.5rem;
  font-size: 1.2rem;
  border: 2px solid #eee;
  border-radius: 30px;
  outline: none;
  transition: border-color 0.3s;
}

.main-search-input:focus { border-color: #3498db; }

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.mini-card {
  background: #2c3e50;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.mini-card:hover { transform: translateY(-5px); }

.mini-card img { width: 100%; height: 120px; object-fit: cover; }

.img-placeholder {
  width: 100%;
  height: 120px;
  background-color: #34495e;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
}

.mini-info {
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  color: white;
}

.placa { font-weight: bold; color: #f39c12; }
.modelo { font-size: 0.9rem; margin-top: 4px; text-transform: capitalize; }

.no-results { text-align: center; color: #7f8c8d; margin-top: 2rem; font-size: 1.2rem; }
</style>
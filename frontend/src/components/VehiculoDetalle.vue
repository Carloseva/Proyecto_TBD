<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { getImageUrl } from '../utils/formatters';

const route = useRoute();
const router = useRouter();
const vehiculo = ref(null);
const vehiculoId = route.params.id;

onMounted(async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/vehiculos/${vehiculoId}`);
    vehiculo.value = response.data;
  } catch (error) {
    console.error('Error al cargar detalles:', error);
  }
});

function regresar() {
  router.back();
}
</script>

<template>
  <div v-if="vehiculo" class="detalle-container">
    <button @click="regresar" class="btn-regresar">
      &larr; Regresar
    </button>

    <h1>{{ vehiculo.marca }} {{ vehiculo.modelo }}</h1>
    <div class="badge-placa">Placa: {{ vehiculo.placa }}</div>

    <div class="galeria-fotos">
      <img 
        v-for="(foto, index) in vehiculo.fotos" 
        :key="index" 
        :src="getImageUrl(foto)" 
        alt="Foto del vehículo"
      >
    </div>

    <ul class="lista-info">
      <li><strong>Año:</strong> {{ vehiculo.anio }}</li>
      <li><strong>Color:</strong> {{ vehiculo.color }}</li>
      <li><strong>Estatus:</strong> <span class="status">{{ vehiculo.estatus }}</span></li>
      <li><strong>Documentación:</strong> {{ vehiculo.titulo }}</li>
      <li><strong>Motivo de Ingreso:</strong> 
        <p class="motivo-texto">{{ vehiculo.motivo }}</p>
      </li>
    </ul>
  </div>

  <div v-else class="loading">
    <p>Cargando detalles del vehículo...</p>
  </div>
</template>

<style scoped>
.detalle-container {
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  padding: 2rem;
  border-radius: 12px;
  color: white;
  min-height: 80vh;
}

.btn-regresar {
  background: #34495e;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.badge-placa {
  background-color: #f39c12;
  color: black;
  display: inline-block;
  padding: 0.2rem 0.8rem;
  border-radius: 4px;
  font-weight: bold;
  margin-bottom: 2rem;
}

.galeria-fotos {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.galeria-fotos img {
  width: 250px;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.1);
}

.lista-info {
  list-style: none;
  padding: 0;
}

.lista-info li {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.lista-info strong { color: #f39c12; }
.status { color: #2ecc71; font-weight: bold; }
.motivo-texto { color: #bdc3c7; font-size: 1rem; margin-top: 0.5rem; }
</style>
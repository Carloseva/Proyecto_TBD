<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
// 1. Importamos nuestra función universal
import { getImageUrl } from '../utils/formatters';

const route = useRoute();
const router = useRouter();

const vehiculo = ref(null);
const vehiculoId = route.params.id;

onMounted(async () => {
  try {
    // Pedimos al backend los datos (el server.js ya debe tener el JSON.parse para las fotos)
    const response = await axios.get(`http://localhost:3000/api/vehiculos/${vehiculoId}`);
    vehiculo.value = response.data;
  } catch (error) {
    console.error('Error al cargar los detalles del vehículo:', error);
  }
});

function regresar() {
  router.back();
}
</script>

<template>
  <div v-if="vehiculo" class="detalle-container">
    <button @click="regresar" class="btn-regresar">
      &larr; Regresar al Inventario
    </button>

    <h1>Detalles de: {{ vehiculo.marca }} {{ vehiculo.modelo }}</h1>
    <p class="placa-badge">Placa: {{ vehiculo.placa }}</p>

    <div class="galeria-fotos">
      <img 
        v-for="(foto, index) in vehiculo.fotos" 
        :key="index" 
        :src="getImageUrl(foto)" 
        alt="Foto del vehículo"
        class="foto-detalle"
      >
    </div>

    <div class="info-grid">
        <ul class="lista-detalles">
          <li><strong>Año:</strong> {{ vehiculo.anio }}</li>
          <li><strong>Color:</strong> {{ vehiculo.color }}</li>
          <li><strong>Estatus Actual:</strong> <span class="status-text">{{ vehiculo.estatus || 'Sin especificar' }}</span></li>
          <li><strong>Documento:</strong> {{ vehiculo.titulo }}</li>
          <li><strong>Motivo de Ingreso:</strong> {{ vehiculo.motivo }}</li>
        </ul>
    </div>
  </div>

  <div v-else class="loading-state">
    <p>Cargando información del vehículo...</p>
  </div>
</template>

<style scoped>
/* Mezcla de estilos del original y el nuevo para mejor apariencia */
.detalle-container {
  background: linear-gradient(to right, #2c3e50, #0a0e12); /* Fondo oscuro profesional */
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  color: white;
  animation: fadeIn 0.4s ease-out;
}

h1 {
  margin: 0;
  font-size: 2rem;
  color: #fff;
}

.placa-badge {
    background-color: #f39c12;
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    color: #000;
    font-weight: bold;
    margin-top: 0.5rem;
    margin-bottom: 2rem;
}

.btn-regresar {
  background: linear-gradient(to right, #5ab96a, #01655c);
  color: white;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
}

.btn-regresar:hover {
  transform: translateX(-5px);
  filter: brightness(1.2);
}

.galeria-fotos {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.foto-detalle {
  width: 280px;
  height: 200px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid rgba(255,255,255,0.1);
  transition: transform 0.3s;
}

.foto-detalle:hover {
    transform: scale(1.03);
    border-color: #5ab96a;
}

.lista-detalles {
  list-style: none;
  padding: 0;
}

.lista-detalles li {
  font-size: 1.2rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  color: #bdc3c7;
}

.lista-detalles strong {
  color: #f39c12;
  margin-right: 10px;
}

.status-text {
    color: #2ecc71;
    font-weight: bold;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Importamos los hooks del router
import axios from 'axios';

const route = useRoute(); // Contiene información de la URL actual
const router = useRouter(); // Nos permite navegar

const vehiculo = ref(null); // Aquí guardaremos los datos del vehículo
const vehiculoId = route.params.id; // Obtenemos el ID de la URL

// Esta función se ejecuta cuando el componente se carga
onMounted(async () => {
  try {
    // Pedimos al backend los datos del vehículo con este ID
    const response = await axios.get(`http://localhost:3000/api/vehiculos/${vehiculoId}`);
    vehiculo.value = response.data;
  } catch (error) {
    console.error('Error al cargar los detalles del vehículo:', error);
  }
});

// Función para el botón de "Regresar"
function regresar() {
  router.back(); // Este es el comando mágico
}
</script>

<template>
  <div v-if="vehiculo" class="detalle-container">
    <button @click="regresar" class="btn-regresar">
      &larr; Regresar
    </button>

    <h1>Detalles de: {{ vehiculo.marca }} {{ vehiculo.modelo }} ({{ vehiculo.placa }})</h1>

    <div class="galeria-fotos">
      <img 
        v-for="(foto, index) in vehiculo.fotos" 
        :key="index" 
        :src="`http://localhost:3000/${foto}`" 
        alt="Foto del vehículo"
      >
    </div>

    <ul class="lista-detalles">
      <li><strong>Año:</strong> {{ vehiculo.anio }}</li>
      <li><strong>Color:</strong> {{ vehiculo.color }}</li>
      <li><strong>Documento:</strong> {{ vehiculo.titulo }}</li>
      <li><strong>Motivo de Ingreso:</strong> {{ vehiculo.motivo }}</li>
    </ul>
  </div>

  <div v-else>
    <p>Cargando detalles del vehículo...</p>
  </div>
</template>

<style scoped>
.detalle-container {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}
.btn-regresar {
  background-color: #7f8c8d;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 1.5rem;
  transition: background-color 0.3s;
}
.btn-regresar:hover {
  background-color: #95a5a6;
}
.galeria-fotos {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1.5rem 0;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}
.galeria-fotos img {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.lista-detalles {
  list-style-type: none;
  padding: 0;
}
.lista-detalles li {
  font-size: 1.1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.lista-detalles strong {
  color: #34495e;
}
</style>
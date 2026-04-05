<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import EditarVehiculo from './EditarVehiculo.vue';
import { reactive } from 'vue';

const API_BASE_URL = 'http://localhost:3000';
const route = useRoute();
const puedeEditar = computed(() => route.query.modo === 'editar');
const router = useRouter();

const vehiculo = ref(null);
const vehiculoId = route.params.id;
const mostrarEditor = ref(false);

const isModalVisible = ref(false);
const selectedImageUrl = ref('');

const estatusOpciones = ['Sin especificar', 'Para triturar', 'Para vender', 'Liberar'];
const estatusMensaje = ref('');

const mostrarModalCita = ref(false);
const datosCita = reactive({
  nombre: '',
  rfc: '',
  licencia: '',
  correo: ''
});
const mostrarBotonCita = computed(() => {
  return !puedeEditar.value && vehiculo.value?.estatus === 'Para vender';
});

function agendarCita() {
  console.log("--- CITA AGENDADA TEMPORALMENTE ---");
  console.log(datosCita);
  alert(`Cita agendada para ${datosCita.nombre}. (Datos guardados en memoria)`);
  
  mostrarModalCita.value = false;
  Object.assign(datosCita, { nombre: '', rfc: '', licencia: '', correo: '' });
}

onMounted(async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vehiculos/${vehiculoId}`);
    vehiculo.value = response.data;
  } catch (error) {
    console.error('Error al cargar los detalles del vehículo:', error);
  }
});

function regresar() {
  router.back();
}

function openModal(imageUrl) {
  selectedImageUrl.value = imageUrl;
  isModalVisible.value = true;
}

function closeModal() {
  isModalVisible.value = false;
}

async function actualizarEstatus() {
  if (!vehiculo.value) return;

  try {
    estatusMensaje.value = 'Guardando...';
    const nuevoEstatus = vehiculo.value.estatus;

    await axios.patch(`${API_BASE_URL}/api/vehiculos/${vehiculo.value.id}/estatus`, {
      estatus: nuevoEstatus
    });

    if (nuevoEstatus === 'Liberar') {
      estatusMensaje.value = '¡Liberado! Se ocultará del inventario y se eliminará en 7 días.';
    } else {
      estatusMensaje.value = '¡Estatus actualizado!';
    }

  } catch (error) {
    estatusMensaje.value = 'Error al guardar.';
    console.error('Error actualizando estatus:', error);
  }
}

function getImageUrl(rutaOriginal) {
  if (!rutaOriginal) return '';
  const rutaCorregida = rutaOriginal.replace(/\\/g, '/');
  return `${API_BASE_URL}/${rutaCorregida}`;
}
</script>

<template>
  <div v-if="vehiculo" class="detalle-container">
    <button @click="regresar" class="btn-regresar">
      &larr; Regresar
    </button>

    <button v-if="puedeEditar" @click="mostrarEditor = !mostrarEditor" class="btn-editar">
      ✏️ Editar Vehículo
    </button>

    <button 
      v-if="mostrarBotonCita" 
      @click="mostrarModalCita = true" 
      class="btn-cita"
    >
      📅 Me interesa este auto
    </button>

    <h1>Detalles de: {{ vehiculo.marca }} {{ vehiculo.modelo }} ({{ vehiculo.placa }})</h1>

    <ul class="lista-detalles">
      </ul>

    <div v-if="puedeEditar" class="estatus-container">
      <hr>
      <h3>Cambiar Estatus del Vehículo</h3>
      <p>La selección se guarda automáticamente.</p>
      <select 
        v-model="vehiculo.estatus" 
        @change="actualizarEstatus"
        class="estatus-select"
      >
        <option 
          v-for="opcion in estatusOpciones" 
          :key="opcion" 
          :value="opcion"
        >
          {{ opcion }}
        </option>
      </select>
      <span v-if="estatusMensaje" class="estatus-feedback">{{ estatusMensaje }}</span>
    </div>

    <EditarVehiculo v-if="mostrarEditor && puedeEditar" :idVehiculo="vehiculoId" />

    <div class="galeria-fotos">
      <img 
        v-for="(foto, index) in vehiculo.fotos" 
        :key="index" 
        :src="getImageUrl(foto)" 
        alt="Foto del vehículo"
        @click="openModal(`http://localhost:3000/${foto}`)"
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

  <div 
    v-if="isModalVisible" 
    class="image-modal-overlay" 
    @click="closeModal"
  >
    <img 
      :src="selectedImageUrl" 
      alt="Vista ampliada" 
      class="image-modal-content"
      @click.stop >
  </div>

<div v-if="mostrarModalCita" class="modal-overlay">
      <div class="modal-form-card">
        <h2>Agendar Cita para Ver Auto</h2>
        <p>Por favor llene sus datos para contactarlo.</p>
        
        <form @submit.prevent="agendarCita">
          <div class="campo">
            <label>Nombre Completo:</label>
            <input type="text" v-model="datosCita.nombre" required placeholder="Ej. Juan Pérez">
          </div>
          
          <div class="campo">
            <label>RFC:</label>
            <input type="text" v-model="datosCita.rfc" required placeholder="RFC con homoclave">
          </div>

          <div class="campo">
            <label>No. de Licencia:</label>
            <input type="text" v-model="datosCita.licencia" required placeholder="Número de licencia vigente">
          </div>

          <div class="campo">
            <label>Correo Electrónico:</label>
            <input type="email" v-model="datosCita.correo" required placeholder="juan@ejemplo.com">
          </div>

          <div class="form-actions">
            <button type="button" @click="mostrarModalCita = false" class="btn-cancelar">Cancelar</button>
            <button type="submit" class="btn-confirmar">Confirmar Cita</button>
          </div>
        </form>
      </div>
    </div>

</template>

<style scoped>
.detalle-container h1 {
  color: white;
  margin-bottom: 1.5rem;
}

.detalle-container {
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}
.btn-regresar {
  background: linear-gradient(to right, #5ab96a, #01655c);
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
  color: #bdc3c7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.lista-detalles strong {
  color: #f39c12;
}

.btn-editar {
  background: linear-gradient(to right, #01655c, #5ab96a );
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 1.5rem;
  margin-left: 10px;
  transition: background-color 0.3s;
}
.btn-editar:hover {
  background-color: #42b983;
}

.galeria-fotos img {
  cursor: pointer;
  transition: transform 0.2s;
}

.galeria-fotos img:hover {
  transform: scale(1.05);
}

.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  
  background-color: rgba(0, 0, 0, 0.85);
  
  display: flex;
  justify-content: center;
  align-items: center;
  
  z-index: 1000;
  cursor: pointer;
}

.image-modal-content {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 8px;
  cursor: default;
}

.estatus-container {
  margin-top: 2rem;
  padding-top: 1rem;
}
.estatus-container h3 {
  color: #ffffffff;
}
.estatus-container p {
  color: #bdc3c7;
  font-size: 0.9rem;
}
.estatus-select {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.estatus-feedback {
  display: block;
  margin-top: 0.5rem;
  font-weight: bold;
  color: #42b983;
}

.btn-cita {
  background: linear-gradient(to right, #3498db, #1953c8ff);
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 1.5rem;
  margin-left: 10px;
  transition: background-color 0.3s;
}
.btn-cita:hover {
  background-color: #2980b9;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;
}

.modal-form-card {
  background: linear-gradient(to right, #ffffffff, #ccd8e3ff);
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.modal-form-card h2 {
  margin-top: 0;
  color: #2c3e50;
}
.modal-form-card p {
  color: #666;
  margin-bottom: 1.5rem;
}

.modal-form-card input {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 1rem;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white; border: none; padding: 0.8rem 1.2rem;
  border-radius: 4px; cursor: pointer; font-weight: bold;
}
.btn-confirmar {
  background: linear-gradient(to right, #27ae60, #217f48ff);
  color: white; border: none; padding: 0.8rem 1.2rem;
  border-radius: 4px; cursor: pointer; font-weight: bold;
}

</style>
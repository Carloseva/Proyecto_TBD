<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  idVehiculo: {
    type: [String, Number],
    required: true
  }
});

const API_BASE_URL = 'http://localhost:3000';
const vehiculo = ref(null);
const fotosNuevas = ref([]);
const mensaje = ref('');
const anioActual = new Date().getFullYear();
const opcionesTitulo = [
  'Factura Original', 'Refacturado con Copia de Origen', 'Pedimento de Importación',
  'Solo Tarjeta de Circulación', 'Sin Documentos', 'Otro'
];

onMounted(async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/vehiculos/${props.idVehiculo}`);
    vehiculo.value = response.data;
  } catch (error) {
    console.error("Error cargando datos para editar:", error);
  }
});

async function guardarCambios() {
  try {
    mensaje.value = 'Guardando...';

    const formData = new FormData();

    formData.append('placa', vehiculo.value.placa);
    formData.append('marca', vehiculo.value.marca);
    formData.append('modelo', vehiculo.value.modelo);
    formData.append('anio', vehiculo.value.anio);
    formData.append('color', vehiculo.value.color);
    formData.append('titulo', vehiculo.value.titulo);
    formData.append('motivo', vehiculo.value.motivo);

    formData.append('fotosActualesJson', JSON.stringify(vehiculo.value.fotos));

    for (const fotoObj of fotosNuevas.value) {
      formData.append('fotosNuevas', fotoObj.file);
    }

    const response = await axios.put(`${API_BASE_URL}/api/vehiculos/${props.idVehiculo}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    mensaje.value = response.data.message;
    onMounted();
    fotosNuevas.value = [];

  } catch (error) {
    console.error("Error al guardar cambios:", error);
    mensaje.value = "Error al guardar los cambios.";
  }
}

function eliminarFotoExistente(index) {
  vehiculo.value.fotos.splice(index, 1);
}

function handleFileUpload(event) {
  const archivosNuevos = event.target.files;
  if (!archivosNuevos.length) return;

  const limiteFotos = 20 - (vehiculo.value.fotos.length + fotosNuevas.value.length);
  if (limiteFotos <= 0) {
    alert('Ya has alcanzado el límite de 20 fotos.');
    return;
  }

  let archivosParaAgregar = Array.from(archivosNuevos).slice(0, limiteFotos);

  const nuevosObjetosFoto = archivosParaAgregar.map(file => ({
    file: file,
    url: URL.createObjectURL(file)
  }));

  fotosNuevas.value.push(...nuevosObjetosFoto);
  event.target.value = '';
}

function eliminarFotoNueva(index) {
  fotosNuevas.value.splice(index, 1);
}

function getImageUrl(rutaOriginal) {
  if (!rutaOriginal) return '';
  const rutaCorregida = rutaOriginal.replace(/\\/g, '/');
  return `${API_BASE_URL}/${rutaCorregida}`;
}
</script>

<template>
  <div v-if="vehiculo" class="formulario-edicion">
    <hr>
    <h2>Editar Vehículo</h2>
    <p>Ajusta la información, añade o quita fotos y haz clic en "Guardar Cambios".</p>

    <form @submit.prevent="guardarCambios">
      
      <div class="campo">
        <label>Placa:</label>
        <input type="text" v-model="vehiculo.placa">
      </div>
      <div class="campo">
        <label>Marca:</label>
        <input type="text" v-model="vehiculo.marca">
      </div>
      <div class="campo">
        <label>Modelo:</label>
        <input type="text" v-model="vehiculo.modelo">
      </div>
      <div class="campo">
        <label>Año:</label>
        <input type="number" v-model.number="vehiculo.anio" min="1980" :max="anioActual + 1">
      </div>
      <div class="campo">
        <label>Color:</label>
        <input type="text" v-model="vehiculo.color">
      </div>
      <div class="campo">
        <label>Tipo de Título/Documento:</label>
        <select v-model="vehiculo.titulo">
          <option disabled value="">-- Selecciona una opción --</option>
          <option v-for="opcion in opcionesTitulo" :key="opcion" :value="opcion">{{ opcion }}</option>
        </select>
      </div>
      <div class="campo">
        <label>Motivo de Ingreso:</label>
        <textarea rows="3" v-model="vehiculo.motivo"></textarea>
      </div>

      <div class="campo">
        <label>Fotos Actuales (Haz clic en 'X' para eliminar)</label>
        <div class="foto-preview-gallery">
          <div v-for="(foto, index) in vehiculo.fotos" :key="foto" class="foto-preview-card">
            <img :src="getImageUrl(foto)" alt="Foto existente">
            <button type="button" @click.stop="eliminarFotoExistente(index)" class="btn-eliminar-foto">&times;</button>
          </div>
        </div>
      </div>

      <div class="campo">
        <label>Añadir Fotos Nuevas (Límite 20 total)</label>
        <label for="file-upload-edit" class="input-file-trigger-edit">
          Seleccionar archivos...
        </label>
        <input 
          type="file" 
          id="file-upload-edit"
          class="input-file-hidden"
          multiple 
          accept="image/*" 
          @change="handleFileUpload"
        >
        
        <div v-if="fotosNuevas.length > 0" class="foto-preview-gallery">
          <div v-for="(foto, index) in fotosNuevas" :key="foto.url" class="foto-preview-card">
            <img :src="foto.url" alt="Vista previa">
            <button type="button" @click.stop="eliminarFotoNueva(index)" class="btn-eliminar-foto">&times;</button>
          </div>
        </div>
      </div>
      
      <button type="submit">Guardar Cambios</button>
      <p v-if="mensaje" class="mensaje-feedback">{{ mensaje }}</p>
    </form>
  </div>
</template>

<style scoped>
.formulario-edicion {
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  border-radius: 8px;
}
.formulario-edicion h2 {
  color: #fff;
}
.formulario-edicion p {
  color: #bdc3c7;
}
.campo { margin-bottom: 1rem; }
label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #fff; }
input, textarea, select {
  width: 100%; padding: 0.75rem; border: 1px solid #ccc;
  border-radius: 4px; box-sizing: border-box;
}
button {
  padding: 0.8rem; border: none; border-radius: 4px;
  background-color: #42b983; color: white; font-size: 1rem;
  font-weight: bold; cursor: pointer; transition: background-color 0.3s;
}
button:hover { background-color: #36a374; }
.mensaje-feedback { font-weight: bold; margin-top: 1rem; }

.foto-preview-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  background: linear-gradient(to right, #2c3e50, #0a0e12);
  padding: 1rem;
  border-radius: 6px;
}
.foto-preview-card {
  position: relative;
  width: 120px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.foto-preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.btn-eliminar-foto {
  position: absolute;
  top: 4px; right: 4px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white; border: none;
  display: flex; justify-content: center; align-items: center;
  font-size: 1.2rem; line-height: 1; padding: 0; padding-bottom: 2px;
  cursor: pointer; transition: background-color 0.2s;
}
.btn-eliminar-foto:hover {
  background-color: #dc3545;
}

.input-file-hidden {
  display: none;
}
.input-file-trigger-edit {
  display: block;
  width: 100%;
  padding: 0.75rem;
  border: 1px dashed #ccc;
  border-radius: 4px;
  background-color: #525f76;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
  color: white;
}
.input-file-trigger-edit:hover {
  border-color: #42b983;
  background-color: #44536d;
}

</style>
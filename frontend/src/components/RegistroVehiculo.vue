<script setup>
import { reactive, ref } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const anioActual = new Date().getFullYear();
const opcionesTitulo = [
  'Factura Original',
  'Refacturado con Copia de Origen',
  'Pedimento de Importación',
  'Solo Tarjeta de Circulación',
  'Sin Documentos',
  'Otro'
];

const vehiculo = reactive({
  placa: '',
  marca: '',
  modelo: '',
  anio: null,
  titulo: '',
  color: '',
  motivo: ''
});

const fotos = ref([]);
const fotoPrincipalPreview = ref(null);

function handleFileUpload(event) {
  const archivosNuevos = event.target.files;
  if (!archivosNuevos.length) return;

  const limiteFotos = 20;
  const espacioDisponible = limiteFotos - fotos.value.length;

  if (espacioDisponible <= 0) {
    alert('Ya has alcanzado el límite de 20 fotos.');
    event.target.value = '';
    return;
  }

  let archivosParaAgregar = Array.from(archivosNuevos);

  if (archivosNuevos.length > espacioDisponible) {
    alert(`Solo puedes agregar ${espacioDisponible} fotos más. Se agregarán las primeras ${espacioDisponible} de tu selección.`);
    archivosParaAgregar = archivosParaAgregar.slice(0, espacioDisponible);
  }

  const nuevosObjetosFoto = archivosParaAgregar.map(file => {
    return {
      file: file,
      url: URL.createObjectURL(file)
    };
  });

  fotos.value.push(...nuevosObjetosFoto);
  
  event.target.value = '';
}

function eliminarFoto(index){
  fotos.value.splice(index, 1);
}

async function registrar() {
  const formData = new FormData();

  for (const key in vehiculo) {
    formData.append(key, vehiculo[key]);
  }

  for (const fotoObj of fotos.value) {
    formData.append('fotos', fotoObj.file);
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/registrar-vehiculo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Respuesta del servidor:', response.data);
    alert('¡Vehículo registrado con éxito!');
    

  } catch (error) {
    console.error('Error al registrar el vehículo:', error);
    alert('Hubo un error al registrar el vehículo.');
  }
}

function resetForm() {
  Object.assign(vehiculo, {
    placa: '',
    marca: '',
    modelo: '',
    anio: null,
    titulo: '',
    color: '',
    motivo: ''
  });
  
  fotos.value = [];
}
</script>

<template>
  <div class="formulario-container"> 
    <button 
      type="button" 
      @click="resetForm" 
      class="btn-reset-lateral"
    >
      🔄️
    </button>

    <h2>Otro para la colección: Registra el Vehículo</h2>
    <form @submit.prevent="registrar">
      <div class="campo">
        <label for="placa">Placa:</label>
        <input type="text" id="placa" placeholder="La placa del infractor" v-model="vehiculo.placa">
      </div>

      <div class="campo">
        <label for="marca">Marca:</label>
        <input type="text" id="marca" placeholder="Ej. Nissan" v-model="vehiculo.marca">
      </div>
      
      <div class="campo">
        <label for="modelo">Modelo:</label>
        <input type="text" id="modelo" placeholder="Ej. Versa" v-model="vehiculo.modelo">
      </div>

      <div class="campo">
        <label for="anio">Año:</label>
        <input 
          type="number" 
          id="anio" 
          placeholder="Ej. 2015" 
          v-model.number="vehiculo.anio"
          min="1980"
          :max="anioActual + 1"
        >
      </div>

      <div class="campo">
        <label for="titulo">Tipo de Título/Documento:</label>
        <select id="titulo" v-model="vehiculo.titulo" class="estilo-input" required> 
          <option disabled value="">-- Selecciona una opción --</option>
          <option v-for="opcion in opcionesTitulo" :key="opcion" :value="opcion">
            {{ opcion }}
          </option>
        </select>
      </div>

      <div class="campo">
        <label for="color">Color:</label>
        <input type="text" id="color" placeholder="Ej. Rojo" v-model="vehiculo.color">
      </div>
      
      <div class="campo">
        <label for="motivo">Motivo de Ingreso:</label>
        <textarea type="text" id="motivo" rows="3" placeholder="Ej. Estacionado en lugar prohibido" v-model="vehiculo.motivo"></textarea>
      </div>

      <div class="campo">
        <label>Fotografías del Vehículo (la primera será la principal)</label>
        
        <label for="file-upload" class="input-file-trigger">
          Seleccionar Archivos...
        </label>
        
        <input 
          type="file" 
          id="file-upload"
          class="input-file-hidden"
          multiple 
          accept="image/*"
          @change="handleFileUpload"
        >
        
        <div v-if="fotos.length > 0" class="foto-preview-gallery">
          <div 
            v-for="(foto, index) in fotos" 
            :key="foto.url" 
            class="foto-preview-card"
          >
            <img :src="foto.url" alt="Vista previa">

            <button 
              type="button" 
              @click.stop="eliminarFoto(index)" 
              class="btn-eliminar-foto"
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      <button type="submit">¡Registrar y Multar!</button>
    </form>
  </div>
</template>

<style scoped>
.formulario-container {
  position: relative;
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 2px solid #ffffffff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, #2c3e50, #0a0e12);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #ffffffff;
  font-family: 'Courier New', Courier, monospace;
}

.campo {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #ffffffff;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #fff;
  transition: border-color 0.3s, box-shadow 0.3s;
}

input:focus, textarea:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
  outline: none;
}

button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  background: linear-gradient(to right, #5ab96a, #01655c);
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  text-transform: uppercase;
}

button:hover {
  background-color: #c82333;
}

.input-file-hidden {
  display: none;
}

.input-file-trigger {
  display: block;
  width: 96%;
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  background: linear-gradient(to right, #5ab96a, #01655c);
  color: white;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.input-file-trigger:hover {
  border-color: #42b983;
  background-color: #42b983;
}

.foto-preview-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
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
  top: 4px;
  right: 4px;
  
  width: 24px;
  height: 24px;
  border-radius: 50%;
  
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  
  display: flex;
  justify-content: center;
  align-items: center;
  
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  padding-bottom: 2px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-eliminar-foto:hover {
  background-color: #dc3545;
}

.btn-reset-lateral{
  position: absolute;
  top: 0;
  transform: translateX(calc(-100% - 3rem));
  width: 70px;
  height:100%;
  background-color: #01655c;
  border:none;
  border-radius: 8px;
  color: white;
  font-size: 2.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  transition: background-color 0.3s;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.btn-reset-lateral:hover {
  background-color: #c82333;
}

.estilo-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: white;
  color: #333;
  cursor: pointer;
  transition: border-color 0.3s;
}

.estilo-input:focus {
  outline: none;
  border-color: #3498db;
}

</style>
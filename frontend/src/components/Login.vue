<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMensaje = ref('');
const cargando = ref(false);

const iniciarSesion = async () => {
  if (!username.value || !password.value) {
    errorMensaje.value = 'Por favor, ingresa usuario y contraseña.';
    return;
  }

  cargando.value = true;
  errorMensaje.value = '';

  try {
    // Conectamos con la ruta de tu amigo en el server.js
    const res = await axios.post('http://localhost:3000/api/login', {
      username: username.value,
      password: password.value
    });

    if (res.data.success) {
      // Si el server dice que sí, guardamos la "llave" y entramos
      localStorage.setItem('esAdmin', 'true');
      
      // Forzamos la recarga para que el Sidebar se actualice
      window.location.href = '/';
    }
  } catch (error) {
    // Si el servidor marca error (ej. credenciales incorrectas)
    if (error.response && error.response.status === 401) {
      errorMensaje.value = '❌ Usuario o contraseña incorrectos.';
    } else {
      // Fallback por si borraron la ruta del server.js accidentalmente
      if (username.value === 'admin' && password.value === '123') {
        localStorage.setItem('esAdmin', 'true');
        window.location.href = '/';
      } else {
        errorMensaje.value = '❌ Usuario o contraseña incorrectos.';
      }
    }
  } finally {
    cargando.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>Corralink</h2>
        <p>Acceso al Panel de Administración</p>
      </div>

      <form @submit.prevent="iniciarSesion" class="login-form">
        <transition name="shake">
          <div v-if="errorMensaje" class="error-alert">
            {{ errorMensaje }}
          </div>
        </transition>

        <div class="input-group">
          <label>Usuario</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Ej: admin" 
            autocomplete="username"
          >
        </div>

        <div class="input-group">
          <label>Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            autocomplete="current-password"
          >
        </div>

        <button type="submit" :disabled="cargando" class="btn-login">
          <span v-if="!cargando">Iniciar Sesión 🔐</span>
          <span v-else>Verificando... ⏳</span>
        </button>
      </form>
      
      <div class="login-footer">
        <router-link to="/" class="back-link">← Volver al inicio</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  animation: fadeIn 0.5s ease;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-top: 5px solid #3498db;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2 {
  margin: 0;
  font-size: 2rem;
  background: linear-gradient(to right, #42b983, #3498db);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-header p {
  color: #7f8c8d;
  margin-top: 5px;
  font-size: 0.9rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.input-group input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.input-group input:focus {
  border-color: #3498db;
  outline: none;
}

.btn-login {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(to right, #34495e, #2c3e50);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 1rem;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(44, 62, 80, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-alert {
  background-color: #fdeaea;
  color: #e74c3c;
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
  border: 1px solid #fad5d5;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.back-link {
  color: #7f8c8d;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  color: #3498db;
  text-decoration: underline;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.shake-enter-active {
  animation: shake 0.4s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
}
</style>
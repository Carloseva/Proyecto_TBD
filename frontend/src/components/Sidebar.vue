<script setup>
import { ref, onMounted } from 'vue';

const esAdmin = ref(false);

onMounted(() => {
  esAdmin.value = localStorage.getItem('esAdmin') === 'true';
});

function cerrarSesion() {
  localStorage.removeItem('esAdmin');
  window.location.href = '/login'; 
}
</script>

<template>
  <aside class="sidebar">
    <h3>Corralink</h3>
    
    <nav class="navigation-menu">
      <router-link to="/" class="nav-link">
        <span class="icon">📊</span> Dashboard
      </router-link>
      
      <router-link to="/buscar" class="nav-link">
        <span class="icon">👁️‍🗨️</span> Buscar
      </router-link>

      <div v-if="esAdmin">
        <div class="divider">Administración</div>
        
        <router-link to="/registrar" class="nav-link">
          <span class="icon">➕</span> Registrar
        </router-link>
        
        <router-link to="/inventario" class="nav-link">
          <span class="icon">🚗</span> Inventario
        </router-link>
      </div>
    </nav>

    <div class="bottom-links">
      <router-link v-if="!esAdmin" to="/login" class="nav-link login-btn">
        <span class="icon">🔐</span> Iniciar Sesión
      </router-link>

      <button v-else @click="cerrarSesion" class="nav-link logout-btn">
        <span class="icon">🚪</span> Salir del Sistema
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100vh; /* Para que ocupe todo el alto */
  box-sizing: border-box;
}

.sidebar h3 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  color: #42b983;
}

.navigation-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  color: #bdc3c7;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.3s;
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  font-size: 1rem;
}

.nav-link .icon {
  margin-right: 0.8rem;
}

.nav-link:hover {
  background-color: #34495e;
  color: #ffffff;
}

.router-link-exact-active {
  background-color: #42b983;
  color: #ffffff;
  font-weight: bold;
}

.divider {
  margin: 1.5rem 0 0.5rem 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #7f8c8d;
  border-bottom: 1px solid #3e5871;
  padding-bottom: 5px;
}

.bottom-links {
  margin-top: auto; /* Empuja el botón al final */
}

.logout-btn {
  color: #e74c3c;
}

.logout-btn:hover {
  background-color: #c0392b;
  color: white;
}
</style>
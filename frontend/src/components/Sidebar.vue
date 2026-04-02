<script setup>
import { ref, onMounted } from 'vue';

const esAdmin = ref(false);

onMounted(() => {
  // Verificamos el localStorage al cargar el componente
  esAdmin.value = localStorage.getItem('esAdmin') === 'true';
});

function cerrarSesion() {
  localStorage.removeItem('esAdmin');
  window.location.href = '/login'; // Forzamos recarga para limpiar el estado
}
</script>

<template>
  <aside class="sidebar">
    <h3>Corralink</h3>
    <nav>
      <router-link to="/">📊 Dashboard</router-link>
      <router-link to="/buscar">👁️‍🗨️ Buscar</router-link>

      <div v-if="esAdmin">
        <div class="divider">Admin</div>
        <router-link to="/registrar">➕ Registrar</router-link>
        <router-link to="/inventario">🚗 Inventario</router-link>
      </div>
    </nav>

    <div class="bottom">
      <router-link v-if="!esAdmin" to="/login">🔐 Iniciar Sesión</router-link>
      <button v-else @click="cerrarSesion">🚪 Salir</button>
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
}
.sidebar h3 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
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
  transition: background-color 0.3s, color 0.3s;
}
.nav-link .icon {
  margin-right: 0.8rem;
  font-size: 1.2rem;
}
.nav-link:hover {
  background-color: #34495e;
  color: #ffffff;
}
/* Estilo para el enlace activo */
.router-link-exact-active {
  background-color: #42b983;
  color: #ffffff;
  font-weight: bold;
}
</style>
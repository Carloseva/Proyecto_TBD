<script setup>
import Sidebar from './components/Sidebar.vue';
</script>

<template>
  <div id="admin-dashboard">
    <Sidebar />

    <main class="content-area">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#admin-dashboard {
  display: flex;
  height: 100vh;
}
.content-area {
  flex-grow: 1;
  padding: 2rem;
  background-color: #1b1c1d;
  overflow-y: auto;
}
</style>

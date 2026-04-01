import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import RegistroVehiculo from '../components/RegistroVehiculo.vue'
import Inventario from '../components/Inventario.vue'
import Buscador from '../components/Buscador.vue'
import VehiculoDetalle from '../components/VehiculoDetalle.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/registrar',
      name: 'registrar',
      component: RegistroVehiculo
    },
    // Ruta de ejemplo para el futuro
    {
      path: '/inventario',
      name: 'inventario',
      // Esto es un componente de ejemplo que aún no hemos creado
      component: Inventario 
    },
    {
      path: '/buscar',
      name: 'buscar',
      component: Buscador
    },
    {
      path: '/vehiculo/:id', // El :id es un parámetro dinámico
      name: 'vehiculoDetalle',
      component: VehiculoDetalle
    }
  ]
})

export default router
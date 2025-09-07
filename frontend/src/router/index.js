import { createRouter, createWebHistory } from 'vue-router';
// import { useAuth } from '../composables/useAuth';
import Login from '../pages/Login.vue';
import ForgotPassword from '../pages/ForgotPassword.vue';
import ResetPassword from '../pages/ResetPassword.vue';
import AdminDashboard from '../pages/AdminDashboard.vue';
import InventoryOrders from '../pages/InventoryOrders.vue';
import ActivityLogs from '../pages/ActivityLogs.vue';
import ManageUsers from '../pages/ManageUsers.vue';
import POS from '../pages/POS.vue';
import KitchenOrderHistory from '../pages/KitchenOrderHistory.vue';
import OrderDemo from '../pages/OrderDemo.vue';
import KDS from '../pages/KDS.vue';
import OrderHistory from '../pages/OrderHistory.vue';
import Unauthorized from '../pages/Unauthorized.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/forgot-password', component: ForgotPassword },
  { path: '/reset-password', component: ResetPassword, meta: { requiresGuest: true } },
  { path: '/unauthorized', component: Unauthorized },
  
  // Admin routes
  { path: '/admin/dashboard', component: AdminDashboard },
  { path: '/admin/inventory-orders', component: InventoryOrders },
  { path: '/admin/activity-logs', component: ActivityLogs },
  { path: '/admin/manage-users', component: ManageUsers },
  
  // Cashier routes
  { path: '/pos', component: POS },
  { path: '/cashier/order-history', component: OrderHistory },
  
  // Kitchen routes
  { path: '/kitchen/pos', component: POS },
  { path: '/kitchen/order-history', component: KitchenOrderHistory },
  { path: '/kds', component: KDS },
  
  // Demo route (accessible to all authenticated users)
  { path: '/demo', component: OrderDemo },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Route guards
// Disabled route guards for development (no authentication)

export default router; 
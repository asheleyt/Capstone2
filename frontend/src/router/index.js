import { createRouter, createWebHistory } from 'vue-router';
import Login from '../pages/Login.vue';
import AdminDashboard from '../pages/AdminDashboard.vue';
import InventoryOrders from '../pages/InventoryOrders.vue';
import ActivityLogs from '../pages/ActivityLogs.vue';
import ManageUsers from '../pages/ManageUsers.vue';
import AdminForgotPassword from '../pages/AdminForgotPassword.vue';
import POS from '../pages/POS.vue';
import KitchenOrderHistory from '../pages/KitchenOrderHistory.vue';
import OrderDemo from '../pages/OrderDemo.vue';
import KDS from '../pages/KDS.vue';
import OrderHistory from '../pages/OrderHistory.vue';
import Unauthorized from '../pages/Unauthorized.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { requiresGuest: true } },
  { path: '/unauthorized', component: Unauthorized },

  // Admin routes
  { path: '/admin/dashboard', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/inventory-orders', component: InventoryOrders, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/activity-logs', component: ActivityLogs, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/manage-users', component: ManageUsers, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/forgot-password', component: AdminForgotPassword, meta: { requiresGuest: true } },

  // Cashier routes
  { path: '/pos', component: POS, meta: { requiresAuth: true, allowedRoles: ['Cashier', 'Admin'] } },
  { path: '/cashier/order-history', component: OrderHistory, meta: { requiresAuth: true, allowedRoles: ['Cashier', 'Admin'] } },

  // Kitchen routes
  { path: '/kitchen/pos', component: POS, meta: { requiresAuth: true, allowedRoles: ['Kitchen', 'Admin'] } },
  { path: '/kitchen/order-history', component: KitchenOrderHistory, meta: { requiresAuth: true, allowedRoles: ['Kitchen', 'Admin'] } },
  { path: '/kds', component: KDS, meta: { requiresAuth: true, allowedRoles: ['Kitchen', 'Admin'] } },

  // Demo route (accessible to all authenticated users)
  { path: '/demo', component: OrderDemo, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Route guards
router.beforeEach((to, from, next) => {
  // Get authentication state from localStorage directly to avoid reactivity issues
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  let user = null;
  
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  
  const isAuthenticated = !!(token && user);
  const isAdmin = user?.role === 'Admin';
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }
  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect authenticated users to appropriate dashboard
    if (user?.role === 'Admin') {
      next('/admin/dashboard');
    } else if (user?.role === 'Kitchen') {
      next('/kds');
    } else if (user?.role === 'Cashier') {
      next('/pos');
    } else {
      next('/');
    }
    return;
  }
  // Check if route requires admin role
  if (to.meta.requiresAdmin && !isAdmin) {
    next('/unauthorized');
    return;
  }
  // Check if route has specific role requirements
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(user?.role)) {
    next('/unauthorized');
    return;
  }
  next();
});

export default router; 
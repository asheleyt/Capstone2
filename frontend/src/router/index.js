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
import ServerTables from '../pages/ServerTables.vue';
import OrderHistory from '../pages/OrderHistory.vue';
import Unauthorized from '../pages/Unauthorized.vue';
import SuperAdminSetup from '../pages/SuperAdminSetup.vue';
import AdminSecuritySetup from '../pages/AdminSecuritySetup.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { requiresGuest: true } },
  { path: '/unauthorized', component: Unauthorized },
  { path: '/superadmin/setup', component: SuperAdminSetup, meta: { requiresAuth: true } },
  { path: '/admin/security-setup', component: AdminSecuritySetup, meta: { requiresAuth: true } },

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

  // Server routes
  { path: '/server/tables', component: ServerTables, meta: { requiresAuth: true, allowedRoles: ['Server', 'Admin'] } },

  // Demo route (accessible to all authenticated users)
  { path: '/demo', component: OrderDemo, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Route guards
router.beforeEach((to, from, next) => {
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
  const isAdminOrSuper = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdminOnly = user?.role === 'Admin';
  const securitySetupComplete = user?.security_setup_complete === true;
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    if (user?.role === 'Admin') {
      next(securitySetupComplete ? '/admin/dashboard' : '/admin/security-setup');
    } else if (user?.role === 'SuperAdmin') {
      next(securitySetupComplete ? '/admin/dashboard' : '/superadmin/setup');
    } else if (user?.role === 'Kitchen') {
      next('/kds');
    } else if (user?.role === 'Cashier') {
      next('/pos');
    } else if (user?.role === 'Server') {
      next('/server/tables');
    } else {
      next('/');
    }
    return;
  }

  if (to.path === '/admin/security-setup' && isAuthenticated && !isAdminOnly) {
    next('/unauthorized');
    return;
  }

  if (to.meta.requiresAdmin && !isAdminOrSuper) {
    next('/unauthorized');
    return;
  }

  if (isAuthenticated && isSuperAdmin && !securitySetupComplete &&
      to.path !== '/superadmin/setup' &&
      to.path !== '/login' &&
      !to.path.startsWith('/unauthorized')) {
    next('/superadmin/setup');
    return;
  }

  if (isAuthenticated && isAdminOnly && !securitySetupComplete &&
      to.path !== '/admin/security-setup' &&
      to.path !== '/login' &&
      !to.path.startsWith('/unauthorized')) {
    next('/admin/security-setup');
    return;
  }

  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(user?.role)) {
    next('/unauthorized');
    return;
  }

  next();
});

export default router; 

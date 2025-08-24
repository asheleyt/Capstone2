import Login from '../pages/Login.vue';
import AdminDashboard from '../pages/AdminDashboard.vue';
import InventoryOrders from '../pages/InventoryOrders.vue';
import ManageUsers from '../pages/ManageUsers.vue';
import POS from '../pages/POS.vue';
import KitchenOrderHistory from '../pages/KitchenOrderHistory.vue';
import OrderDemo from '../pages/OrderDemo.vue';
import KDS from '../pages/KDS.vue';
import OrderHistory from '../pages/OrderHistory.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/admin/dashboard', component: AdminDashboard },
  { path: '/admin/inventory-orders', component: InventoryOrders },
  { path: '/admin/manage-users', component: ManageUsers },
  { path: '/pos', component: POS },
  { path: '/kitchen/pos', component: POS },
  { path: '/kitchen/order-history', component: KitchenOrderHistory },
  { path: '/demo', component: OrderDemo },
  { path: '/kds', component: KDS },
  { path: '/cashier/order-history', component: OrderHistory },
];

export default routes; 
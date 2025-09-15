<template>
  <nav class="flex items-center justify-between bg-white px-6 py-3 shadow-sm border-b">
    <div class="flex items-center">
      <span class="w-8 h-8 bg-gray-200 rounded-full mr-3"></span>
      <span class="text-xl font-bold">Admin</span>
    </div>
    <div class="flex items-center space-x-6">
      <a @click.prevent="goToDashboard" class="text-gray-700 hover:underline cursor-pointer">Dashboard</a>
      <a @click.prevent="$emit('show-calendar')" class="text-gray-700 hover:underline cursor-pointer">Calendar</a>
      <a @click.prevent="goToInventoryOrders" class="text-gray-700 hover:underline cursor-pointer">Inventory Management/Order History</a>
      <a @click.prevent="downloadSalesReport" class="text-gray-700 hover:underline cursor-pointer">Download Excel</a>
      <a @click.prevent="goToActivityLogs" class="text-gray-700 hover:underline cursor-pointer">Activity Logs</a>
      <a @click.prevent="goToManageUsers" class="text-gray-700 hover:underline cursor-pointer">Manage users</a>
      <button @click="handleLogout" class="text-red-500 hover:underline px-4 py-2 bg-black text-white rounded font-bold" style="color: #FFFFFF !important;">Logout</button>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
const router = useRouter();
const { logout } = useAuth();

function goToDashboard() {
  router.push('/admin/dashboard');
}
function goToInventoryOrders() {
  router.push('/admin/inventory-orders');
}
function goToActivityLogs() {
  router.push('/admin/activity-logs');
}
function goToManageUsers() {
  router.push('/admin/manage-users');
}
async function handleLogout() {
  await logout();
}
function downloadSalesReport() {
  // Emit event so parent can handle download logic
}
</script>

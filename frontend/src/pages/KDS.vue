<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
      <div class="flex items-center space-x-2">
        <span class="w-5 h-5 bg-gray-300 rounded-full inline-block"></span>
        <span class="text-xl font-bold text-gray-800">Kitchen</span>
      </div>
      <button @click="handleLogout" class="btn btn-error">Logout</button>
    </header>

    <!-- Main Content -->
    <main class="flex-1 px-8 py-4">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">Current Orders</h1>
      <div class="grid grid-cols-3 gap-6">
        <div v-for="order in orders" :key="order.id" class="border rounded-lg p-4 bg-white shadow-sm flex flex-col">
          <div class="font-semibold mb-2 text-gray-800">
            Order #{{ order.number }}
            <span v-if="order.table" class="ml-2 text-xs text-blue-600">Table: {{ order.table }}</span>
          </div>
          <div class="flex text-xs font-semibold mb-1 text-gray-800">
            <div class="w-1/2">Product</div>
            <div class="w-1/4">Qty</div>
            <div class="w-1/4">Notes</div>
          </div>
          <div v-for="item in order.items" :key="item.id" class="flex text-xs mb-1 text-gray-800">
            <div class="w-1/2">{{ item.name }}</div>
            <div class="w-1/4">{{ item.qty }}</div>
            <div class="w-1/4">{{ item.notes }}</div>
          </div>
          <div v-if="order.notes" class="text-xs text-gray-500 mt-1">Order Notes: {{ order.notes }}</div>
          <div class="flex-1"></div>
          <div class="mt-2 flex items-center space-x-2">
            <span class="text-sm font-semibold text-gray-800">{{ order.status }}</span>
            <button v-if="order.status === 'Idle'" @click="setStatus(order, 'Cooking')" class="btn btn-outline btn-sm">Cooking</button>
            <button v-if="order.status === 'Cooking'" @click="setStatus(order, 'Ready')" class="btn btn-primary btn-sm">Ready</button>
            <button v-if="order.status === 'Cooking'" disabled class="btn btn-outline btn-sm">Cooking</button>
            <button v-if="order.status === 'Ready'" disabled class="btn btn-primary btn-sm">Ready</button>
          </div>
        </div>
      </div>
    </main>
    <!-- Notification area (to be added later) -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { io } from 'socket.io-client';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { getAuthHeaders } = useAuth();
const orders = ref([]);
const socket = io('http://localhost:5000');

async function fetchOrders() {
  const res = await fetch('http://localhost:5000/api/orders/status/pending', {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  orders.value = data.map(order => ({
    id: order.id,
    number: order.order_number,
    table: order.table_number,
    status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
    notes: order.notes,
    items: order.items.map(item => ({
      id: item.product_id,
      name: item.product_name,
      qty: item.quantity,
      notes: '' // If you want to support per-item notes, update here
    }))
  }));
}

onMounted(() => {
  fetchOrders();
  socket.on('newOrder', (order) => {
    if (order.status === 'pending') {
      orders.value.unshift({
        id: order.id,
        number: order.order_number,
        table: order.table_number,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        notes: order.notes,
        items: order.items.map(item => ({
          id: item.product_id,
          name: item.product_name,
          qty: item.quantity,
          notes: ''
        }))
      });
    }
  });
});

function setStatus(order, newStatus) {
  // Optionally, send status update to backend here
  order.status = newStatus;
}

async function handleLogout() {
  const { logout } = useAuth();
  await logout();
}
</script> 
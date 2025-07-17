<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
      <div class="flex items-center space-x-2">
        <span class="w-5 h-5 bg-gray-300 rounded-full inline-block"></span>
        <span class="text-xl font-bold">Kitchen</span>
      </div>
      <button @click="handleLogout" class="btn btn-error">Logout</button>
    </header>

    <!-- Main Content -->
    <main class="flex-1 px-8 py-4">
      <h1 class="text-3xl font-bold mb-6">Current Orders</h1>
      <div class="grid grid-cols-3 gap-6">
        <div v-for="order in orders" :key="order.id" class="border rounded-lg p-4 bg-white shadow-sm flex flex-col">
          <div class="font-semibold mb-2">Order #{{ order.number }} + {{ order.customer }}</div>
          <div class="flex text-xs font-semibold mb-1">
            <div class="w-1/2">Product</div>
            <div class="w-1/4">Qty</div>
            <div class="w-1/4">Notes</div>
          </div>
          <div v-for="item in order.items" :key="item.id" class="flex text-xs mb-1">
            <div class="w-1/2">{{ item.name }}</div>
            <div class="w-1/4">{{ item.qty }}</div>
            <div class="w-1/4">{{ item.notes }}</div>
          </div>
          <div class="flex-1"></div>
          <div class="mt-2 flex items-center space-x-2">
            <span class="text-sm font-semibold">{{ order.status }}</span>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const orders = ref([
  {
    id: 1,
    number: '1001',
    customer: 'John Doe',
    status: 'Idle',
    items: [
      { id: 1, name: 'Burger', qty: 2, notes: '' },
      { id: 2, name: 'Fries', qty: 1, notes: 'No salt' },
    ],
  },
  {
    id: 2,
    number: '1002',
    customer: 'Jane Smith',
    status: 'Cooking',
    items: [
      { id: 1, name: 'Pizza', qty: 1, notes: 'Extra cheese' },
    ],
  },
  {
    id: 3,
    number: '1003',
    customer: 'Bob Lee',
    status: 'Idle',
    items: [
      { id: 1, name: 'Pasta', qty: 3, notes: '' },
    ],
  },
  {
    id: 4,
    number: '1004',
    customer: 'Alice',
    status: 'Ready',
    items: [
      { id: 1, name: 'Salad', qty: 2, notes: '' },
    ],
  },
  {
    id: 5,
    number: '1005',
    customer: 'Eve',
    status: 'Idle',
    items: [
      { id: 1, name: 'Soup', qty: 1, notes: 'Hot' },
    ],
  },
  {
    id: 6,
    number: '1006',
    customer: 'Sam',
    status: 'Idle',
    items: [
      { id: 1, name: 'Steak', qty: 1, notes: '' },
    ],
  },
]);

function setStatus(order, newStatus) {
  order.status = newStatus;
}

function handleLogout() {
  localStorage.removeItem('user');
  router.push('/login');
}
</script> 
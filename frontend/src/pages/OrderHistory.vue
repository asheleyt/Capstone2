<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">Order History</h1>
    <div class="bg-white rounded-lg shadow p-6">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="px-4 py-2 text-left">Order #</th>
            <th class="px-4 py-2 text-left">Date</th>
            <th class="px-4 py-2 text-left">Table</th>
            <th class="px-4 py-2 text-left">Type</th>
            <th class="px-4 py-2 text-left">Total</th>
            <th class="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b hover:bg-gray-50">
            <td class="px-4 py-2">{{ order.order_number }}</td>
            <td class="px-4 py-2">{{ order.created_at ? order.created_at.split('T')[0] : '' }}</td>
            <td class="px-4 py-2">{{ order.table_number }}</td>
            <td class="px-4 py-2">{{ order.order_type }}</td>
            <td class="px-4 py-2">₱{{ order.total }}</td>
            <td class="px-4 py-2">{{ order.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const orders = ref([]);

async function fetchOrders() {
  const res = await fetch('http://localhost:5000/api/orders');
  orders.value = await res.json();
}

onMounted(fetchOrders);
</script>

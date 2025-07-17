<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
      <div class="flex items-center">
        <span class="w-8 h-8 bg-gray-200 rounded-full mr-3"></span>
        <span class="text-xl font-semibold">Kitchen Staff</span>
      </div>
      <div class="flex-1 flex justify-end items-center">
        <div class="flex items-center space-x-6">
          <a @click.prevent="goToPOS" class="text-gray-700 hover:underline cursor-pointer">POS System</a>
          <span class="text-gray-700 font-semibold">Order History</span>
          <button @click="handleLogout" class="text-red-500 hover:underline px-4 py-2 bg-black text-white rounded font-bold">Logout</button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Order History</h1>
        <div class="flex space-x-2">
          <select v-model="selectedDate" class="border rounded px-3 py-2">
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button @click="exportOrders" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Export
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-600">Total Orders</div>
          <div class="text-2xl font-bold">{{ totalOrders }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-600">Completed</div>
          <div class="text-2xl font-bold text-green-600">{{ completedOrdersCount }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-600">Average Time</div>
          <div class="text-2xl font-bold">{{ averageTime }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-600">Total Revenue</div>
          <div class="text-2xl font-bold">₱{{ totalRevenueFormatted }}</div>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h2 class="text-xl font-semibold">Completed Orders</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ order.number }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ order.time }}</div>
                  <div class="text-sm text-gray-500">{{ order.date }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ order.table }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">
                    <div v-for="item in order.items.slice(0, 2)" :key="item.id">
                      {{ item.quantity }}x {{ item.name }}
                    </div>
                    <div v-if="order.items.length > 2" class="text-gray-500">
                      +{{ order.items.length - 2 }} more items
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">₱{{ order.total }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['px-2 py-1 text-xs font-semibold rounded-full', getStatusClass(order.status)]">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="viewOrderDetails(order)" class="text-blue-600 hover:text-blue-900 mr-3">
                    View Details
                  </button>
                  <button @click="reprintOrder(order)" class="text-gray-600 hover:text-gray-900">
                    Reprint
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-6">
        <div class="text-sm text-gray-700">
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredOrders.length }} results
        </div>
        <div class="flex space-x-2">
          <button @click="previousPage" :disabled="currentPage === 1" 
                  class="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button @click="nextPage" :disabled="currentPage >= totalPages" 
                  class="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="showOrderModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Order #{{ selectedOrder?.number }} Details</h3>
          <button @click="showOrderModal = false" class="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div v-if="selectedOrder" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <strong>Time:</strong> {{ selectedOrder.time }}
            </div>
            <div>
              <strong>Table:</strong> {{ selectedOrder.table }}
            </div>
            <div>
              <strong>Status:</strong> {{ selectedOrder.status }}
            </div>
            <div>
              <strong>Total:</strong> ₱{{ selectedOrder.total }}
            </div>
          </div>
          <div>
            <strong>Items:</strong>
            <div class="mt-2 space-y-1">
              <div v-for="item in selectedOrder.items" :key="item.id" class="flex justify-between">
                <span>{{ item.quantity }}x {{ item.name }}</span>
                <span>₱{{ item.price * item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOrders } from '../composables/useOrders';

const router = useRouter();
const { completedOrders, totalRevenue, getOrdersByDate } = useOrders();

const selectedDate = ref('today');
const showOrderModal = ref(false);
const selectedOrder = ref(null);
const currentPage = ref(1);
const itemsPerPage = 10;

// Computed properties
const filteredOrders = computed(() => {
  if (selectedDate.value === 'today') {
    const today = new Date().toISOString().split('T')[0];
    return getOrdersByDate(today);
  } else if (selectedDate.value === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getOrdersByDate(yesterday.toISOString().split('T')[0]);
  } else {
    return completedOrders.value;
  }
});

const totalOrders = computed(() => filteredOrders.value.length);
const completedOrdersCount = computed(() => filteredOrders.value.filter(order => order.status === 'Completed').length);
const averageTime = computed(() => '15 min');
const totalRevenueFormatted = computed(() => {
  return filteredOrders.value.reduce((sum, order) => sum + order.total, 0).toLocaleString();
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage, filteredOrders.value.length));

// Functions
function getStatusClass(status) {
  switch (status) {
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function viewOrderDetails(order) {
  selectedOrder.value = order;
  showOrderModal.value = true;
}

function reprintOrder(order) {
  console.log('Reprinting order:', order.number);
  // Implement print functionality
}

function exportOrders() {
  console.log('Exporting orders...');
  // Implement export functionality
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function goToPOS() {
  router.push('/kitchen/pos');
}

function handleLogout() {
  localStorage.removeItem('user');
  router.push('/login');
}
</script> 
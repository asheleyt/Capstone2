<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Order History</h1>
      <button @click="goBack" class="btn btn-outline">← Back to POS</button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="loading loading-spinner loading-lg"></div>
        <p class="mt-4 text-gray-600">Loading orders...</p>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-red-500 text-xl mb-2">⚠️</div>
      <p class="text-red-600">{{ error }}</p>
      <button @click="fetchOrders" class="btn btn-primary mt-4">Retry</button>
    </div>
    
    <!-- Orders List -->
    <div v-else-if="orders.length > 0" class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="bg-white rounded-lg shadow p-6">
        <!-- Order Header -->
        <div class="flex items-center justify-between mb-4 pb-4 border-b">
          <div class="flex items-center space-x-4">
            <div>
              <h3 class="text-lg font-bold text-gray-800">Order #{{ order.order_number }}</h3>
              <p class="text-sm text-gray-600">{{ formatDate(order.created_at) }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span :class="getStatusBadgeClass(order.status)" class="px-2 py-1 rounded-full text-xs font-semibold">
                {{ order.status.toUpperCase() }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-gray-800">₱{{ parseFloat(order.total).toFixed(2) }}</p>
            <p class="text-sm text-gray-600">{{ order.payment_method }}</p>
          </div>
        </div>
        
        <!-- Order Details -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p class="text-sm font-semibold text-gray-700">Table</p>
            <p class="text-gray-600">{{ order.table_number || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-700">Type</p>
            <p class="text-gray-600">{{ order.order_type || 'dine-in' }}</p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-700">Payment</p>
            <p class="text-gray-600">{{ order.payment_method || 'Cash' }}</p>
          </div>
        </div>
        
        <!-- Order Items -->
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Items</h4>
          <div class="space-y-2">
            <div v-for="item in order.items" :key="item.id" class="flex items-center justify-between bg-gray-50 rounded p-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-xs font-bold">{{ item.quantity }}</span>
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ item.product_name }}</p>
                  <p class="text-sm text-gray-600">₱{{ parseFloat(item.unit_price).toFixed(2) }} each</p>
                </div>
              </div>
              <p class="font-bold text-gray-800">₱{{ parseFloat(item.total_price).toFixed(2) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Order Notes -->
        <div v-if="order.notes" class="mb-4">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
          <p class="text-gray-600 bg-gray-50 rounded p-3">{{ order.notes }}</p>
        </div>
        
        <!-- Order Summary -->
        <div class="bg-gray-100 rounded p-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-700">Subtotal</span>
            <span class="text-gray-800">₱{{ parseFloat(order.subtotal).toFixed(2) }}</span>
          </div>
          <div v-if="order.discount > 0" class="flex justify-between text-sm mb-1">
            <span class="text-gray-700">Discount</span>
            <span class="text-gray-800">-₱{{ parseFloat(order.discount).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span class="text-gray-800">Total</span>
            <span class="text-gray-800">₱{{ parseFloat(order.total).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Orders State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <div class="text-gray-400 text-4xl mb-4">📋</div>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">No Orders Found</h3>
      <p class="text-gray-600">No orders have been placed yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrders } from '../composables/useOrders';

const router = useRouter();
const { orders, loading, error, fetchOrders } = useOrders();

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusBadgeClass(status) {
  const statusClasses = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'preparing': 'bg-blue-100 text-blue-800',
    'ready': 'bg-green-100 text-green-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

function goBack() {
  router.push('/pos');
}

onMounted(fetchOrders);
</script>

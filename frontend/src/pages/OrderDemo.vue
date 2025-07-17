<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Order Demo - Test Synchronization</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Add New Order -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Add New Order</h2>
          <form @submit.prevent="handleAddNewOrder" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Table</label>
              <select v-model="newOrder.table" class="select select-bordered w-full">
                <option value="Table 1">Table 1</option>
                <option value="Table 2">Table 2</option>
                <option value="Table 3">Table 3</option>
                <option value="Table 4">Table 4</option>
                <option value="Table 5">Table 5</option>
                <option value="Table 6">Table 6</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Items</label>
              <div class="space-y-2">
                <div v-for="(item, index) in newOrder.items" :key="index" class="flex gap-2">
                  <input v-model="item.name" placeholder="Item name" class="input input-bordered flex-1">
                  <input v-model.number="item.quantity" type="number" placeholder="Qty" class="input input-bordered w-20">
                  <input v-model.number="item.price" type="number" placeholder="Price" class="input input-bordered w-24">
                  <button @click="removeItem(index)" type="button" class="btn btn-error btn-sm">×</button>
                </div>
              </div>
              <button @click="addItem" type="button" class="btn btn-outline btn-primary mt-2">
                Add Item
              </button>
            </div>
            
            <div class="text-lg font-semibold">
              Total: ₱{{ calculateTotal }}
            </div>
            
            <button type="submit" class="btn btn-success w-full">
              Add Order
            </button>
          </form>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
          <div class="space-y-3">
            <button @click="simulateRandomOrder" class="btn btn-primary w-full">
              Simulate Random Order
            </button>
            <button @click="completeAllReadyOrders" class="btn btn-warning w-full">
              Complete All Ready Orders
            </button>
            <button @click="clearAllOrders" class="btn btn-error w-full">
              Clear All Orders
            </button>
          </div>
          
          <div class="mt-6 p-4 bg-gray-100 rounded">
            <h3 class="font-semibold mb-2">Current Stats</h3>
            <div class="space-y-1 text-sm">
              <div>Total Orders: {{ allOrders.length }}</div>
              <div>Current Orders: {{ currentOrders.length }}</div>
              <div>Pending: {{ pendingOrders.length }}</div>
              <div>Preparing: {{ preparingOrders.length }}</div>
              <div>Ready: {{ readyOrders.length }}</div>
              <div>Total Revenue: ₱{{ totalRevenue.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Orders -->
      <div class="mt-8 bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Current Orders (POS View)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="order in currentOrders" :key="order.id" 
               :class="['border rounded-lg p-4', getOrderStatusClass(order.status)]">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold">Order #{{ order.number }}</h3>
              <span :class="['px-2 py-1 rounded text-xs font-semibold', getStatusBadgeClass(order.status)]">
                {{ order.status }}
              </span>
            </div>
            <div class="text-sm text-gray-600 mb-2">
              {{ order.time }} | {{ order.table }}
            </div>
            <div class="text-sm mb-2">
              <div v-for="item in order.items.slice(0, 2)" :key="item.id">
                {{ item.quantity }}x {{ item.name }}
              </div>
              <div v-if="order.items.length > 2" class="text-gray-500">
                +{{ order.items.length - 2 }} more items
              </div>
            </div>
            <div class="font-bold">₱{{ order.total }}</div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="mt-8 flex gap-4">
        <a href="/kitchen/pos" class="btn btn-primary">
          View POS System
        </a>
        <a href="/kitchen/order-history" class="btn btn-success">
          View Kitchen Order History
        </a>
        <a href="/admin/inventory-orders" class="btn btn-secondary">
          View Admin Order History
        </a>
        <a href="/admin/dashboard" class="btn btn-neutral">
          View Admin Dashboard
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrders } from '../composables/useOrders';

const { 
  currentOrders, 
  allOrders, 
  pendingOrders, 
  preparingOrders, 
  readyOrders, 
  totalRevenue,
  addNewOrder, 
  updateOrderStatus, 
  simulateNewOrder 
} = useOrders();

const newOrder = ref({
  table: 'Table 1',
  items: [
    { name: '', quantity: 1, price: 0 }
  ]
});

const calculateTotal = computed(() => {
  return newOrder.value.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);
});

function addItem() {
  newOrder.value.items.push({ name: '', quantity: 1, price: 0 });
}

function removeItem(index) {
  if (newOrder.value.items.length > 1) {
    newOrder.value.items.splice(index, 1);
  }
}

function handleAddNewOrder() {
  const orderData = {
    table: newOrder.value.table,
    total: calculateTotal.value,
    items: newOrder.value.items.filter(item => item.name && item.quantity > 0 && item.price > 0)
  };
  
  if (orderData.items.length > 0) {
    addNewOrder(orderData);
    // Reset form
    newOrder.value = {
      table: 'Table 1',
      items: [{ name: '', quantity: 1, price: 0 }]
    };
  }
}

function simulateRandomOrder() {
  simulateNewOrder();
}

function completeAllReadyOrders() {
  readyOrders.value.forEach(order => {
    updateOrderStatus(order.id, 'Completed');
  });
}

function clearAllOrders() {
  // This would need to be implemented in the composable
  console.log('Clear all orders functionality would go here');
}

function getOrderStatusClass(status) {
  switch (status) {
    case 'Pending': return 'border-yellow-300 bg-yellow-50';
    case 'Preparing': return 'border-blue-300 bg-blue-50';
    case 'Ready': return 'border-green-300 bg-green-50';
    default: return 'border-gray-300 bg-white';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Pending': return 'bg-yellow-500 text-white';
    case 'Preparing': return 'bg-blue-500 text-white';
    case 'Ready': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}
</script> 
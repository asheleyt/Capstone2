<template>
  <div>
    
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <nav class="flex items-center justify-between bg-white px-6 py-3 shadow-sm border-b">
        <div class="flex items-center">
          <span class="w-8 h-8 bg-gray-200 rounded-full mr-3"></span>
          <span class="text-xl font-bold">Admin</span>
        </div>
        <div class="flex items-center space-x-6">
          
          <a @click.prevent="showCalendar = true" class="text-gray-700 hover:underline cursor-pointer">Calendar</a>
          <a @click.prevent="goToInventoryOrders" class="text-gray-700 hover:underline cursor-pointer">Inventory Management/Order History</a>
          <a @click.prevent="downloadSalesReport" class="text-gray-700 hover:underline cursor-pointer">Download Excel</a>
          <a @click.prevent="goToManageUsers" class="text-gray-700 hover:underline cursor-pointer">Manage users</a>
          <button @click="handleLogout" class="btn btn-error px-4 py-2 font-bold">Logout</button>
        </div>
      </nav>

      <!-- Calendar Popup -->
      <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" @click.self="showCalendar = false">
        <div class="relative">
          <button class="absolute top-2 right-2 text-gray-300 hover:text-white z-10" @click="showCalendar = false">&times;</button>
          <CalendarPopup />
        </div>
      </div>

      <!-- Main Content -->
      <div class="p-6 grid grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="flex flex-col gap-6">
          <!-- Sales Overview -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-2xl font-bold text-left">Sales Overview</h2>
              <div class="space-x-2">
                <button v-for="type in ['Daily', 'Weekly', 'Monthly']" :key="type" @click="selectedType = type" :class="[selectedType === type ? 'btn btn-primary' : 'btn btn-outline', 'px-3 py-1 rounded border']">{{ type }}</button>
              </div>
            </div>
            <div class="h-56">
              <line-chart :chart-data="chartData" />
            </div>
          </div>
          <!-- Top Selling Items -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <h2 class="text-xl font-bold mb-2 text-left">Top Selling items</h2>
            <table class="w-full text-left border-t border-b">
              <tbody>
                <tr v-for="item in topSelling" :key="item.name" class="border-b last:border-b-0">
                  <td class="py-1 font-semibold">{{ item.name }}</td>
                  <td class="py-1 text-right font-semibold">{{ item.sold }} sold</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Right Column -->
        <div class="flex flex-col gap-6">
          <!-- Today's Sale Summary -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <h2 class="text-2xl font-bold mb-2 text-left">Today's Sale Summary</h2>
            <table class="w-full text-sm mb-2 border-t border-b">
              <thead>
                <tr class="border-b">
                  <th class="font-bold text-left">Item</th>
                  <th class="font-bold text-left">Qty</th>
                  <th class="font-bold text-left">Price</th>
                  <th class="font-bold text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in saleSummary" :key="row.item" class="border-b last:border-b-0">
                  <td>{{ row.item }}</td>
                  <td>{{ row.qty }}</td>
                  <td>₱{{ row.price }}</td>
                  <td>₱{{ row.total }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-between text-xs mt-2 gap-2">
              <div class="bg-gray-100 rounded p-2 flex-1 border">Cash sale<br><span class="font-semibold">₱1075.00</span></div>
              <div class="bg-gray-100 rounded p-2 flex-1 border">Cashless sale<br><span class="font-semibold">₱610.00</span></div>
              <div class="bg-gray-100 rounded p-2 flex-1 border">Total Discount<br><span class="font-semibold">₱30.00</span></div>
              <div class="bg-gray-100 rounded p-2 flex-1 border">Total Sale<br><span class="font-semibold">₱1715.00</span></div>
            </div>
          </div>
          <!-- Inventory Alerts -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <h2 class="text-xl font-bold mb-2 text-left">Inventory alerts</h2>
            <div v-if="inventoryLoading" class="text-gray-500">Loading inventory alerts...</div>
            <div v-else-if="inventoryError" class="text-red-500">{{ inventoryError }}</div>
            <div v-else>
              <div class="mb-2">
                <h3 class="font-semibold text-sm mb-1">Low Stock Items</h3>
                <ul v-if="lowStockItems.length" class="text-xs">
                  <li v-for="item in lowStockItems" :key="item.id" class="flex justify-between border-b last:border-b-0 py-1">
                    <span>{{ item.name }}</span>
                    <span class="text-red-600 font-semibold">{{ item.batches.reduce((sum, b) => sum + b.quantity, 0) }} left</span>
                  </li>
                </ul>
                <div v-else class="text-gray-400 text-xs">No low stock items.</div>
              </div>
              <div>
                <h3 class="font-semibold text-sm mb-1">Expiring Items</h3>
                <ul v-if="expiringItems.length" class="text-xs">
                  <li v-for="batch in expiringItems" :key="batch.batchId" class="flex justify-between border-b last:border-b-0 py-1">
                    <span>{{ batch.name }} (Batch #{{ batch.batchId }})</span>
                    <span class="text-yellow-600 font-semibold">Exp: {{ batch.expiry }}</span>
                  </li>
                </ul>
                <div v-else class="text-gray-400 text-xs">No expiring items.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import LineChart from '../components/LineChart.vue';
import CalendarPopup from '../components/CalendarPopup.vue';
import { useOrders } from '../composables/useOrders';

const router = useRouter();
const selectedType = ref('Daily');
const showCalendar = ref(false);
const { completedOrders, todayRevenue } = useOrders();

// --- Inventory Alerts: Fetch inventory from backend ---
const inventory = ref([]);
const inventoryLoading = ref(false);
const inventoryError = ref('');

async function fetchInventory() {
  inventoryLoading.value = true;
  inventoryError.value = '';
  try {
    const res = await fetch('http://localhost:5000/api/inventory');
    if (!res.ok) throw new Error('Failed to fetch inventory');
    inventory.value = await res.json();
  } catch (e) {
    inventoryError.value = e.message;
  } finally {
    inventoryLoading.value = false;
  }
}
onMounted(fetchInventory);

function isLowStock(item) {
  const total = item.batches.reduce((sum, b) => sum + b.quantity, 0);
  return total <= item.low_stock_threshold;
}
function isBatchExpired(batch) {
  return new Date(batch.expiry) < new Date();
}
function soonToExpire(batch) {
  const now = new Date();
  const expiry = new Date(batch.expiry);
  const diff = (expiry - now) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 3;
}

const lowStockItems = computed(() => {
  return inventory.value.filter(item => isLowStock(item));
});
const expiringItems = computed(() => {
  // Flatten all batches with soonToExpire or expired, grouped by item
  const result = [];
  inventory.value.forEach(item => {
    item.batches.forEach(batch => {
      if (soonToExpire(batch) && !isBatchExpired(batch)) {
        result.push({
          name: item.name,
          batchId: batch.id,
          expiry: batch.expiry,
          quantity: batch.quantity
        });
      }
    });
  });
  return result;
});

const chartData = computed(() => {
  // Mock data for chart
  if (selectedType.value === 'Daily') {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Sales',
        data: [10, 40, 80, 30, 50, 40, 60],
        borderColor: '#222',
        fill: false,
      }],
    };
  } else if (selectedType.value === 'Weekly') {
    return {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Sales',
        data: [200, 350, 300, 400],
        borderColor: '#222',
        fill: false,
      }],
    };
  } else {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Sales',
        data: [1200, 1500, 1100, 1800, 1700, 1600, 1750],
        borderColor: '#222',
        fill: false,
      }],
    };
  }
});

const topSelling = [
  { name: 'product', sold: 30 },
  { name: 'product', sold: 25 },
  { name: 'product', sold: 20 },
  { name: 'product', sold: 15 },
  { name: 'product', sold: 10 },
];

// Generate sales summary from actual order data
const saleSummary = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = completedOrders.value.filter(order => order.date === today);
  
  // Group items by name and sum quantities
  const itemMap = new Map();
  
  todayOrders.forEach(order => {
    order.items.forEach(item => {
      if (itemMap.has(item.name)) {
        itemMap.get(item.name).qty += item.quantity;
        itemMap.get(item.name).total += item.price * item.quantity;
      } else {
        itemMap.set(item.name, {
          item: item.name,
          qty: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        });
      }
    });
  });
  
  return Array.from(itemMap.values()).slice(0, 7); // Show top 7 items
});

function handleLogout() {
  router.push('/login');
}

function goToAdminPanel() {
  router.push('/admin/dashboard');
}

function goToInventoryOrders() {
  router.push('/admin/inventory-orders');
}

function goToManageUsers() {
  router.push('/admin/manage-users');
}

async function downloadSalesReport() {
  try {
    // Show loading state
    const link = document.querySelector('a[onclick*="downloadSalesReport"]');
    if (link) {
      link.textContent = 'Generating...';
      link.style.pointerEvents = 'none';
    }

    // Make API call to download Excel file
    const response = await fetch('http://localhost:5000/api/sales/report?reportType=detailed', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Reset button text
    if (link) {
      link.textContent = 'Download Excel';
      link.style.pointerEvents = 'auto';
    }

  } catch (error) {
    console.error('Error downloading sales report:', error);
    alert('Failed to download sales report. Please try again.');
    
    // Reset button text on error
    const link = document.querySelector('a[onclick*="downloadSalesReport"]');
    if (link) {
      link.textContent = 'Download Excel';
      link.style.pointerEvents = 'auto';
    }
  }
}
</script> 
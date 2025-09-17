<template>
  <div>
    
    <div class="min-h-screen bg-gray-50">
      <AdminNavbar @show-calendar="showCalendar = true" />

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
              <h2 class="text-2xl font-bold text-left text-gray-800">Sales Overview</h2>
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
            <h2 class="text-xl font-bold mb-2 text-left text-gray-800">Top Selling items</h2>
            <table class="w-full text-left border-t border-b">
              <tbody>
                <tr v-for="item in topSelling" :key="item.name" class="border-b last:border-b-0">
                  <td class="py-1 font-semibold text-gray-800">{{ item.name }}</td>
                  <td class="py-1 text-right font-semibold text-gray-800">{{ item.sold }} sold</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!-- Right Column -->
        <div class="flex flex-col gap-6">
          <!-- Today's Sale Summary -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <h2 class="text-2xl font-bold mb-2 text-left text-gray-800">Today's Sale Summary</h2>
            <table class="w-full text-sm mb-2 border-t border-b">
              <thead>
                <tr class="border-b">
                  <th class="font-bold text-left text-gray-800">Item</th>
                  <th class="font-bold text-left text-gray-800">Qty</th>
                  <th class="font-bold text-left text-gray-800">Price</th>
                  <th class="font-bold text-left text-gray-800">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in saleSummary" :key="row.item" class="border-b last:border-b-0">
                  <td class="text-gray-800">{{ row.item }}</td>
                  <td class="text-gray-800">{{ row.qty }}</td>
                  <td class="text-gray-800">₱{{ row.price }}</td>
                  <td class="text-gray-800">₱{{ row.total }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-between text-xs mt-2 gap-2">
              <div class="bg-gray-100 rounded p-2 flex-1 border text-gray-800">Cash sale<br><span class="font-semibold">₱{{ cashSales.toFixed(2) }}</span></div>
              <div class="bg-gray-100 rounded p-2 flex-1 border text-gray-800">Cashless sale<br><span class="font-semibold">₱{{ cashlessSales.toFixed(2) }}</span></div>
              <div class="bg-gray-100 rounded p-2 flex-1 border text-gray-800">Total Discount<br><span class="font-semibold">₱{{ totalDiscount.toFixed(2) }}</span></div>
              <div class="bg-gray-100 rounded p-2 flex-1 border text-gray-800">Total Sale<br><span class="font-semibold">₱{{ todayRevenue.toFixed(2) }}</span></div>
            </div>
          </div>
          <!-- Inventory Alerts -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <h2 class="text-xl font-bold mb-2 text-left text-gray-800">Inventory alerts</h2>
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
import { useAuth } from '../composables/useAuth';
import AdminNavbar from '../components/AdminNavbar.vue';
import { useOrders } from '../composables/useOrders';

const router = useRouter();
const selectedType = ref('Daily');
const showCalendar = ref(false);

const { orders, loading: ordersLoading, error: ordersError, fetchOrders } = useOrders();

// --- Inventory Alerts: Fetch inventory from backend ---
const inventory = ref([]);
const inventoryLoading = ref(false);
const inventoryError = ref('');

async function fetchInventory() {
  inventoryLoading.value = true;
  inventoryError.value = '';
  try {
    const res = await fetch('http://localhost:5000/api/inventory', {
      headers: useAuth().getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    inventory.value = await res.json();
  } catch (e) {
    inventoryError.value = e.message;
  } finally {
    inventoryLoading.value = false;
  }
}

onMounted(() => {
  fetchOrders();
  fetchInventory();
});

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
  const todayOrders = orders.value.filter(order => {
    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
    return orderDate === today && order.status === 'completed';
  });
  
  // Group items by name and sum quantities
  const itemMap = new Map();
  
  todayOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (itemMap.has(item.product_name)) {
          itemMap.get(item.product_name).qty += item.quantity;
          itemMap.get(item.product_name).total += parseFloat(item.total_price);
        } else {
          itemMap.set(item.product_name, {
            item: item.product_name,
            qty: item.quantity,
            price: parseFloat(item.unit_price),
            total: parseFloat(item.total_price)
          });
        }
      });
    }
  });
  
  return Array.from(itemMap.values()).slice(0, 7); // Show top 7 items
});

// Calculate today's revenue from real orders
const todayRevenue = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today && order.status === 'completed';
    })
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
});

// Calculate cash vs cashless sales
const cashSales = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today && order.status === 'completed' && order.payment_method === 'Cash';
    })
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
});

const cashlessSales = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today && order.status === 'completed' && order.payment_method !== 'Cash';
    })
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
});

const totalDiscount = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today && order.status === 'completed';
    })
    .reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
});

const { logout } = useAuth();
async function handleLogout() {
  await logout();
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

function goToActivityLogs() {
  router.push('/admin/activity-logs');
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
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

<style scoped>
nav .font-bold {
  color: #1a202c !important; /* dark gray */
  font-weight: 900 !important;
  letter-spacing: 1px;
}

/* Make Weekly/Monthly buttons more visible when not selected */
.btn.btn-outline {
  color: #374151 !important; /* dark gray */
  border-color: #a0aec0 !important;
  background: #f3f4f6 !important;
  opacity: 1 !important;
}
.btn.btn-outline:hover {
  background: #e5e7eb !important;
  color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}

/* Inventory alerts section improvements */
.bg-white .text-gray-400,
.bg-white .text-gray-500 {
  color: #374151 !important; /* dark gray for better visibility */
  opacity: 0.85;
}
.bg-white .text-xs {
  font-size: 0.95rem !important;
}
.bg-white h3 {
  color: #1a202c !important;
  font-weight: 700;
}
.bg-white .text-red-600 {
  color: #dc2626 !important;
  font-weight: 700;
}
.bg-white .text-yellow-600 {
  color: #d97706 !important;
  font-weight: 700;
}
</style> 
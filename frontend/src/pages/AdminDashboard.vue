<template>
  <div>
    
    <div class="min-h-screen bg-gray-50">
      <AdminNavbar @show-calendar="showCalendar = true" />

      <!-- Calendar Popup -->
      <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" @click.self="showCalendar = false">
        <div class="relative">
          <button class="absolute top-2 right-2 text-gray-300 hover:text-white z-10" @click="showCalendar = false">&times;</button>
          <CalendarPopup v-model="selectedDate" />
        </div>
      </div>

      <!-- Main Content -->
      <div class="p-6 grid grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="flex flex-col gap-6">
          <!-- Sales Overview -->
          <div class="bg-white rounded-lg shadow p-6 border">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h2 class="text-2xl font-bold text-left text-gray-800">Sales Overview</h2>
                <div v-if="selectedDate" class="text-sm text-blue-600 font-medium">
                  Filtered by: {{ selectedDate.toLocaleDateString() }}
                </div>
              </div>
              <div class="space-x-2">
                <button v-for="type in ['Daily', 'Weekly', 'Monthly']" :key="type" @click="selectedType = type" :class="[selectedType === type ? 'btn btn-primary' : 'btn btn-outline', 'px-3 py-1 rounded border']">{{ type }}</button>
                <button v-if="selectedDate" @click="clearDateFilter" class="btn btn-outline px-3 py-1 rounded border text-red-600 border-red-600 hover:bg-red-50">Clear Filter</button>
              </div>
            </div>
            <div class="h-56">
              <line-chart :key="chartKey" :chart-data="chartData" />
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
            <h2 class="text-2xl font-bold mb-2 text-left text-gray-800">{{ selectedDate ? selectedDate.toLocaleDateString() + ' Sale Summary' : 'Today\'s Sale Summary' }}</h2>
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
          <div class="bg-white rounded-lg shadow p-6 border inventory-alerts">
            <h2 class="text-xl font-bold mb-2 text-left text-gray-800">Inventory alerts</h2>
            <div v-if="inventoryLoading" class="text-gray-500">Loading inventory alerts...</div>
            <div v-else-if="inventoryError" class="text-red-500">{{ inventoryError }}</div>
            <div v-else>
              <div class="mb-2">
                <h3 class="font-semibold text-sm mb-1">Low Stock Items</h3>
                <ul v-if="lowStockItems.length" class="text-xs">
                  <li v-for="item in lowStockItems" :key="item.id" class="flex justify-between border-b last:border-b-0 py-1">
                    <span class="text-gray-800 font-semibold">{{ item.name }}</span>
                    <span class="text-red-600 font-semibold">{{ item.batches.reduce((sum, b) => sum + b.quantity, 0) }} left</span>
                  </li>
                </ul>
                <div v-else class="text-gray-400 text-xs">No low stock items.</div>
              </div>
              <div>
                <h3 class="font-semibold text-sm mb-1">Expiring Items</h3>
                <ul v-if="expiringItems.length" class="text-xs">
                  <li v-for="batch in expiringItems" :key="batch.batchId" class="flex justify-between border-b last:border-b-0 py-1">
                    <span class="text-gray-800 font-semibold">{{ batch.name }} (Batch #{{ batch.batchId }})</span>
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
const selectedDate = ref(null);
const chartKey = computed(() => (selectedDate.value ? selectedDate.value.toISOString() : `no-date-${selectedType.value}`));

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

function formatDay(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}
function formatMonth(date) {
  return date.toLocaleDateString(undefined, { month: 'short' });
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}
const chartData = computed(() => {
  let filteredOrders = orders.value.filter(o => o.status === 'completed');
  
  // Filter by selected date if one is selected
  if (selectedDate.value) {
    const selectedDateStr = selectedDate.value.toISOString().split('T')[0];
    filteredOrders = filteredOrders.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      return orderDate === selectedDateStr;
    });
  }
  
  const today = new Date();
  let labels = [];
  let data = [];

  if (selectedType.value === 'Daily') {
    if (selectedDate.value) {
      // Show hourly data for selected date
      const buckets = [];
      for (let i = 0; i < 24; i++) {
        const hourStart = new Date(selectedDate.value);
        hourStart.setHours(i, 0, 0, 0);
        const hourEnd = new Date(selectedDate.value);
        hourEnd.setHours(i, 59, 59, 999);
        
        const sum = filteredOrders
          .filter(o => {
            const orderTime = new Date(o.created_at);
            return orderTime >= hourStart && orderTime <= hourEnd;
          })
          .reduce((s, o) => s + parseFloat(o.total), 0);
        buckets.push({ label: `${i}:00`, value: sum });
      }
      labels = buckets.map(b => b.label);
      data = buckets.map(b => b.value);
    } else {
      // Last 7 days
      const buckets = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const sum = filteredOrders
          .filter(o => new Date(o.created_at).toISOString().split('T')[0] === key)
          .reduce((s, o) => s + parseFloat(o.total), 0);
        buckets.push({ label: formatDay(d), value: sum });
      }
      labels = buckets.map(b => b.label);
      data = buckets.map(b => b.value);
    }
  } else if (selectedType.value === 'Weekly') {
    // Last 4 weeks
    const weeks = [];
    let start = startOfWeek(today);
    for (let i = 3; i >= 0; i--) {
      const ws = new Date(start);
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      const sum = filteredOrders
        .filter(o => {
          const d = new Date(o.created_at);
          return d >= ws && d <= we;
        })
        .reduce((s, o) => s + parseFloat(o.total), 0);
      weeks.push({ label: `${ws.toLocaleDateString()} - ${we.toLocaleDateString()}`, value: sum });
    }
    labels = weeks.map(w => w.label);
    data = weeks.map(w => w.value);
  } else {
    // Last 7 months
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const sum = filteredOrders
        .filter(o => {
          const od = new Date(o.created_at);
          return od >= monthStart && od <= monthEnd;
        })
        .reduce((s, o) => s + parseFloat(o.total), 0);
      months.push({ label: formatMonth(d), value: sum });
    }
    labels = months.map(m => m.label);
    data = months.map(m => m.value);
  }

  return {
    labels,
    datasets: [{ label: 'Sales', data, borderColor: '#222', fill: false }],
  };
});

const topSelling = computed(() => {
  // Aggregate quantities per product
  let filteredOrders = orders.value.filter(o => o.status === 'completed');
  
  // Filter by selected date if one is selected
  if (selectedDate.value) {
    const selectedDateStr = selectedDate.value.toISOString().split('T')[0];
    filteredOrders = filteredOrders.filter(o => {
      const orderDate = new Date(o.created_at).toISOString().split('T')[0];
      return orderDate === selectedDateStr;
    });
  } else {
    // Default: last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= cutoff);
  }
  
  const map = new Map();
  filteredOrders.forEach(o => {
    if (Array.isArray(o.items)) {
      o.items.forEach(it => {
        const name = it.product_name || it.name || 'Unknown';
        const qty = Number(it.quantity) || 0;
        map.set(name, (map.get(name) || 0) + qty);
      });
    }
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, sold: qty }));
});

// Generate sales summary from actual order data
const saleSummary = computed(() => {
  let targetDate = new Date().toISOString().split('T')[0];
  
  // Use selected date if one is selected, otherwise use today
  if (selectedDate.value) {
    targetDate = selectedDate.value.toISOString().split('T')[0];
  }
  
  const filteredOrders = orders.value.filter(order => {
    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
    return orderDate === targetDate && order.status === 'completed';
  });
  
  // Group items by name and sum quantities
  const itemMap = new Map();
  
  filteredOrders.forEach(order => {
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

// Calculate revenue from real orders
const todayRevenue = computed(() => {
  let targetDate = new Date().toISOString().split('T')[0];
  
  // Use selected date if one is selected, otherwise use today
  if (selectedDate.value) {
    targetDate = selectedDate.value.toISOString().split('T')[0];
  }
  
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === targetDate && order.status === 'completed';
    })
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
});

// Calculate cash vs cashless sales
const cashSales = computed(() => {
  let targetDate = new Date().toISOString().split('T')[0];
  
  // Use selected date if one is selected, otherwise use today
  if (selectedDate.value) {
    targetDate = selectedDate.value.toISOString().split('T')[0];
  }
  
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === targetDate && order.status === 'completed' && order.payment_method === 'Cash';
    })
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
});

const cashlessSales = computed(() => {
  let targetDate = new Date().toISOString().split('T')[0];
  
  // Use selected date if one is selected, otherwise use today
  if (selectedDate.value) {
    targetDate = selectedDate.value.toISOString().split('T')[0];
  }
  
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === targetDate && order.status === 'completed' && order.payment_method !== 'Cash';
    })
    .reduce((sum, order) => sum + parseFloat(order.total), 0);
});

const totalDiscount = computed(() => {
  let targetDate = new Date().toISOString().split('T')[0];
  
  // Use selected date if one is selected, otherwise use today
  if (selectedDate.value) {
    targetDate = selectedDate.value.toISOString().split('T')[0];
  }
  
  return orders.value
    .filter(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === targetDate && order.status === 'completed';
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

async function downloadSummaryReport() {
  try {
    const response = await fetch('http://localhost:5000/api/sales/report?reportType=summarized', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to generate summarized report');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading summarized report:', error);
    alert('Failed to download summarized report. Please try again.');
  }
}

function clearDateFilter() {
  selectedDate.value = null;
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

/* Force high-contrast text for inventory alert list */
.inventory-alerts ul li { color: #111827 !important; }
.inventory-alerts ul li span:first-child { color: #111827 !important; }
</style> 
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
      <div class="flex items-center">
        <span class="w-8 h-8 bg-gray-200 rounded-full mr-3"></span>
        <span class="text-xl font-semibold text-gray-800">Admin</span>
      </div>
      <div class="flex-1 flex justify-end items-center">
        <div class="flex items-center space-x-6">
          <a @click.prevent="goToDashboard" class="text-gray-700 hover:underline cursor-pointer">Dashboard</a>
          <a @click.prevent="showCalendar = true" class="text-gray-700 hover:underline cursor-pointer">Calendar</a>
          <span class="text-gray-700 font-semibold">Inventory Management/Order History</span>
          <a @click.prevent="downloadSalesReport" class="text-gray-700 hover:underline cursor-pointer">Download Sales Report</a>
          <a @click.prevent="goToManageUsers" class="text-gray-700 hover:underline cursor-pointer">Manage users</a>
          <button @click="handleLogout" class="text-red-500 hover:underline px-4 py-2 bg-black text-white rounded font-bold" style="color: #ef4444 !important;">Logout</button>
        </div>
      </div>
    </nav>

    <!-- Calendar Popup -->
    <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" @click.self="showCalendar = false">
      <div class="bg-white rounded-lg shadow-lg p-6 relative w-80">
        <button class="absolute top-2 right-2 text-gray-500 hover:text-black" @click="showCalendar = false">&times;</button>
        <CalendarPopup />
      </div>
    </div>

    <!-- Add Raw Material Modal -->
    <div v-if="showRawModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showRawModal = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Add Raw Material</h2>
        <form @submit.prevent="submitRawMaterial">
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Name</label>
            <input v-model="rawForm.name" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Quantity</label>
            <input v-model.number="rawForm.quantity" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Expiry Date</label>
            <input v-model="rawForm.expiry" type="date" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Low Stock Alert Level
              <span class="block text-xs text-gray-500">Show a warning when quantity is at or below this number.</span>
            </label>
            <input v-model.number="rawForm.lowStockThreshold" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div v-if="addError" class="text-red-500 text-sm mb-2">{{ addError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="addLoading">
            {{ addLoading ? 'Adding...' : 'Add Raw Material' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Add Product Modal -->
    <div v-if="showProductModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-[28rem] relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showProductModal = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Add Product</h2>
        <form @submit.prevent="submitProduct">
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Name</label>
            <input v-model="productForm.name" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Quantity</label>
            <input v-model.number="productForm.quantity" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Expiry Date</label>
            <input v-model="productForm.expiry" type="date" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Low Stock Alert Level
              <span class="block text-xs text-gray-500">Show a warning when quantity is at or below this number.</span>
            </label>
            <input v-model.number="productForm.lowStockThreshold" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Price (₱)
              <span class="block text-xs text-gray-500">Price that will appear in the POS system.</span>
            </label>
            <input v-model.number="productForm.price" type="number" min="0" step="0.01" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Raw Materials</label>
            <div v-for="(rm, idx) in productForm.rawMaterials" :key="idx" class="flex gap-2 mb-2">
              <select v-model="rm.name" class="select select-bordered flex-1">
                <option value="" disabled>Select Raw Material</option>
                <option v-for="raw in inventory.filter(i => i.type === 'raw')" :key="raw.id" :value="raw.name">{{ raw.name }}</option>
              </select>
              <input v-model.number="rm.quantity" type="number" min="1" class="input input-bordered w-20" placeholder="Qty" />
              <button type="button" class="btn btn-error btn-xs" @click="removeProductRawMaterial(idx)">&times;</button>
            </div>
            <button type="button" class="btn btn-outline btn-sm" @click="addProductRawMaterial">+ Add Raw Material</button>
          </div>
          <div v-if="addError" class="text-red-500 text-sm mb-2">{{ addError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="addLoading">
            {{ addLoading ? 'Adding...' : 'Add Product' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Edit Batch Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showEditModal = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Add Batch to {{ editItem?.name }}</h2>
        <form @submit.prevent="submitEditBatch">
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Quantity</label>
            <input v-model.number="editBatchForm.quantity" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Expiry Date</label>
            <input v-model="editBatchForm.expiry" type="date" class="input input-bordered w-full" required />
          </div>
          <div v-if="editError" class="text-red-500 text-sm mb-2">{{ editError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="editLoading">
            {{ editLoading ? 'Saving...' : 'Add Batch' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Main Content -->
    <div class="p-6 grid grid-cols-12 gap-6">
      <!-- Order History (Left) -->
      <div class="col-span-3 bg-white rounded-lg shadow flex flex-col h-[80vh]">
        <h2 class="text-2xl font-bold p-6 pb-2 text-gray-800">Order History</h2>
        <div class="flex-1 overflow-y-auto px-6 pb-6">
          <div v-for="order in orders" :key="order.id" class="flex items-center justify-between py-3 border-b">
            <div class="flex items-center">
              <span class="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center mr-3" style="min-width:16px; min-height:16px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" class="text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V20a2 2 0 01-2 2z" /></svg>
              </span>
              <div>
                <div class="font-semibold text-gray-800">Order #{{ order.number }}</div>
                <div class="text-xs text-gray-700">Date: {{ order.date }}</div>
              </div>
            </div>
            <div class="font-semibold">${{ order.amount }}</div>
          </div>
        </div>
      </div>
      <!-- Inventory (Right) -->
      <div class="col-span-9 bg-white rounded-lg shadow p-8 flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-gray-800">Inventory Management</h2>
          <div class="space-x-2">
            <button class="btn btn-outline" @click="openRawModal">Add Raw Material</button>
            <button class="btn btn-outline" @click="openProductModal">Add Product</button>
          </div>
        </div>
        <div class="mb-4 flex items-center">
          <input v-model="searchQuery" placeholder="Search inventory..." class="input input-bordered w-1/3" />
        </div>
        <div v-if="loading" class="text-center text-gray-500 py-8">Loading inventory...</div>
        <div v-else-if="error" class="text-center text-red-500 py-8">{{ error }}</div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="item in filteredInventory" :key="item.id" class="border rounded-lg p-4 bg-gray-50 flex flex-col">
            <div class="flex justify-between items-center mb-2">
              <div class="font-semibold text-gray-800">{{ item.name }}</div>
              <span v-if="isLowStock(item)" class="text-xs text-red-600 font-bold ml-2">Low Stock!</span>
              <button class="btn btn-link btn-xs" @click="openEditModal(item)">Edit</button>
              <button class="btn btn-link btn-xs btn-error" @click="discardItem(item.id)">Discard</button>
            </div>
            <div class="text-xs text-gray-700 mb-2">Type: {{ item.type === 'raw' ? 'Raw Material' : (item.type === 'Product' ? 'Product' : 'Product') }}</div>
            <div class="flex-1">
              <div v-for="batch in item.batches" :key="batch.id" class="mb-2 p-2 rounded border bg-white">
                <div class="flex justify-between items-center">
                  <div>
                    <span class="font-bold">Batch #{{ batch.id }}</span>
                    <span v-if="isBatchExpired(batch)" class="ml-2 text-xs text-red-500 font-bold">Expired!</span>
                    <span v-else-if="soonToExpire(batch)" class="ml-2 text-xs text-yellow-600 font-bold">Expiring Soon</span>
                  </div>
                  <button class="btn btn-link btn-xs btn-error" @click="discardBatch(item.id, batch.id)">Discard</button>
                </div>
                <div>Qty: <span class="font-semibold">{{ batch.quantity }}</span></div>
                <div>Expiry: <span>{{ batch.expiry }}</span></div>
              </div>
            </div>
            <div v-if="(item.type === 'product' || item.type === 'Product') && item.requires_raw_materials" class="mt-2 text-xs text-gray-600">
              <div>Raw Materials:</div>
              <ul class="list-disc ml-4">
                <li v-for="rm in item.raw_materials" :key="rm.name">{{ rm.quantity }}x {{ rm.name }}</li>
              </ul>
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
import CalendarPopup from '../components/CalendarPopup.vue';
import { useOrders } from '../composables/useOrders';

const router = useRouter();
const showCalendar = ref(false);
const { completedOrders } = useOrders();

// --- Inventory State (from backend) ---
const inventory = ref([]);
const loading = ref(false);
const error = ref('');

// --- Modal State ---
const showRawModal = ref(false);
const showProductModal = ref(false);
const addLoading = ref(false);
const addError = ref('');

// --- Edit Batch Modal State ---
const showEditModal = ref(false);
const editItem = ref(null);
const editBatchForm = ref({ quantity: 1, expiry: '' });
const editLoading = ref(false);
const editError = ref('');

// --- Raw Material Form ---
const rawForm = ref({
  name: '',
  quantity: 1,
  expiry: '',
  lowStockThreshold: 1,
});

// --- Product Form ---
const productForm = ref({
  name: '',
  quantity: 1,
  expiry: '',
  lowStockThreshold: 1,
  price: 0,
  rawMaterials: [], // [{ name, quantity }]
});

// --- Fetch inventory from backend ---
async function fetchInventory() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('http://localhost:5000/api/inventory');
    if (!res.ok) throw new Error('Failed to fetch inventory');
    inventory.value = await res.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(fetchInventory);

// --- Search ---
const searchQuery = ref('');
const filteredInventory = computed(() => {
  if (!searchQuery.value) return inventory.value;
  return inventory.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// --- Stock/Expiry Alerts ---
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

// --- Add Raw Material ---
function openRawModal() {
  rawForm.value = { name: '', quantity: 1, expiry: '', lowStockThreshold: 1 };
  addError.value = '';
  showRawModal.value = true;
}
async function submitRawMaterial() {
  addLoading.value = true;
  addError.value = '';
  try {
    if (!rawForm.value.name) throw new Error('Name is required');
    if (!rawForm.value.expiry) throw new Error('Expiry date is required');
    if (rawForm.value.quantity < 1) throw new Error('Quantity must be at least 1');
    // 1. Create item
    const res = await fetch('http://localhost:5000/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: rawForm.value.name,
        type: 'raw',
        lowStockThreshold: rawForm.value.lowStockThreshold,
        requiresRawMaterials: false,
        rawMaterials: [],
      }),
    });
    if (!res.ok) throw new Error('Failed to add raw material');
    const item = await res.json();
    // 2. Add batch
    const batchRes = await fetch('http://localhost:5000/api/inventory/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        quantity: rawForm.value.quantity,
        expiry: rawForm.value.expiry,
      }),
    });
    if (!batchRes.ok) throw new Error('Failed to add batch');
    showRawModal.value = false;
    await fetchInventory();
  } catch (e) {
    addError.value = e.message;
  } finally {
    addLoading.value = false;
  }
}

// --- Add Product ---
function openProductModal() {
  productForm.value = { name: '', quantity: 1, expiry: '', lowStockThreshold: 1, rawMaterials: [] };
  addError.value = '';
  showProductModal.value = true;
}
function addProductRawMaterial() {
  productForm.value.rawMaterials.push({ name: '', quantity: 1 });
}
function removeProductRawMaterial(idx) {
  productForm.value.rawMaterials.splice(idx, 1);
}
async function submitProduct() {
  addLoading.value = true;
  addError.value = '';
  try {
    if (!productForm.value.name) throw new Error('Name is required');
    if (!productForm.value.expiry) throw new Error('Expiry date is required');
    if (productForm.value.quantity < 1) throw new Error('Quantity must be at least 1');
    if (productForm.value.rawMaterials.some(rm => !rm.name || rm.quantity < 1)) throw new Error('All raw materials must have a name and quantity');
    // 1. Create item
    const res = await fetch('http://localhost:5000/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
          name: productForm.value.name,
          type: 'Product',
          lowStockThreshold: productForm.value.lowStockThreshold,
          requiresRawMaterials: true,
          rawMaterials: productForm.value.rawMaterials,
          price: productForm.value.price,
        }),
    });
    if (!res.ok) throw new Error('Failed to add product');
    const item = await res.json();
    // 2. Add batch
    const batchRes = await fetch('http://localhost:5000/api/inventory/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: item.id,
        quantity: productForm.value.quantity,
        expiry: productForm.value.expiry,
      }),
    });
    if (!batchRes.ok) throw new Error('Failed to add batch');
    showProductModal.value = false;
    await fetchInventory();
  } catch (e) {
    addError.value = e.message;
  } finally {
    addLoading.value = false;
  }
}

// --- Edit Batch ---
function openEditModal(item) {
  editItem.value = item;
  editBatchForm.value = { quantity: 1, expiry: '' };
  editError.value = '';
  showEditModal.value = true;
}
async function submitEditBatch() {
  editLoading.value = true;
  editError.value = '';
  try {
    if (!editBatchForm.value.expiry) throw new Error('Expiry date is required');
    if (editBatchForm.value.quantity < 1) throw new Error('Quantity must be at least 1');
    await fetch('http://localhost:5000/api/inventory/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: editItem.value.id,
        quantity: editBatchForm.value.quantity,
        expiry: editBatchForm.value.expiry,
      }),
    });
    showEditModal.value = false;
    await fetchInventory();
  } catch (e) {
    editError.value = e.message;
  } finally {
    editLoading.value = false;
  }
}

// --- Discard Item or Batch ---
async function discardBatch(itemId, batchId) {
  // Always confirm before discarding
  if (confirm('Are you sure you want to discard this batch?')) {
    await fetch(`http://localhost:5000/api/inventory/batch/${batchId}`, { method: 'DELETE' });
    await fetchInventory();
  }
}
async function discardItem(itemId) {
  if (confirm('Are you sure you want to discard this entire item and all its batches?')) {
    await fetch(`http://localhost:5000/api/inventory/${itemId}`, { method: 'DELETE' });
    await fetchInventory();
  }
}

function goToDashboard() {
  router.push('/admin/dashboard');
}
function goToManageUsers() {
  router.push('/admin/manage-users');
}
function handleLogout() {
  router.push('/login');
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
      link.textContent = 'Download Sales Report';
      link.style.pointerEvents = 'auto';
    }

  } catch (error) {
    console.error('Error downloading sales report:', error);
    alert('Failed to download sales report. Please try again.');
    
    // Reset button text on error
    const link = document.querySelector('a[onclick*="downloadSalesReport"]');
    if (link) {
      link.textContent = 'Download Sales Report';
      link.style.pointerEvents = 'auto';
    }
  }
}

// Use shared order data instead of local mock data
const orders = ref([]);

async function fetchOrders() {
  const res = await fetch('http://localhost:5000/api/orders');
  const data = await res.json();
  orders.value = data.map(order => ({
    id: order.id,
    number: order.order_number,
    date: order.created_at ? order.created_at.split('T')[0] : '',
    amount: order.total
  }));
}

onMounted(fetchOrders);
</script> 

<style scoped>
/* Improve font contrast for inventory management */
.text-gray-400, .text-gray-500, .text-gray-300 {
  color: #374151 !important;
  opacity: 1 !important;
}
.text-xs, .text-sm, .text-gray-700, .text-gray-600 {
  color: #1e293b !important;
  opacity: 1 !important;
}
.font-semibold, .font-bold {
  color: #1e293b !important;
  font-weight: 700 !important;
}
.bg-white .text-xs, .bg-white .text-gray-700, .bg-white .text-gray-600 {
  color: #1e293b !important;
  opacity: 1 !important;
}
/* Batch info (Qty, Expiry) */
.bg-white div, .bg-white span {
  color: #1e293b !important;
  opacity: 1 !important;
}
/* Add Raw Material and Add Product buttons */
.btn.btn-outline {
  color: #1e293b !important;
  border-color: #6366f1 !important;
  background: #e0e7ff !important;
  font-weight: 700 !important;
}
.btn.btn-outline:disabled, .btn.btn-outline[disabled] {
  color: #6b7280 !important;
  background: #f3f4f6 !important;
  border-color: #d1d5db !important;
  opacity: 1 !important;
}
/* Fix input text color and background for better contrast */
.input, .input.input-bordered {
  color: #1e293b !important;
  background: #fff !important;
  border-color: #d1d5db !important;
}
/* Fix input and select text color and background for better contrast in modals */
.input, .input.input-bordered, .select, .select.select-bordered {
  color: #1e293b !important;
  background: #fff !important;
  border-color: #d1d5db !important;
}
</style> 
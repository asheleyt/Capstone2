<template>
  <div class="min-h-screen bg-gray-50">
    <AdminNavbar @show-calendar="showCalendar = true"></AdminNavbar>

    <!-- Calendar Popup (standardized) -->
    <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]" @click.self="showCalendar = false">
      <div class="relative">
        <button class="absolute top-2 right-2 text-gray-300 hover:text-white z-10" @click="showCalendar = false">&times;</button>
        <CalendarPopup v-model="selectedDate" />
      </div>
    </div>

    <!-- Add Raw Material Modal -->
    <div v-if="showRawModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showRawModal = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Add Raw Material</h2>
        <form @submit.prevent="submitRawMaterial">
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Add to Existing Raw Material</label>
            <select v-model="rawForm.existingItemId" class="select select-bordered w-full text-white">
              <option value="">-- Create New --</option>
              <option v-for="raw in inventory.filter(i => i.type === 'raw')" :key="raw.id" :value="raw.id">
                {{ raw.name }} ({{ raw.unit || 'unit' }})
              </option>
            </select>
          </div>
          <div class="mb-3" v-if="!rawForm.existingItemId">
            <label class="block text-sm font-semibold mb-1">Name</label>
            <input v-model="rawForm.name" class="input input-bordered w-full text-white" required />
          </div>
          <!-- Quantity removed: we rely on measurement + unit (including pcs) -->
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Expiry Date</label>
            <input v-model="rawForm.expiry" type="date" class="input input-bordered w-full text-white" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Specific Unit Amount</label>
            <div class="flex gap-2">
              <input v-model.number="rawForm.unitAmount" type="number" min="0" step="0.01" class="input input-bordered w-full" placeholder="e.g., 2" />
              <select v-model="rawForm.unitLabel" class="select select-bordered w-28">
                <option value="">{{ currentUnitLabel || 'unit' }}</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
            <span class="text-xs text-gray-500">Optional. Example result: Unit: 2 kg</span>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Low Stock Alert Level
              <span class="block text-xs text-gray-500">Show a warning when quantity is at or below this number.</span>
            </label>
            <input v-model.number="rawForm.lowStockThreshold" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <!-- Measurement Unit and Category removed per request -->
          <div v-if="addError" class="text-red-500 text-sm mb-2">{{ addError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="addLoading">
            {{ addLoading ? 'Adding...' : (rawForm.existingItemId ? 'Add Batch' : 'Add Raw Material') }}
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
          <div class="mb-3" v-if="productForm.rawMaterials.length === 0">
            <label class="block text-sm font-semibold mb-1">Quantity</label>
            <input v-model.number="productForm.quantity" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div class="mb-2 text-xs text-gray-600" v-else>
            Quantity is auto-calculated from raw materials.
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
            <div v-for="(rm, idx) in productForm.rawMaterials" :key="idx" class="grid grid-cols-12 gap-2 mb-2 items-center">
              <select v-model="rm.name" class="select select-bordered col-span-5" @change="onRmChange(rm)">
                <option value="" disabled>Select Raw Material</option>
                <option v-for="raw in inventory.filter(i => i.type === 'raw')" :key="raw.id" :value="raw.name">{{ raw.name }}</option>
              </select>
              <input v-model.number="rm.perUnitAmount" @input="recomputeProductQty()" type="number" min="0" step="0.01" class="input input-bordered col-span-3" placeholder="Amt per product" />
              <select v-model="rm.unit" class="select select-bordered col-span-2" @change="recomputeProductQty()">
                <option value="">unit</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
              </select>
              <button type="button" class="btn btn-error btn-xs col-span-2" @click="removeProductRawMaterial(idx)">&times;</button>
              <div class="col-span-12 text-xs text-gray-600" v-if="rm.name">
                <span>In stock: {{ getRawStock(rm).display }}</span>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm text-white bg-black" @click="addProductRawMaterial">+ Add Raw Material</button>
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

    <!-- Add Edit Raw Material Modal -->
    <div v-if="showEditRawModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-96 relative">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showEditRawModal = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Edit Raw Material</h2>
        <form @submit.prevent="submitEditRawMaterial">
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Name</label>
            <input v-model="editRawForm.name" class="input input-bordered w-full" required />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Measurement Unit</label>
            <select v-model="editRawForm.unit" class="select select-bordered w-full" required>
              <option value="" disabled>Select unit</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="pcs">pcs</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Category</label>
            <select v-model="editRawForm.category" class="select select-bordered w-full" required>
              <option value="" disabled>Select category</option>
              <option value="Spices">Spices</option>
              <option value="Meat">Meat</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Baking">Baking</option>
              <option value="Dairy">Dairy</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Low Stock Alert Level</label>
            <input v-model.number="editRawForm.lowStockThreshold" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div v-if="addError" class="text-red-500 text-sm mb-2">{{ addError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="addLoading">
            {{ addLoading ? 'Saving...' : 'Save Changes' }}
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
            <label class="block text-sm font-semibold mb-1">Add to Existing Product</label>
            <select v-model="productForm.existingItemId" class="select select-bordered w-full">
              <option value="">-- Create New --</option>
              <option v-for="p in inventory.filter(i => i.type === 'Product' || i.type === 'product')" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </div>

          <div class="mb-3" v-if="!productForm.existingItemId">
            <label class="block text-sm font-semibold mb-1">Name</label>
            <input v-model="productForm.name" class="input input-bordered w-full" placeholder="Product name" />
          </div>

          <div class="mb-3" v-if="productForm.rawMaterials.length === 0">
            <label class="block text-sm font-semibold mb-1">Quantity</label>
            <input v-model.number="productForm.quantity" type="number" min="1" class="input input-bordered w-full" required />
          </div>
          <div class="mb-2 text-xs text-gray-600" v-else>
            Quantity is auto-calculated from raw materials.
          </div>

          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Expiry Date</label>
            <input v-model="productForm.expiry" type="date" class="input input-bordered w-full" required />
          </div>

          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Low Stock Alert Level</label>
            <input v-model.number="productForm.lowStockThreshold" type="number" min="1" class="input input-bordered w-full" required />
          </div>

          <div class="mb-3" v-if="!productForm.existingItemId">
            <label class="block text-sm font-semibold mb-1">Price (₱)
              <span class="block text-xs text-gray-500">Price that will appear in the POS system.</span>
            </label>
            <input v-model.number="productForm.price" type="number" min="0" step="0.01" class="input input-bordered w-full" />
          </div>

          <div class="mb-3" v-if="!productForm.existingItemId">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-semibold">Raw Materials</label>
              <button type="button" class="btn btn-outline btn-xs" @click="addProductRawMaterial">+ Add Raw Material</button>
            </div>
            <div v-for="(rm, idx) in productForm.rawMaterials" :key="idx" class="grid grid-cols-12 gap-2 mb-2 items-center">
              <select v-model="rm.name" class="select select-bordered col-span-5" @change="onRmChange(rm)">
                <option value="" disabled>Select raw material</option>
                <option v-for="raw in inventory.filter(i => i.type === 'raw')" :key="raw.id" :value="raw.name">{{ raw.name }}</option>
              </select>
              <input v-model.number="rm.perUnitAmount" @input="recomputeProductQty()" type="number" min="0" step="0.01" class="input input-bordered col-span-3" placeholder="Amt per product" />
              <select v-model="rm.unit" class="select select-bordered col-span-2" @change="recomputeProductQty()">
                <option value="">unit</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
              </select>
              <button type="button" class="btn btn-error btn-sm col-span-2" @click="removeProductRawMaterial(idx)">Remove</button>
              <div class="col-span-12 text-xs text-gray-600" v-if="rm.name">
                <span>In stock: {{ getRawStock(rm).display }}</span>
              </div>
            </div>
          </div>

          <div v-if="addError" class="text-red-500 text-sm mb-2">{{ addError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="addLoading">
            {{ addLoading ? 'Saving...' : (productForm.existingItemId ? 'Add Batch' : 'Add Product') }}
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
                <div class="font-semibold text-gray-800">Order #{{ order.order_number }}</div>
                <div class="text-xs text-gray-700">Date: {{ formatDate(order.created_at) }}</div>
                <div class="text-xs text-gray-700">Table: {{ order.table_number || 'N/A' }}</div>
              </div>
            </div>
            <div class="font-bold">₱{{ parseFloat(order.total).toFixed(2) }}</div>
          </div>
        </div>
      </div>
      <!-- Inventory (Right) -->
      <div class="col-span-9 bg-white rounded-lg shadow p-8 flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-gray-800">Inventory Management</h2>
          <div class="space-x-2">
            <button class="btn btn-outline bg-black text-white" @click="openRawModal">Add Raw Material</button>
            <button class="btn btn-outline bg-black text-white" @click="openProductModal">Add Product</button>
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
              <button v-if="item.type === 'raw'" class="btn btn-link btn-xs" @click="openEditRawModal(item)">Edit</button>
              <button class="btn btn-link btn-xs btn-error" @click="discardItem(item)">Discard</button>
              <button class="btn btn-link btn-xs" @click="archiveItem(item)">Archive</button>
            </div>
            <div class="text-xs text-gray-700 mb-2">
              Type: {{ item.type === 'raw' ? 'Raw Material' : (item.type === 'Product' ? 'Product' : 'Product') }}
              <span v-if="item.unit">| Unit: {{ item.unit }}</span>
              <span v-if="item.category">| Category: {{ item.category }}</span>
            </div>
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
                <div>Qty: <span class="font-semibold">{{ batch.quantity }}<span v-if="item.unit"> {{ item.unit }}</span></span></div>
                <div v-if="batch.unit_amount || batch.unit_label">Unit: <span class="font-semibold">{{ batch.unit_amount || '' }} <span>{{ batch.unit_label || '' }}</span></span></div>
                <div>Expiry: <span>{{ batch.expiry }}</span></div>
              </div>
            </div>
            <div v-if="(item.type === 'product' || item.type === 'Product') && item.requires_raw_materials" class="mt-2 text-xs text-gray-600">
              <div>Raw Materials:</div>
              <ul class="list-disc ml-4">
                <li v-for="rm in item.raw_materials" :key="rm.name">
                  <template v-if="rm.perUnitAmount">
                    {{ rm.perUnitAmount }}<span v-if="rm.unit"> {{ rm.unit }}</span> of {{ rm.name }} per product
                  </template>
                  <template v-else>
                    {{ rm.quantity || 1 }}x {{ rm.name }}
                  </template>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import CalendarPopup from '../components/CalendarPopup.vue';
import { useOrders } from '../composables/useOrders';
import { useAuth } from '../composables/useAuth';
import AdminNavbar from '../components/AdminNavbar.vue';

const router = useRouter();
const showCalendar = ref(false);
const { orders, loading: ordersLoading, error: ordersError, fetchOrders } = useOrders();

let ordersInterval = null;
onMounted(() => {
  fetchOrders();
  ordersInterval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
});
onUnmounted(() => {
  if (ordersInterval) clearInterval(ordersInterval);
});

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
  existingItemId: '',
  name: '',
  quantity: 1,
  expiry: '',
  unitAmount: null,
  unitLabel: '',
  lowStockThreshold: 1,
});

// --- Product Form ---
const productForm = ref({
  existingItemId: '',
  name: '',
  quantity: 1,
  expiry: '',
  lowStockThreshold: 1,
  price: 0,
  rawMaterials: [], // [{ name, perUnitAmount, unit }]
});

// --- Add/Edit Raw Material Modal logic (add after editBatchForm and editItem)
const editRawForm = ref({ name: '', unit: '', category: '', lowStockThreshold: 1 });
const showEditRawModal = ref(false);
function openEditRawModal(item) {
  editItem.value = item;
  editRawForm.value = {
    name: item.name,
    unit: item.unit || '',
    category: item.category || '',
    lowStockThreshold: item.low_stock_threshold || 1,
  };
  showEditRawModal.value = true;
}
async function submitEditRawMaterial() {
  addLoading.value = true;
  addError.value = '';
  try {
    if (!editRawForm.value.name) throw new Error('Name is required');
    if (!editRawForm.value.unit) throw new Error('Measurement unit is required');
    if (!editRawForm.value.category) throw new Error('Category is required');
    await fetch(`http://localhost:5000/api/inventory/${editItem.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({
        name: editRawForm.value.name,
        unit: editRawForm.value.unit,
        category: editRawForm.value.category,
        lowStockThreshold: editRawForm.value.lowStockThreshold,
      }),
    });
    showEditRawModal.value = false;
    await fetchInventory();
  } catch (e) {
    addError.value = e.message;
  } finally {
    addLoading.value = false;
  }
}

// --- Fetch inventory from backend ---
async function fetchInventory() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('http://localhost:5000/api/inventory', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
  rawForm.value = { existingItemId: '', name: '', quantity: 1, expiry: '', unitAmount: null, unitLabel: '', lowStockThreshold: 1 };
  addError.value = '';
  showRawModal.value = true;
}
const currentUnitLabel = computed(() => {
  if (rawForm.value.unitLabel) return rawForm.value.unitLabel;
  if (rawForm.value.existingItemId) {
    const found = inventory.value.find(i => i.id === Number(rawForm.value.existingItemId));
    return found?.unit || '';
  }
  return '';
});
async function submitRawMaterial() {
  addLoading.value = true;
  addError.value = '';
  try {
    if (!rawForm.value.expiry) throw new Error('Expiry date is required');
    // No plain quantity; rely on unit amount + unit label or default unit

    let itemId = rawForm.value.existingItemId;

    // If creating new, create or reuse by name via backend
    if (!itemId) {
      if (!rawForm.value.name) throw new Error('Name is required');

      const res = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          name: rawForm.value.name,
          type: 'raw',
          unit: rawForm.value.unitLabel || currentUnitLabel.value || 'unit',
          category: 'Other',
          lowStockThreshold: rawForm.value.lowStockThreshold,
          requiresRawMaterials: false,
          rawMaterials: [],
        }),
      });
      if (!res.ok) throw new Error('Failed to add raw material');
      const item = await res.json();
      itemId = item.id;
    }

    // Add batch to selected or newly created item
    const batchRes = await fetch('http://localhost:5000/api/inventory/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({
        itemId,
        quantity: 1,
        expiry: rawForm.value.expiry,
        unitAmount: rawForm.value.unitAmount,
        unitLabel: rawForm.value.unitLabel || currentUnitLabel.value,
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
  productForm.value = { existingItemId: '', name: '', quantity: 1, expiry: '', lowStockThreshold: 1, price: 0, rawMaterials: [] };
  addError.value = '';
  showProductModal.value = true;
}
function addProductRawMaterial() {
  productForm.value.rawMaterials.push({ name: '', perUnitAmount: 0, unit: '' });
}
function removeProductRawMaterial(idx) {
  productForm.value.rawMaterials.splice(idx, 1);
}

// Helpers for unit conversion and stock math
function toBase(amount, unit) {
  if (unit === 'kg') return amount * 1000; // base g
  if (unit === 'g') return amount;
  if (unit === 'L') return amount * 1000; // base ml
  if (unit === 'ml') return amount;
  return amount; // pcs or unitless
}
function sameFamily(u1, u2) {
  const g = ['g', 'kg'];
  const ml = ['ml', 'L'];
  if (!u1 || !u2) return true;
  return (g.includes(u1) && g.includes(u2)) || (ml.includes(u1) && ml.includes(u2)) || (u1 === u2);
}
function getRawByName(name) {
  return inventory.value.find(i => i.type === 'raw' && i.name === name);
}
function getRawStock(rm) {
  const raw = getRawByName(rm.name);
  if (!raw) return { total: 0, unit: rm.unit || '', display: '0' };
  const unit = raw.unit || rm.unit || '';
  const total = raw.batches.reduce((s,b)=> s + (b.quantity || 0), 0);
  return { total, unit, display: `${total} ${unit}`.trim() };
}
function onRmChange(rm){
  const raw = getRawByName(rm.name);
  if (raw && !rm.unit) rm.unit = raw.unit || '';
  recomputeProductQty();
}

function recomputeProductQty(){
  if (!productForm.value.rawMaterials.length) return;
  let possible = Infinity;
  for (const rm of productForm.value.rawMaterials){
    if (!rm.name || !rm.perUnitAmount || rm.perUnitAmount <= 0) continue;
    const raw = getRawByName(rm.name);
    if (!raw) { possible = 0; break; }
    const stock = raw.batches.reduce((s,b)=> s + (b.quantity||0),0);
    const rawUnit = raw.unit || '';
    const useUnit = rm.unit || rawUnit;
    if (!sameFamily(rawUnit, useUnit)) { possible = 0; break; }
    const per = toBase(rm.perUnitAmount, useUnit);
    const available = toBase(stock, rawUnit);
    if (per <= 0) { possible = 0; break; }
    possible = Math.min(possible, Math.floor(available / per));
  }
  if (Number.isFinite(possible) && possible >= 0) {
    productForm.value.quantity = possible;
  }
}
async function submitProduct() {
  addLoading.value = true;
  addError.value = '';
  try {
    if (!productForm.value.expiry) throw new Error('Expiry date is required');
    if (productForm.value.quantity < 1) throw new Error('Quantity must be at least 1');

    let itemId = productForm.value.existingItemId;

    if (!itemId) {
      if (!productForm.value.name) throw new Error('Name is required');
      if (productForm.value.rawMaterials.some(rm => !rm.name || rm.perUnitAmount <= 0)) throw new Error('Each raw material needs an amount per product');
      // compute auto quantity based on available stock
      recomputeProductQty();
      // 1. Create item
      const res = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
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
      itemId = item.id;
    }
    // 2. Add batch
    const batchRes = await fetch('http://localhost:5000/api/inventory/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({
        itemId,
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
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
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
async function discardItem(item) {
  try {
    const label = item?.type === 'raw' ? 'raw material' : 'product';
    if (!item?.id) return;
    if (!confirm(`Are you sure you want to discard this ${label}? This will remove the item and all its batches.`)) return;
    const res = await fetch(`http://localhost:5000/api/inventory/${item.id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      }
    );
    if (!res.ok) {
      let info = {};
      try { info = await res.json(); } catch(_) {}
      const msg = info.error || info.details || `Failed to discard ${label}`;
      alert(msg);
      return;
    }
    await fetchInventory();
  } catch (e) {
    alert(e.message || 'Failed to discard item');
  }
  }

// archive/clear inventory utilities removed per request
async function discardBatch(itemId, batchId) {
  // Always confirm before discarding
  if (confirm('Are you sure you want to discard this batch?')) {
    await fetch(`http://localhost:5000/api/inventory/batch/${batchId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      }
    );
    await fetchInventory();
  }
}

// Archive/unarchive item
async function archiveItem(item) {
  try {
    if (!item?.id) return;
    const toArchive = !item.archived;
    const verb = toArchive ? 'archive' : 'unarchive';
    if (!confirm(`Are you sure you want to ${verb} this item?`)) return;
    const res = await fetch(`http://localhost:5000/api/inventory/${item.id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ archived: toArchive })
    });
    if (!res.ok) {
      let info = {}; try { info = await res.json(); } catch(_) {}
      alert(info.error || `Failed to ${verb} item`);
      return;
    }
    await fetchInventory();
  } catch (e) {
    alert(e.message || 'Failed to update archive status');
  }
}

// Improve item discard error handling with clear messages from server
// Replaces fetch in discardItem to surface 409 reasons.

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
}
</script>

<style scoped>
/* Improve overall text contrast */
.text-gray-400, .text-gray-500, .text-gray-300,
.text-xs, .text-sm, .text-gray-700, .text-gray-600 {
  color: #1f2937 !important; /* slate-800 */
  opacity: 1 !important;
}

/* Ensure form controls have dark text on light backgrounds */
.input, .input.input-bordered,
.select, .select.select-bordered,
textarea, input, select {
  color: #111827 !important; /* gray-900 */
  background-color: #ffffff !important;
  border-color: #d1d5db !important; /* gray-300 */
}

/* Options inside dropdowns */
select option { color: #111827; }

/* Placeholders readable */
::placeholder { color: #374151 !important; opacity: 1; }

/* Buttons: outline variant readable */
.btn.btn-outline {
  color: #1f2937 !important;
  border-color: #6366f1 !important; /* indigo-500 */
  background-color: #e0e7ff !important; /* indigo-100 */
  font-weight: 700 !important;
}

/* Tags/badges in cards */
.bg-white div, .bg-white span { color: #1f2937 !important; }
</style>

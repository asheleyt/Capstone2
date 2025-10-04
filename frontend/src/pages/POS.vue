<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-56 bg-gray-200 flex flex-col justify-between py-6 px-4">
      <div>
        <nav>
          <button 
            class="flex items-center space-x-2 mb-4 text-black hover:underline" 
            @click="toggleOrderHistory"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
            <span>{{ showOrderHistory ? 'Hide' : 'Show' }} Order History</span>
          </button>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="flex items-center justify-between bg-white px-8 py-4 shadow">
        <div class="flex items-center space-x-3">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>
          <span class="text-xl font-semibold text-gray-800">Welcome, Cashier</span>
        </div>
        <div class="flex-1 mx-8">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search products..." 
            class="input input-bordered w-full" 
            @input="filterProducts"
          />
        </div>
        <div class="flex space-x-3 items-center">
          <button @click="printHello" class="btn">Print Hello</button>
          <button @click="handleLogout" class="btn ml-4">Logout</button>
        </div>
      </header>

      <!-- Filters -->
      <div class="flex space-x-4 px-8 py-4 bg-gray-50">
        <button 
          @click="setFilter('all')" 
          :class="['btn', currentFilter === 'all' ? 'btn-primary' : '']"
        >
          ALL
        </button>
        <button 
          v-for="category in productCategories" 
          :key="category"
          @click="setFilter(category)" 
          :class="['btn', currentFilter === category ? 'btn-primary' : '']"
        >
          {{ category.toUpperCase() }}
        </button>
      </div>

      <!-- Main Grid -->
      <div class="flex-1 grid grid-cols-12 gap-6 px-8 py-6">
        <!-- Product Grid -->
        <div class="col-span-8 grid grid-cols-4 gap-6">
          <!-- Loading State -->
          <div v-if="loading" class="col-span-4 flex items-center justify-center h-64">
            <div class="text-center">
              <div class="loading loading-spinner loading-lg"></div>
              <p class="mt-4 text-gray-600">Loading products...</p>
    </div>
  </div>

  <!-- Discount Modal -->
  <div v-if="showDiscountModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded shadow-lg w-96 p-4">
      <div class="text-lg font-semibold mb-2 text-gray-800">SC/PWD Discount</div>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-700">Total Customers</label>
          <input v-model.number="totalCustomers" type="number" min="0" class="input input-bordered input-sm w-full" />
        </div>
        <div>
          <label class="block text-xs text-gray-700">SC/PWD Count</label>
          <input v-model.number="scPwdCount" type="number" min="0" class="input input-bordered input-sm w-full" />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn btn-outline" @click="showDiscountModal = false">Cancel</button>
        <button class="btn btn-primary" @click="showDiscountModal = false">Apply</button>
      </div>
    </div>
  </div>

          <!-- Error State -->
          <div v-else-if="error" class="col-span-4 flex items-center justify-center h-64">
            <div class="text-center">
              <div class="text-red-500 text-xl mb-2">⚠️</div>
              <p class="text-red-600">{{ error }}</p>
              <button @click="fetchProducts" class="btn btn-primary mt-4">Retry</button>
            </div>
          </div>
          
          <!-- No Products State -->
          <div v-else-if="filteredProducts.length === 0" class="col-span-4 flex items-center justify-center h-64">
            <div class="text-center">
              <div class="text-gray-400 text-xl mb-2">📦</div>
              <p class="text-gray-600">No products found</p>
              <p class="text-sm text-gray-500 mt-2">Add products in the admin dashboard</p>
            </div>
          </div>
          
          <!-- Products -->
          <div 
            v-else
            v-for="product in filteredProducts" 
            :key="product.id" 
            @click="addToCart(product)"
            class="bg-gray-200 rounded-lg flex flex-col items-center justify-center h-48 relative cursor-pointer hover:bg-gray-300 transition-colors"
            :class="{ 'opacity-50': product.current_stock <= 0 }"
          >
            <div class="w-20 h-20 border-2 border-gray-400 bg-white flex items-center justify-center mb-2">
              <!-- Placeholder for product image -->
              <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 17l6-6 4 4 8-8"/></svg>
            </div>
            <span class="text-lg font-semibold text-gray-800 text-center px-2">{{ product.name }}</span>
            <span class="text-sm text-gray-600">₱{{ getProductPrice(product) }}</span>
            <span class="absolute bottom-2 right-3 text-xs text-gray-800">
              stock: {{ product.current_stock }}
            </span>
            <div v-if="product.current_stock <= 0" class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
              OUT OF STOCK
            </div>
          </div>
        </div>

        <!-- Current Order -->
        <div class="col-span-4 bg-white rounded-lg shadow p-6 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">Current Order</h2>
            <button @click="setOrderType('take-out')" :class="['btn', orderType === 'take-out' ? 'btn-primary' : '']">Take out</button>
          </div>
          
          <!-- Cart Items -->
          <div class="space-y-3 mb-6 flex-1 overflow-y-auto">
            <div v-for="item in cart" :key="item.id" class="flex items-center justify-between bg-gray-100 rounded p-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div>
                  <div class="font-semibold text-gray-800">{{ item.name }}</div>
                  <div class="text-xs text-gray-700">{{ item.quantity }}x</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button @click="updateQuantity(item.id, 1)" class="btn btn-square btn-sm">+</button>
                <span>{{ item.quantity }}</span>
                <button @click="updateQuantity(item.id, -1)" class="btn btn-square btn-sm">-</button>
              </div>
              <span class="font-bold">₱{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
            <div v-if="cart.length === 0" class="text-center text-gray-500 py-8">
              No items in cart
            </div>
          </div>

          <!-- Order Notes & Table Number -->
          <div class="mb-4 flex flex-col gap-2">
            <div class="flex items-center justify-between mb-1">
              <div class="text-xs font-semibold text-gray-800">ORDER NOTES</div>
              <div v-if="orderNotes.trim()" class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span class="text-xs text-blue-600 font-medium">Has notes</span>
              </div>
            </div>
            <textarea 
              v-model="orderNotes" 
              placeholder="Add special instructions, allergies, or cooking preferences..."
              class="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              rows="2"
              maxlength="200"
            ></textarea>
            <div class="flex justify-between items-center mt-1">
              <span class="text-xs text-gray-500">Special instructions for kitchen staff</span>
              <div class="flex items-center space-x-2">
                <button 
                  v-if="orderNotes.trim()" 
                  @click="orderNotes = ''" 
                  class="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Clear notes
                </button>
                <span class="text-xs text-gray-400">{{ orderNotes.length }}/200</span>
              </div>
            </div>
            <!-- Table Number Input (only for dine-in) with Same Table override -->
            <div v-if="orderType === 'dine-in'" class="flex items-center gap-2 mt-2">
              <template v-if="!sameTableMode">
                <label class="text-xs font-semibold text-gray-800" for="tableNumber">Table #</label>
                <input id="tableNumber" v-model="tableNumber" type="text" placeholder="Enter table number" class="input input-bordered input-sm w-40 text-xs" />
                <button class="btn btn-xs" @click="sameTableMode = true">Same table</button>
              </template>
              <template v-else>
                <button class="btn btn-xs" @click="sameTableMode = false">Cancel</button>
                <label class="text-xs font-semibold text-gray-800">Same Table</label>
                <input v-model="sameTableNumber" type="text" placeholder="Enter existing table #" class="input input-bordered input-sm w-40 text-xs" />
              </template>
            </div>
          </div>

          <!-- Payment Type -->
          <div class="mb-6">
            <div class="text-xs font-semibold mb-2 text-gray-800">PAYMENT TYPE</div>
            <div class="flex space-x-3 mb-2">
              <button 
                v-for="method in paymentMethods" 
                :key="method"
                @click="selectedPaymentMethod = method"
                :class="[
                  'px-3 py-1 rounded font-bold',
                  selectedPaymentMethod === method 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800'
                ]"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="bg-gray-100 rounded p-4 mb-4 text-sm">
            <div class="flex justify-between mb-1 text-gray-800">
              <span>Total amount receive</span>
              <span class="font-bold">₱{{ totalAmountReceived.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between mb-1 text-gray-800">
              <span>Subtotal</span>
              <span>₱{{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between mb-1 text-gray-800">
              <span>Discount</span>
              <span>₱{{ discount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between mb-1 text-gray-800">
              <span>VAT</span>
              <span>₱{{ vatAmount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between mb-1 text-gray-800">
              <span>Change</span>
              <span>₱{{ change.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between mt-2 text-lg font-bold text-gray-800">
              <span>TOTAL</span>
              <span>₱{{ total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2 mt-auto">
            <div class="flex space-x-2 mb-2">
              <button @click="setOrderType('dine-in')" :class="['btn', orderType === 'dine-in' ? 'btn-primary' : '']">Dine in</button>
              <button @click="setOrderType('take-out')" :class="['btn', orderType === 'take-out' ? 'btn-primary' : '']">Take out</button>
              <button class="btn" @click="showDiscountModal = true">Discount</button>
            </div>
            <div class="flex space-x-2">
              <button @click="clearCart" class="btn btn-outline text-red-600 border-red-600 font-bold bg-white hover:bg-red-50">Clear Cart</button>
              <button @click="checkout" :disabled="cart.length === 0" class="btn btn-primary">Checkout</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collapsible Order History Panel -->
    <div 
      v-if="showOrderHistory" 
      class="fixed left-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50"
      :class="showOrderHistory ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-800">Order History</h3>
        <button @click="toggleOrderHistory" class="text-gray-500 hover:text-gray-700">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <!-- Removed reference/new-order (no table) controls as requested -->
      
      <div class="p-4 overflow-y-auto h-full">
        <div v-if="orderHistoryLoading" class="text-center py-8">
          <div class="loading loading-spinner loading-md"></div>
          <p class="mt-2 text-gray-600">Loading orders...</p>
        </div>
        
        <div v-else-if="orderHistoryError" class="text-center py-8">
          <div class="text-red-500 text-xl mb-2">⚠️</div>
          <p class="text-red-600">{{ orderHistoryError }}</p>
          <button @click="fetchOrderHistory" class="btn btn-primary mt-4">Retry</button>
        </div>
        
        <div v-else-if="orderHistory.length === 0" class="text-center py-8">
          <div class="text-gray-400 text-xl mb-2">📋</div>
          <p class="text-gray-600">No orders yet</p>
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="order in orderHistory" 
            :key="order.id" 
            class="bg-gray-50 rounded-lg p-3 border-l-4"
            :class="{
              'border-blue-500': order.status === 'pending',
              'border-yellow-500': order.status === 'preparing',
              'border-green-500': order.status === 'ready',
              'border-gray-500': order.status === 'completed',
              'border-red-500': order.status === 'cancelled'
            }"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold text-gray-800">#{{ order.order_number }}</span>
              <span 
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800': order.status === 'pending',
                  'bg-yellow-100 text-yellow-800': order.status === 'preparing',
                  'bg-green-100 text-green-800': order.status === 'ready',
                  'bg-gray-100 text-gray-800': order.status === 'completed',
                  'bg-red-100 text-red-800': order.status === 'cancelled'
                }"
              >
                {{ order.status }}
              </span>
            </div>
            <div class="flex gap-2 mb-2" v-if="order.status === 'pending'">
              <button class="btn btn-xs btn-error" @click="voidOrder(order)">Void</button>
              <button class="btn btn-xs btn-primary" @click="openEditOrderModal(order)">Edit</button>
            </div>
            
            <div class="text-sm text-gray-600 mb-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span>{{ order.order_type }}</span>
                  <span>• {{ order.payment_method }}</span>
                </div>
                <div v-if="order.table_number || order.tableNumber" class="text-gray-800 font-bold text-xl">Table {{ order.table_number || order.tableNumber }}</div>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ new Date(order.created_at).toLocaleString() }}
              </div>
            </div>
            
            <div class="space-y-1 mb-2">
              <div v-for="item in order.items" :key="item.id" class="text-sm">
                <span class="text-gray-800">{{ item.quantity }}x {{ item.product_name }}</span>
                <span class="text-gray-600 ml-2">₱{{ item.total_price }}</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="font-semibold text-gray-800">₱{{ order.total }}</span>
            </div>
            
            <div v-if="order.notes" class="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Notes:</strong> {{ order.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 w-[28rem] relative text-black">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-black" @click="showEditModal = false">&times;</button>
        <h2 class="text-xl font-bold mb-4">Edit Order #{{ selectedOrder?.order_number }}</h2>
        <form @submit.prevent="submitEditOrder">
          <div class="mb-3" v-if="selectedOrder?.order_type === 'dine-in'">
            <label class="block text-sm font-semibold mb-1">Table #</label>
            <input 
              type="text" 
              v-model="editTableNumber" 
              placeholder="Enter new table number"
              class="input input-bordered w-40 text-white bg-gray-900"
            />
          </div>
          <div v-for="(item, idx) in editOrderItems" :key="item.id" class="flex items-center gap-2 mb-2">
            <span class="flex-1">{{ item.product_name }}</span>
            <input type="number" v-model.number="item.quantity" min="1" class="input input-bordered w-20 text-white bg-gray-900" />
            <span>₱{{ item.unit_price }}</span>
            <button type="button" class="btn btn-xs btn-error" @click="removeEditOrderItem(idx)">&times;</button>
          </div>
          <div class="mb-3 flex gap-2 items-end">
            <div class="flex-1">
              <label class="block text-sm font-semibold mb-1">Add Item</label>
              <select v-model="selectedAddProductId" class="select select-bordered w-full text-white bg-gray-900">
                <option value="" disabled>Select product</option>
                <option v-for="product in productsNotInEditOrder" :key="product.id" :value="product.id">{{ product.name }}</option>
              </select>
            </div>
            <button type="button" class="btn btn-primary" @click="addProductToEditOrder" :disabled="!selectedAddProductId">Add</button>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-semibold mb-1">Notes</label>
            <textarea v-model="editOrderNotes" class="input input-bordered w-full text-white bg-gray-900" rows="2"></textarea>
          </div>
          <div v-if="editOrderError" class="text-red-500 text-sm mb-2">{{ editOrderError }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="editOrderLoading">
            {{ editOrderLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useOrders } from '../composables/useOrders';
import { printReceiptBrowser, printReceipt, printTextBrowser, printText } from '../composables/usePrinter';

const router = useRouter();
const products = ref([]);
const filteredProducts = ref([]);
const cart = ref([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const currentFilter = ref('all');
const selectedPaymentMethod = ref('Cash');
const orderType = ref('dine-in');
const totalAmountReceived = ref(0);
const orderNotes = ref('');
const tableNumber = ref('');
// Special case: allow placing a dine-in order without assigning a table number
const allowNoTableNextOrder = ref(false);
const noTableReference = ref('');

// Order History
const showOrderHistory = ref(false);
const sameTableMode = ref(false);
const sameTableNumber = ref("");
  const showDiscountModal = ref(false);
const { orders: orderHistory, loading: orderHistoryLoading, error: orderHistoryError, fetchOrders: fetchOrderHistory } = useOrders();

// Quick test print using window.print with fallback to local service
async function printHello() {
  let printed = false;
  try {
    await printTextBrowser('Hello from the POS!', { title: 'Test Print' });
    printed = true;
  } catch (browserErr) {
    console.warn('Browser print failed, falling back to printer service', browserErr);
    try {
      await printText('Hello from the POS!');
      printed = true;
    } catch (serviceErr) {
      console.error('Print failed', serviceErr);
      alert('Print failed: ' + (serviceErr?.message || serviceErr));
    }
  }
  if (printed) {
    alert('Print dialog opened. Select your thermal printer if prompted.');
  }
}

// Payment methods
const paymentMethods = ['Cash', 'maya', 'GCash'];

// Product categories (you can modify this based on your needs)
const productCategories = ['Food', 'Beverage', 'Dessert'];

// Note templates for quick access
const noteTemplates = [
  'No onions',
  'Extra spicy',
  'Mild spice',
  'No rice',
  'Extra rice',
  'To go',
  'For here',
  'Allergy: nuts',
  'Allergy: seafood',
  'Well done',
  'Medium rare',
  'Extra sauce',
  'No sauce'
];

async function fetchProducts() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('http://localhost:5000/api/inventory/pos');
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    console.log('Fetched products:', data); // Debug log
    products.value = data;
    filteredProducts.value = data;
  } catch (e) {
    console.error('Error fetching products:', e); // Debug log
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function filterProducts() {
  let filtered = products.value;
  
  // Apply search filter
  if (searchQuery.value) {
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  // Apply category filter
  if (currentFilter.value !== 'all') {
    filtered = filtered.filter(product => {
      const name = product.name.toLowerCase();
      if (currentFilter.value === 'food') {
        return name.includes('adobo') || name.includes('sinigang') || 
               name.includes('sisig') || name.includes('paksiw') || 
               name.includes('pancit') || name.includes('rice');
      } else if (currentFilter.value === 'beverage') {
        return name.includes('coke') || name.includes('sprite') || 
               name.includes('beer') || name.includes('san miguel');
      } else if (currentFilter.value === 'dessert') {
        return name.includes('halo') || name.includes('flan') || 
               name.includes('turon');
      }
      return true;
    });
  }
  
  filteredProducts.value = filtered;
}

function setFilter(filter) {
  currentFilter.value = filter;
  filterProducts();
}

function getProductPrice(product) {
  // Use the price from the database, fallback to 100 if not set
  return product.price || 100.00;
}

function addToCart(product) {
  if (product.current_stock <= 0) return;
  
  const existingItem = cart.value.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: parseFloat(getProductPrice(product)),
      quantity: 1
    });
  }
}

function updateQuantity(itemId, change) {
  const item = cart.value.find(item => item.id === itemId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      cart.value = cart.value.filter(item => item.id !== itemId);
    }
  }
}

function clearCart() {
  cart.value = [];
  totalAmountReceived.value = 0;
  orderNotes.value = '';
  tableNumber.value = '';
  allowNoTableNextOrder.value = false;
  noTableReference.value = '';
}

function setOrderType(type) {
  orderType.value = type;
  if (type === 'take-out') tableNumber.value = '';
}

function startNoTableOrder() {
  orderType.value = 'dine-in';
  allowNoTableNextOrder.value = true;
}

function addNoteTemplate(template) {
  if (orderNotes.value.trim()) {
    // If there are already notes, add the template with a separator
    orderNotes.value += `, ${template}`;
  } else {
    // If no notes yet, just add the template
    orderNotes.value = template;
  }
}

async function checkout() {
  if (cart.value.length === 0) return;
  if (
    orderType.value === 'dine-in'
    && !sameTableMode.value
    && !tableNumber.value.trim()
  ) {
    alert('Please enter a table number for dine-in orders.');
    return;
  }
  if (
    orderType.value === 'dine-in'
    && sameTableMode.value
    && !sameTableNumber.value.trim()
  ) {
    alert('Please enter the same table number.');
    return;
  }
  // Create order object with notes and table number
  const notesToSend = `${orderNotes.value.trim()}`.trim();
  // Snapshot cart now for printing (before we clear it)
  const cartSnapshot = cart.value.map(i => ({
    name: i.name,
    qty: i.quantity,
    price: i.price
  }));

  const itemsPayload = cart.value.map(i => ({
    product_id: Number(i.id),
    quantity: Number(i.quantity),
    price: Number(i.price)
  }));

  // Some backends expect `order_items` specifically
  const orderItemsPayload = itemsPayload.map(it => ({ ...it }));

  // Backend createOrder expects camelCase keys and item fields: id,name,quantity,price
  const order = {
    items: cart.value.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
    paymentMethod: selectedPaymentMethod.value,
    orderType: orderType.value,
    tableNumber: orderType.value === 'dine-in'
      ? (sameTableMode.value
          ? (sameTableNumber.value || '').trim()  // ensure table shown in history
          : (tableNumber.value || '').trim())
      : '',
    sameTableNumber: sameTableMode.value ? (sameTableNumber.value || '').trim() : '',
    sameTableOverride: Boolean(sameTableMode.value),
    notes: notesToSend,
    subtotal: Number(subtotal.value),
    discount: Number(discount.value),
    vat: Number(vatAmount.value),
    total: Number(total.value),
    totalCustomers: Number(totalCustomers.value || 0),
    pwdCount: Number(pwdCount.value || 0),
    seniorCount: Number(seniorCount.value || 0),
    amountReceived: Number(totalAmountReceived.value || 0),
    changeAmount: Number(change.value || 0)
  };
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You are not logged in. Please log in again.');
      router.push('/login');
      return;
    }
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(order)
    });
    if (!response.ok) {
      let serverMsg = 'Unknown error';
      try {
        const data = await response.json();
        serverMsg = data?.error || data?.message || JSON.stringify(data);
      } catch (_) {
        try { serverMsg = await response.text(); } catch {}
      }
      console.error('Order creation failed:', response.status, serverMsg);
      if (response.status === 409) {
        if (/Order number conflict/i.test(serverMsg)) {
          alert('Order number conflict. Retrying once...');
          // quick retry once
          const retry = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(order)
          });
          if (!retry.ok) {
            const t = await retry.json().catch(()=>({}));
            alert(`Checkout failed (${retry.status}).\n${t?.error || 'Please try again.'}`);
            return;
          }
        } else if (/Table conflict|occupied|open order/i.test(serverMsg)) {
          if (confirm('Table is occupied or has an open order. Use Same Table override?')) {
            order.sameTableOverride = true;
            order.sameTableNumber = order.tableNumber;
            const retry = await fetch(`${BASE_URL}/api/orders`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(order)
            });
            if (!retry.ok) {
              const t = await retry.json().catch(()=>({}));
              alert(`Checkout failed (${retry.status}).\n${t?.error || 'Please try again.'}`);
              return;
            }
            response = retry;
          } else {
            alert('Please change the table number and try again.');
            return;
          }
        } else {
          alert(`Checkout failed (${response.status}).\n${serverMsg}`);
          return;
        }
      } else {
        alert(`Checkout failed (${response.status}).\n${serverMsg}`);
        return;
      }
    }
    const result = await response.json();
    console.log('Order created:', result);
    // Show success message with order number, table, and notes
    const tableText = order.tableNumber ? `\nTable: ${order.tableNumber}` : '';
    
    // Print receipt to 58mm thermal via browser
    try {
      await printReceiptBrowser({
        header: 'Receipt',
        businessName: '',
        orderNumber: result?.order_number || String(result?.id || ''),
        tableNumber: order.tableNumber,
        notes: order.notes,
        items: cartSnapshot,
        subtotal: subtotal.value,
        discount: discount.value,
        vat: vatAmount.value,
        total: total.value,
        paymentMethod: selectedPaymentMethod.value,
        amountReceived: totalAmountReceived.value,
        changeAmount: change.value,
        timestamp: result?.created_at || new Date(),
        footerLines: ['Thank you!']
      });
    } catch (printErr) {
      console.warn('Browser receipt print failed:', printErr);
      // Fallback to local printer service if browser print fails
      try {
        await printReceipt({
          header: `Order #${result?.order_number || result?.id || ''}`,
          items: cartSnapshot,
          total: total.value,
        });
      } catch (serviceErr) {
        console.error('Service receipt print failed:', serviceErr);
      }
    }
    const notesText = order.notes ? `\nNotes: ${order.notes}` : '';
    alert(`Order #${result.order_number} placed successfully!${tableText}${notesText}`);
    clearCart();
    tableNumber.value = '';
    // Reset discount-related inputs so next order doesn't carry over
    totalCustomers.value = 0;
    pwdCount.value = 0;
    seniorCount.value = 0;
    showDiscountModal.value = false;
    // Signal tables page to refresh immediately
    try { localStorage.setItem('tables_refresh', String(Date.now())); } catch (_) {}
    
    // Refresh order history if it's open
    if (showOrderHistory.value) {
      await fetchOrderHistory();
    }
    // Reset no-table mode after a successful order
    // Reset same-table mode
    sameTableMode.value = false;
    sameTableNumber.value = '';
  } catch (error) {
    console.error('Error creating order:', error);
    alert(`Failed to place order. ${error?.message || ''}`.trim());
  }
}

// Computed properties
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Inputs for counts
const totalCustomers = ref(0);
const pwdCount = ref(0);
  const seniorCount = ref(0);
  const scPwdCount = computed({
    get: () => (Number(pwdCount.value||0) + Number(seniorCount.value||0)),
    set: (v) => {
      // split into pwd and senior in a neutral way (all in pwd)
      pwdCount.value = Number(v)||0;
      seniorCount.value = 0;
    }
  });

// Config
const VAT_RATE = 0.12;
const DISCOUNT_RATE = 0.20; // 20% for PWD/Senior on VAT-exempt base

// Compute discount per PWD/Senior head sharing equally in the bill
const discount = computed(() => {
  const eligibleHeads = Math.max(0, Number(pwdCount.value || 0) + Number(seniorCount.value || 0));
  const heads = Math.max(1, Number(totalCustomers.value || 0));
  if (eligibleHeads <= 0 || subtotal.value <= 0) return 0;
  const perHeadGross = subtotal.value / heads;
  const perHeadVatExempt = perHeadGross / (1 + VAT_RATE);
  const perHeadDiscount = perHeadVatExempt * DISCOUNT_RATE;
  return perHeadDiscount * eligibleHeads;
});

const vatAmount = computed(() => {
  const heads = Math.max(1, Number(totalCustomers.value || 0));
  const eligibleHeads = Math.max(0, Number(pwdCount.value || 0) + Number(seniorCount.value || 0));
  const nonEligibleHeads = Math.max(0, heads - eligibleHeads);
  if (subtotal.value <= 0) return 0;
  const perHeadGross = subtotal.value / heads;
  const nonEligibleGross = perHeadGross * nonEligibleHeads;
  const baseForVat = nonEligibleGross / (1 + VAT_RATE);
  return baseForVat * VAT_RATE;
});

const total = computed(() => {
  const heads = Math.max(1, Number(totalCustomers.value || 0));
  if (subtotal.value <= 0 || heads <= 0) return 0;
  const eligibleHeads = Math.max(0, Number(pwdCount.value || 0) + Number(seniorCount.value || 0));
  const perHeadGross = subtotal.value / heads;
  const eligibleGross = perHeadGross * eligibleHeads;
  const eligibleBase = eligibleGross / (1 + VAT_RATE);
  const eligibleAfterDiscount = eligibleBase * (1 - DISCOUNT_RATE);
  const nonEligibleGross = subtotal.value - eligibleGross;
  const nonEligibleBase = nonEligibleGross / (1 + VAT_RATE);
  const nonEligibleVat = nonEligibleBase * VAT_RATE;
  return eligibleAfterDiscount + nonEligibleBase + nonEligibleVat;
});

const change = computed(() => {
  return totalAmountReceived.value - total.value;
});

function handleLogout() {
  localStorage.removeItem('user');
  router.push('/login');
}

function goToOrderHistory() {
  router.push('/cashier/order-history');
}

function toggleOrderHistory() {
  showOrderHistory.value = !showOrderHistory.value;
  if (showOrderHistory.value && orderHistory.value.length === 0) {
    fetchOrderHistory();
  }
}

const showEditModal = ref(false);
const selectedOrder = ref(null);
const editOrderItems = ref([]);
const editOrderNotes = ref('');
const editTableNumber = ref('');
const editOrderLoading = ref(false);
  const editOrderError = ref('');
const selectedAddProductId = ref("");
const productsNotInEditOrder = computed(() => {
  const ids = editOrderItems.value.map(i => i.product_id || i.id);
  return products.value.filter(p => !ids.includes(p.id));
});
function addProductToEditOrder() {
  const product = products.value.find(p => p.id === Number(selectedAddProductId.value));
  if (!product) return;
  editOrderItems.value.push({
    id: product.id,
    product_id: product.id,
    product_name: product.name,
    unit_price: product.price,
    quantity: 1
  });
  selectedAddProductId.value = "";
}
function removeEditOrderItem(idx) {
  editOrderItems.value.splice(idx, 1);
}

async function voidOrder(order) {
  const password = prompt('Enter admin password to void this sale:');
  if (!password) return;
  try {
    const res = await fetch(`http://localhost:5000/api/orders/${order.id}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('Failed to void order.');
    alert('Order voided successfully.');
    fetchOrderHistory();
  } catch (e) {
    alert(e.message);
  }
}

function openEditOrderModal(order) {
  selectedOrder.value = order;
  // Deep copy items to avoid mutating original order until save
  editOrderItems.value = order.items.map(i => ({ ...i }));
  editOrderNotes.value = order.notes || '';
  editTableNumber.value = order.table_number || '';
  editOrderError.value = '';
  showEditModal.value = true;
}

async function submitEditOrder() {
  editOrderLoading.value = true;
  editOrderError.value = '';
  try {
    const requestData = {
      items: editOrderItems.value.map(i => ({ 
        id: i.id, 
        product_id: i.product_id || i.id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price
      })),
      notes: editOrderNotes.value,
      table_number: selectedOrder.value?.order_type === 'dine-in' ? (editTableNumber.value || '').trim() : null
    };
    
    console.log('Sending edit order request:', {
      orderId: selectedOrder.value.id,
      data: requestData
    });
    
    const res = await fetch(`http://localhost:5000/api/orders/${selectedOrder.value.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update order');
    }
    alert('Order updated successfully.');
    showEditModal.value = false;
    fetchOrderHistory();
    // Signal tables page to refresh immediately
    try { localStorage.setItem('tables_refresh', String(Date.now())); } catch (_) {}
  } catch (e) {
    editOrderError.value = e.message;
  } finally {
    editOrderLoading.value = false;
  }
}

onMounted(fetchProducts);
</script> 

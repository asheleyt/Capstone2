<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-56 bg-gray-200 flex flex-col justify-between py-6 px-4">
      <div>
        <nav>
          <button class="flex items-center space-x-2 mb-4 text-black hover:underline">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
            <span>Order History</span>
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
            <button class="btn">Add-On</button>
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
              <span>Discount tax</span>
              <span>₱{{ discount.toFixed(2) }}</span>
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
              <button class="btn">Discount</button>
            </div>
            <div class="flex space-x-2">
              <button @click="clearCart" class="btn btn-outline text-red-600 border-red-600 font-bold bg-white hover:bg-red-50">Clear Cart</button>
              <button @click="checkout" :disabled="cart.length === 0" class="btn btn-primary">Checkout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

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

// Payment methods
const paymentMethods = ['Cash', 'maya', 'GCash', 'Card'];

// Product categories (you can modify this based on your needs)
const productCategories = ['Food', 'Beverage', 'Dessert'];

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
}

function setOrderType(type) {
  orderType.value = type;
}

function checkout() {
  if (cart.value.length === 0) return;
  
  // Here you would implement the actual checkout logic
  // For now, just show an alert
  alert('Order placed successfully!');
  clearCart();
}

// Computed properties
const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const discount = computed(() => {
  return 0; // You can implement discount logic here
});

const total = computed(() => {
  return subtotal.value - discount.value;
});

const change = computed(() => {
  return totalAmountReceived.value - total.value;
});

function handleLogout() {
  localStorage.removeItem('user');
  router.push('/login');
}

onMounted(fetchProducts);
</script> 
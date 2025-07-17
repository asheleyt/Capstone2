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
      <button @click="handleLogout" class="flex items-center space-x-2 text-black hover:underline">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7"/></svg>
        <span>Logout</span>
      </button>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="flex items-center justify-between bg-white px-8 py-4 shadow">
        <div class="flex items-center space-x-3">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>
          <span class="text-xl font-semibold">Welcome, Cashier</span>
        </div>
        <div class="flex-1 mx-8">
          <input type="text" placeholder="Search" class="input input-bordered w-full" />
        </div>
        <div class="flex space-x-3 items-center">
          <button class="btn">Dine in</button>
          <button class="btn">Take out</button>
          <button class="btn">Discount</button>
          <button @click="handleLogout" class="btn ml-4">Logout</button>
        </div>
      </header>

      <!-- Filters -->
      <div class="flex space-x-4 px-8 py-4 bg-gray-50">
        <button class="btn">ALL</button>
        <button class="btn">PRODUCT</button>
        <button class="btn">PRODUCT</button>
        <button class="btn">PRODUCT</button>
        <button class="btn">PRODUCT</button>
      </div>

      <!-- Main Grid -->
      <div class="flex-1 grid grid-cols-12 gap-6 px-8 py-6">
        <!-- Product Grid -->
        <div class="col-span-8 grid grid-cols-3 gap-6">
          <div v-for="n in 9" :key="n" class="bg-gray-200 rounded-lg flex flex-col items-center justify-center h-48 relative">
            <div class="w-20 h-20 border-2 border-gray-400 bg-white flex items-center justify-center mb-2">
              <!-- Placeholder for product image -->
              <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 17l6-6 4 4 8-8"/></svg>
            </div>
            <span class="text-lg font-semibold">₱150.50</span>
            <span class="absolute bottom-2 right-3 text-xs text-gray-700">stock: 12</span>
          </div>
        </div>

        <!-- Current Order -->
        <div class="col-span-4 bg-white rounded-lg shadow p-6 flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold">Current Order</h2>
            <button class="btn">Add-On</button>
          </div>
          <div class="space-y-3 mb-6">
            <div v-for="item in 3" :key="item" class="flex items-center justify-between bg-gray-100 rounded p-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div>
                  <div class="font-semibold">Product {{ String.fromCharCode(64 + item) }}</div>
                  <div class="text-xs text-gray-500">{{ item }}x</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button class="btn btn-square">+</button>
                <span>1</span>
                <button class="btn btn-square">-</button>
              </div>
              <span class="font-bold">₱{{ (item * 110.98).toFixed(2) }}</span>
            </div>
          </div>
          <div class="mb-6">
            <div class="text-xs font-semibold mb-2">PAYMENT TYPE</div>
            <div class="flex space-x-3 mb-2">
              <button class="bg-gray-200 p-2 rounded"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M2 9h20"/></svg></button>
              <button class="bg-gray-200 p-2 rounded"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M2 9h20"/></svg></button>
              <button class="bg-green-200 text-green-800 px-3 py-1 rounded font-bold">maya</button>
              <button class="bg-blue-200 text-blue-800 px-3 py-1 rounded font-bold">GCash</button>
            </div>
          </div>
          <div class="bg-gray-100 rounded p-4 mb-4 text-sm">
            <div class="flex justify-between mb-1"><span>Total amount receive</span><span class="font-bold">₱527.92</span></div>
            <div class="flex justify-between mb-1"><span>Subtotal</span><span>₱0.00</span></div>
            <div class="flex justify-between mb-1"><span>Discount tax</span><span>₱0.00</span></div>
            <div class="flex justify-between mb-1"><span>Change</span><span>₱0.00</span></div>
            <div class="flex justify-between mt-2 text-lg font-bold"><span>TOTAL</span><span>₱578.18</span></div>
          </div>
          <div class="flex space-x-2 mt-auto">
            <button class="btn btn-outline">Clear Cart</button>
            <button class="btn btn-primary">Checkout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
function handleLogout() {
  localStorage.removeItem('user');
  router.push('/login');
}
// Placeholder for future logic
</script> 
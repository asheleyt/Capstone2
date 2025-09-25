<template>
  <div class="min-h-screen bg-gray-100 text-gray-900 p-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Server Tables</h1>
        <div class="flex items-center gap-2">
          <button class="text-red-500 hover:underline px-4 py-2 bg-black text-white rounded font-bold" style="color: rgb(255, 255, 255) " @click="logout">Logout</button>
        </div>
      </div>
      <div class="grid grid-cols-5 md:grid-cols-8 gap-4">
        <div v-for="t in tables" :key="t.table_number"
             class="rounded-lg p-4 text-center font-bold cursor-pointer select-none border-2"
             :class="t.status === 'available' ? 'bg-green-200 border-green-400' : 'bg-red-200 border-red-400'"
             @click="toggle(t.table_number)">
          <div class="text-2xl">{{ t.table_number }}</div>
          <div class="text-xs uppercase">{{ t.status }}</div>
        </div>
      </div>
      <div v-if="error" class="mt-4 text-red-600">{{ error }}</div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const tables = ref([]);
const error = ref('');
let intervalId = null;
let storageHandler = null;

async function fetchTables() {
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/tables', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load tables');
    tables.value = await res.json();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggle(tableNumber) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/tables/${tableNumber}/toggle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to toggle table');
    await fetchTables();
  } catch (e) {
    error.value = e.message;
  }
}

function logout() { localStorage.removeItem('user'); localStorage.removeItem('token'); router.push('/login'); }

onMounted(() => {
  fetchTables();
  intervalId = setInterval(fetchTables, 3000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.btn { @apply px-3 py-1 rounded bg-gray-200 hover:bg-gray-300; }
</style>



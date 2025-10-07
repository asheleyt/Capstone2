<template>
  <div class="min-h-screen bg-gray-50">
    <AdminNavbar @show-calendar="showCalendar = true" />
    <!-- Calendar Popup (standardized) -->
    <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]" @click.self="showCalendar = false">
      <div class="relative">
        <button class="absolute top-2 right-2 text-gray-300 hover:text-white z-10" @click="showCalendar = false">&times;</button>
        <CalendarPopup v-model="selectedDate" />
      </div>
    </div>
    <!-- Main Content -->
    <div class="p-6">
      <div class="bg-white rounded-lg shadow p-6 border">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-gray-800">Activity Logs</h1>
          <div class="flex items-center space-x-4">
            <!-- Filter by User -->
            <select v-model="selectedUser" @change="filterLogs" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Users</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.username }}</option>
            </select>
            
            <!-- Filter by Action -->
            <select v-model="selectedAction" @change="filterLogs" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create_order">Create Order</option>
              <option value="update_order">Update Order</option>
              <option value="delete_order">Delete Order</option>
              <option value="add_inventory">Add Inventory</option>
              <option value="update_inventory">Update Inventory</option>
              <option value="delete_inventory">Delete Inventory</option>
              <option value="create_user">Create User</option>
              <option value="update_user">Update User</option>
              <option value="delete_user">Delete User</option>
              <option value="download_report">Download Report</option>
            </select>
            
            <!-- Date Range -->
            <div class="flex items-center space-x-2">
              <input 
                v-model="startDate" 
                type="date" 
                @change="filterLogs"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <span class="text-gray-500">to</span>
              <input 
                v-model="endDate" 
                type="date" 
                @change="filterLogs"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
            </div>
            
            <!-- Refresh Button -->
            <button @click="fetchActivityLogs" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Refresh
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600">Loading activity logs...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-600">{{ error }}</p>
          <button @click="fetchActivityLogs" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Try Again
          </button>
        </div>

        <!-- Activity Logs Table -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="log in serverLogs" :key="log.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDateTime(log.timestamp) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div class="flex items-center">
                    <span class="w-6 h-6 bg-gray-200 rounded-full mr-2 flex items-center justify-center text-xs font-semibold">
                      {{ log.user.username.charAt(0).toUpperCase() }}
                    </span>
                    {{ log.user.username }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getActionBadgeClass(log.action)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ log.description }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ log.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Empty State -->
          <div v-if="serverLogs.length === 0" class="text-center py-8">
            <p class="text-gray-500">No activity logs found for the selected filters.</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="serverLogs.length > 0" class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-700 flex items-center space-x-3">
            <span>Showing {{ serverLogs.length }} of {{ pagination.totalItems }} results</span>
            <label class="flex items-center space-x-1">
              <span class="text-gray-500">Per page</span>
              <select v-model.number="itemsPerPage" @change="changePageSize" class="border border-gray-300 rounded-md px-2 py-1">
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>
          </div>
          <div class="flex items-center space-x-2">
            <button 
              @click="goFirst"
              :disabled="pagination.currentPage === 1"
              class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
              :class="{ 'text-gray-700 bg-gray-100 opacity-100 cursor-not-allowed': pagination.currentPage === 1 }"
            >First</button>
            <button 
              @click="goPrev"
              :disabled="!pagination.hasPrevPage"
              class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
              :class="{ 'text-gray-700 bg-gray-100 opacity-100 cursor-not-allowed': !pagination.hasPrevPage }"
            >
              Previous
            </button>
            <span class="px-3 py-1 text-sm text-gray-700">
              Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
            </span>
            <button 
              @click="goNext"
              :disabled="!pagination.hasNextPage"
              class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
              :class="{ 'text-gray-700 bg-gray-100 opacity-100 cursor-not-allowed': !pagination.hasNextPage }"
            >
              Next
            </button>
            <button 
              @click="goLast"
              :disabled="pagination.currentPage === pagination.totalPages || pagination.totalPages === 0"
              class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
              :class="{ 'text-gray-700 bg-gray-100 opacity-100 cursor-not-allowed': pagination.currentPage === pagination.totalPages || pagination.totalPages === 0 }"
            >Last</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import CalendarPopup from '../components/CalendarPopup.vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import AdminNavbar from '../components/AdminNavbar.vue';

const router = useRouter();
const showCalendar = ref(false);
const selectedDate = ref(null);

// Reactive data
const activityLogs = ref([]);
const serverLogs = ref([]);
const users = ref([]);
const loading = ref(false);
const error = ref('');
const selectedUser = ref('');
const selectedAction = ref('');
const startDate = ref('');
const endDate = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20, hasNextPage: false, hasPrevPage: false });

// Computed properties
const filteredLogs = computed(() => {
  let filtered = activityLogs.value;

  // Filter by user
  if (selectedUser.value) {
    filtered = filtered.filter(log => log.user.id === selectedUser.value);
  }

  // Filter by action
  if (selectedAction.value) {
    filtered = filtered.filter(log => log.action === selectedAction.value);
  }

  // Filter by date range
  if (startDate.value) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startDate.value));
  }
  if (endDate.value) {
    const endDateTime = new Date(endDate.value);
    endDateTime.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter(log => new Date(log.timestamp) <= endDateTime);
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
});

const totalPages = computed(() => {
  let filtered = activityLogs.value;
  if (selectedUser.value) {
    filtered = filtered.filter(log => log.user.id === selectedUser.value);
  }
  if (selectedAction.value) {
    filtered = filtered.filter(log => log.action === selectedAction.value);
  }
  if (startDate.value) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startDate.value));
  }
  if (endDate.value) {
    const endDateTime = new Date(endDate.value);
    endDateTime.setHours(23, 59, 59, 999);
    filtered = filtered.filter(log => new Date(log.timestamp) <= endDateTime);
  }
  return Math.ceil(filtered.length / itemsPerPage.value);
});

// Methods
async function fetchActivityLogs() {
  loading.value = true;
  error.value = '';
  
  try {
    const params = new URLSearchParams();
    if (selectedUser.value) params.set('userId', selectedUser.value);
    if (selectedAction.value) params.set('action', selectedAction.value);
    if (startDate.value) params.set('startDate', startDate.value);
    if (endDate.value) params.set('endDate', endDate.value);
    params.set('page', String(currentPage.value));
    params.set('limit', String(itemsPerPage.value));

    const response = await fetch(`http://localhost:5000/api/activity-logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 204) {
      // No content from server; treat as empty result set
      serverLogs.value = [];
      pagination.value = { currentPage: currentPage.value, totalPages: 1, totalItems: 0, itemsPerPage: itemsPerPage.value, hasNextPage: false, hasPrevPage: currentPage.value > 1 };
      console.warn('Activity logs: server returned 204 No Content');
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }

    const data = await response.json();
    serverLogs.value = data.logs || [];
    pagination.value = data.pagination || pagination.value;
  } catch (err) {
    error.value = err.message;
    console.error('Error fetching activity logs:', err);
  } finally {
    loading.value = false;
  }
}

async function fetchUsers() {
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      users.value = data.users || [];
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

function filterLogs() {
  currentPage.value = 1; // Reset to first page when filtering
  fetchActivityLogs();
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatAction(action) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getActionBadgeClass(action) {
  const classes = {
    'login': 'bg-green-100 text-green-800',
    'logout': 'bg-gray-100 text-gray-800',
    'create_order': 'bg-blue-100 text-blue-800',
    'update_order': 'bg-yellow-100 text-yellow-800',
    'delete_order': 'bg-red-100 text-red-800',
    'add_inventory': 'bg-green-100 text-green-800',
    'update_inventory': 'bg-yellow-100 text-yellow-800',
    'delete_inventory': 'bg-red-100 text-red-800',
    'create_user': 'bg-purple-100 text-purple-800',
    'update_user': 'bg-indigo-100 text-indigo-800',
    'delete_user': 'bg-red-100 text-red-800',
    'download_report': 'bg-cyan-100 text-cyan-800'
  };
  return classes[action] || 'bg-gray-100 text-gray-800';
}

// Navigation functions
function goToDashboard() {
  router.push('/admin/dashboard');
}

function goToInventoryOrders() {
  router.push('/admin/inventory-orders');
}

function goToActivityLogs() {
  router.push('/admin/activity-logs');
}

function goToManageUsers() {
  router.push('/admin/manage-users');
}

const { logout } = useAuth();
async function handleLogout() {
  await logout();
}

async function downloadSalesReport() {
  try {
    const response = await fetch('http://localhost:5000/api/sales/report?reportType=detailed', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading sales report:', error);
    alert('Failed to download sales report. Please try again.');
  }
}

// Initialize
onMounted(() => {
  // Set default date range to last 7 days BEFORE first fetch
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  endDate.value = today.toISOString().split('T')[0];
  startDate.value = weekAgo.toISOString().split('T')[0];

  fetchUsers();
  fetchActivityLogs();
});

watch(currentPage, () => {
  fetchActivityLogs();
});

function goPrev() {
  if (pagination.value.hasPrevPage) {
    currentPage.value = Math.max(1, currentPage.value - 1);
  }
}

function goNext() {
  if (pagination.value.hasNextPage) {
    currentPage.value = currentPage.value + 1;
  }
}

function goFirst() {
  if (pagination.value.currentPage !== 1) {
    currentPage.value = 1;
  }
}

function goLast() {
  const last = pagination.value.totalPages || 1;
  if (pagination.value.currentPage !== last) {
    currentPage.value = last;
  }
}

function changePageSize() {
  currentPage.value = 1;
  fetchActivityLogs();
}
</script>

<style scoped>
/* Make the Admin label more visible */
nav .font-bold {
  color: #1a202c !important;
  font-weight: 900 !important;
  letter-spacing: 1px;
}

/* Table styling */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th {
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  z-index: 10;
}

/* Hover effects */
tr:hover {
  background-color: #f9fafb;
}

/* Badge styling */
.inline-flex {
  display: inline-flex;
  align-items: center;
}
</style>





<template>
  <nav class="flex items-center justify-between bg-white px-6 py-3 shadow-sm border-b">
    <div class="flex items-center">
      <span class="w-8 h-8 bg-gray-200 rounded-full mr-3"></span>
      <span class="text-xl font-bold">Admin</span>
    </div>
    <div class="flex items-center space-x-6">
      <a @click.prevent="goToDashboard" class="text-gray-700 hover:underline cursor-pointer">Dashboard</a>
      <a @click.prevent="$emit('show-calendar')" class="text-gray-700 hover:underline cursor-pointer">Calendar</a>
      <a @click.prevent="goToInventoryOrders" class="text-gray-700 hover:underline cursor-pointer">Inventory Management/Order History</a>
      <div class="relative group">
        <a @click.prevent="toggleDownloadMenu" class="text-gray-700 hover:underline cursor-pointer">Download Excel</a>
        <div v-if="showDownloadMenu" class="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-50 min-w-48">
          <a @click.prevent="downloadReport('detailed')" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Detailed Report</a>
          <a @click.prevent="downloadReport('summary')" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Summary Report</a>
          <a @click.prevent="downloadReport('today')" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">Today's Sales</a>
        </div>
      </div>
      <a @click.prevent="goToActivityLogs" class="text-gray-700 hover:underline cursor-pointer">Activity Logs</a>
      <a @click.prevent="goToManageUsers" class="text-gray-700 hover:underline cursor-pointer">Manage users</a>
      <button @click="handleLogout" class="text-red-500 hover:underline px-4 py-2 bg-black text-white rounded font-bold" style="color: #FFFFFF !important;">Logout</button>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { logout } = useAuth();
const showDownloadMenu = ref(false);

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
async function handleLogout() {
  await logout();
}

function toggleDownloadMenu() {
  showDownloadMenu.value = !showDownloadMenu.value;
}

async function downloadReport(reportType) {
  showDownloadMenu.value = false;
  
  try {
    let url = 'http://localhost:5000/api/sales/report?reportType=' + reportType;
    
    // Add date parameters based on report type
    if (reportType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      url += `&startDate=${today}&endDate=${today}`;
    }
    
    const response = await fetch(url, {
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
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Set filename based on report type
    const today = new Date().toISOString().split('T')[0];
    a.download = `sales_${reportType}_report_${today}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Error downloading sales report:', error);
    alert('Failed to download sales report. Please try again.');
  }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.relative.group')) {
    showDownloadMenu.value = false;
  }
});
</script>

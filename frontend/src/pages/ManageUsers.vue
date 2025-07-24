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
          <a @click.prevent="goToInventoryOrders" class="text-gray-700 hover:underline cursor-pointer">Inventory Management/Order History</a>
          <a @click.prevent="downloadSalesReport" class="text-gray-700 hover:underline cursor-pointer">Download Excel</a>
          <span class="text-gray-700 font-semibold">Manage users</span>
          <button @click="handleLogout" class="text-red-500 hover:underline px-4 py-2 bg-black text-white rounded font-bold">Logout</button>
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

    <!-- Main Content -->
    <div class="px-12 pt-8">
      <h1 class="text-5xl font-semibold mb-8 text-gray-800">Manage Users</h1>
      <div class="flex space-x-4 mb-8">
        <button class="btn btn-primary" @click="showAddUserModal = true">Add User</button>
        <button class="btn btn-error" disabled>Remove User</button>
      </div>

      <!-- Search -->
      <div class="mb-4">
        <input v-model="searchQuery" type="text" placeholder="Search users..." class="input input-bordered w-64" />
      </div>

      <!-- User List -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Current Users</h2>
        <div v-if="isLoadingUsers">Loading users...</div>
        <div v-if="usersError" class="text-red-600 mb-2">{{ usersError }}</div>
        <table v-if="filteredUsers.length" class="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th class="px-4 py-2 border text-gray-800">ID</th>
              <th class="px-4 py-2 border text-gray-800">Full Name</th>
              <th class="px-4 py-2 border text-gray-800">Username</th>
              <th class="px-4 py-2 border text-gray-800">Role</th>
              <th class="px-4 py-2 border text-gray-800">Shift</th>
              <th class="px-4 py-2 border text-gray-800">Salary</th>
              <th class="px-4 py-2 border text-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="px-4 py-2 border text-gray-800">{{ user.id }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.full_name }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.username }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.role }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.shift }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.salary }}</td>
              <td class="px-4 py-2 border text-gray-800">
                <button class="text-blue-600 hover:underline mr-2" @click="openEditUser(user)">Edit</button>
                <button class="text-red-600 hover:underline" @click="deleteUser(user.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="!isLoadingUsers">No users found.</div>
      </div>

      <!-- Edit User Modal -->
      <div v-if="showEditUserModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" @click.self="showEditUserModal = false">
        <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
          <button class="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl" @click="showEditUserModal = false">&times;</button>
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Edit User</h2>
          <form @submit.prevent="submitEditUser">
            <div v-if="editFormMessage" class="mb-2 text-green-600">{{ editFormMessage }}</div>
            <div v-if="editFormError" class="mb-2 text-red-600">{{ editFormError }}</div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Full Name</label>
              <input v-model="editUser.fullName" type="text" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Username</label>
              <input v-model="editUser.username" type="text" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Role</label>
              <select v-model="editUser.role" class="select select-bordered w-full" required>
                <option value="">Select Role</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Shift Hours</label>
              <input v-model="editUser.shift" type="text" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Salary</label>
              <input v-model="editUser.salary" type="number" min="0" class="input input-bordered w-full" required />
            </div>
            <button type="submit" class="btn btn-primary w-full" :disabled="isEditing">
              <span v-if="isEditing">Saving...</span>
              <span v-else>Save Changes</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Add User Modal -->
      <div v-if="showAddUserModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" @click.self="showAddUserModal = false">
        <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
          <button class="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl" @click="showAddUserModal = false">&times;</button>
          <h2 class="text-2xl font-semibold mb-4 text-gray-800">Add New User</h2>
          <form @submit.prevent="submitAddUser">
            <div v-if="formMessage" class="mb-2 text-green-600">{{ formMessage }}</div>
            <div v-if="formError" class="mb-2 text-red-600">{{ formError }}</div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Full Name</label>
              <input v-model="newUser.fullName" type="text" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Username</label>
              <input v-model="newUser.username" type="text" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Password</label>
              <input v-model="newUser.password" type="password" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Role</label>
              <select v-model="newUser.role" class="select select-bordered w-full" required>
                <option value="">Select Role</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Shift Hours</label>
              <input v-model="newUser.shift" type="text" placeholder="e.g. 9am-5pm" class="input input-bordered w-full" required />
            </div>
            <div class="mb-4">
              <label class="block mb-1 font-medium text-gray-800">Salary</label>
              <input v-model="newUser.salary" type="number" min="0" class="input input-bordered w-full" required />
            </div>
            <button type="submit" class="btn btn-primary w-full" :disabled="isSubmitting">
              <span v-if="isSubmitting">Creating...</span>
              <span v-else>Create Account</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import CalendarPopup from '../components/CalendarPopup.vue';

const router = useRouter();
const showCalendar = ref(false);
const showAddUserModal = ref(false);
const showEditUserModal = ref(false);

const newUser = ref({
  fullName: '',
  username: '',
  password: '',
  role: '',
  shift: '',
  salary: ''
});

const editUser = ref({
  id: null,
  fullName: '',
  username: '',
  role: '',
  shift: '',
  salary: ''
});

const isSubmitting = ref(false);
const formMessage = ref('');
const formError = ref('');
const isEditing = ref(false);
const editFormMessage = ref('');
const editFormError = ref('');

const users = ref([]);
const isLoadingUsers = ref(false);
const usersError = ref('');
const searchQuery = ref('');

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(u =>
    (u.full_name && u.full_name.toLowerCase().includes(q)) ||
    (u.username && u.username.toLowerCase().includes(q)) ||
    (u.role && u.role.toLowerCase().includes(q)) ||
    (u.shift && u.shift.toLowerCase().includes(q))
  );
});

async function fetchUsers() {
  isLoadingUsers.value = true;
  usersError.value = '';
  try {
    const response = await fetch('http://localhost:5000/api/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    users.value = await response.json();
  } catch (err) {
    usersError.value = err.message || 'Error loading users';
  } finally {
    isLoadingUsers.value = false;
  }
}

onMounted(fetchUsers);

function goToDashboard() {
  router.push('/admin/dashboard');
}

function goToInventoryOrders() {
  router.push('/admin/inventory-orders');
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

async function submitAddUser() {
  isSubmitting.value = true;
  formMessage.value = '';
  formError.value = '';
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser.value)
    });
    const data = await response.json();
    if (response.ok) {
      formMessage.value = 'User created successfully!';
      showAddUserModal.value = false;
      newUser.value = { fullName: '', username: '', password: '', role: '', shift: '', salary: '' };
      await fetchUsers();
    } else {
      formError.value = data.error || 'Failed to create user.';
    }
  } catch (err) {
    formError.value = 'Network error or server not reachable.';
  } finally {
    isSubmitting.value = false;
  }
}

function openEditUser(user) {
  editUser.value = {
    id: user.id,
    fullName: user.full_name,
    username: user.username,
    role: user.role,
    shift: user.shift,
    salary: user.salary
  };
  editFormMessage.value = '';
  editFormError.value = '';
  showEditUserModal.value = true;
}

async function submitEditUser() {
  isEditing.value = true;
  editFormMessage.value = '';
  editFormError.value = '';
  try {
    const response = await fetch(`http://localhost:5000/api/users/${editUser.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: editUser.value.fullName,
        username: editUser.value.username,
        role: editUser.value.role,
        shift: editUser.value.shift,
        salary: editUser.value.salary
      })
    });
    const data = await response.json();
    if (response.ok) {
      editFormMessage.value = 'User updated successfully!';
      showEditUserModal.value = false;
      await fetchUsers();
    } else {
      editFormError.value = data.error || 'Failed to update user.';
    }
  } catch (err) {
    editFormError.value = 'Network error or server not reachable.';
  } finally {
    isEditing.value = false;
  }
}

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  try {
    const response = await fetch(`http://localhost:5000/api/users/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchUsers();
    } else {
      alert('Failed to delete user.');
    }
  } catch (err) {
    alert('Network error or server not reachable.');
  }
}
</script> 
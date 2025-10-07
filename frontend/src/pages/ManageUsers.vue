<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <AdminNavbar @show-calendar="showCalendar = true" />

    <!-- Calendar Popup (standardized) -->
    <div v-if="showCalendar" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]" @click.self="showCalendar = false">
      <div class="relative">
        <button class="absolute top-2 right-2 text-gray-300 hover:text-white z-10" @click="showCalendar = false">&times;</button>
        <CalendarPopup v-model="selectedDate" />
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
              <th class="px-4 py-2 border text-gray-800">Full Name</th>
              <th class="px-4 py-2 border text-gray-800">Username</th>
              <th class="px-4 py-2 border text-gray-800">Role</th>
              <th class="px-4 py-2 border text-gray-800">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="px-4 py-2 border text-gray-800">{{ user.full_name }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.username }}</td>
              <td class="px-4 py-2 border text-gray-800">{{ user.role }}</td>
              <td class="px-4 py-2 border text-gray-800">
                <button
                  :class="['mr-2', rowLocked(user) ? 'text-gray-300 pointer-events-none' : 'text-blue-600 hover:underline']"
                  :aria-disabled="rowLocked(user)"
                  @click="!rowLocked(user) && openEditUser(user)"
                >Edit</button>
                <button
                  :class="[rowLocked(user) ? 'text-gray-300 pointer-events-none' : 'text-red-600 hover:underline']"
                  :aria-disabled="rowLocked(user)"
                  @click="!rowLocked(user) && deleteUser(user.id)"
                >Delete</button>
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
                <option value="Server">Server</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <!-- Security Questions for Admin Users -->
            <div v-if="editUser.role === 'Admin'" class="border-t pt-4 mt-4">
              
              <div class="mb-4">
              </div>
              
              <div class="mb-4">
              </div>
              
              <div class="mb-4">
              </div>
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
                <option value="Server">Server</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <!-- Security Questions for Admin Users -->
            <div v-if="newUser.role === 'Admin'" class="border-t pt-4 mt-4">
              
              <div class="mb-4">
              </div>
              
              <div class="mb-4">
              </div>
              
              <div class="mb-4">
              </div>
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
import AdminNavbar from '../components/AdminNavbar.vue';

const router = useRouter();
const showCalendar = ref(false);
const showAddUserModal = ref(false);
const showEditUserModal = ref(false);

const newUser = ref({
  fullName: '',
  username: '',
  password: '',
  role: '',});

const editUser = ref({
  id: null,
  fullName: '',
  username: '',
  role: '',});

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

// Determine current user's role to adjust UI affordances
const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
})();
const isSuperAdmin = computed(() => currentUser?.role === 'SuperAdmin');
const isAdmin = computed(() => currentUser?.role === 'Admin');
const rowLocked = (u) => isAdmin.value && (u.role === 'Admin' || u.role === 'SuperAdmin');

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(u =>
    (u.full_name && u.full_name.toLowerCase().includes(q)) ||
    (u.username && u.username.toLowerCase().includes(q)) ||
    (u.role && u.role.toLowerCase().includes(q))
  );
});

async function fetchUsers() {
  isLoadingUsers.value = true;
  usersError.value = '';
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
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


async function submitAddUser() {
  isSubmitting.value = true;
  formMessage.value = '';
  formError.value = '';
  
  // Add validation for admin users
  if (newUser.value.role === 'Admin') {
  }
  
  console.log('Sending user data:', newUser.value);
  
  try {
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(newUser.value)
    });
    const data = await response.json();
    if (response.ok) {
      formMessage.value = 'User created successfully!';
      showAddUserModal.value = false;
      newUser.value = { 
        fullName: '', 
        username: '', 
        password: '', 
        role: '',};
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
    role: user.role,};
  editFormMessage.value = '';
  editFormError.value = '';
  showEditUserModal.value = true;
}

async function submitEditUser() {
  isEditing.value = true;
  editFormMessage.value = '';
  editFormError.value = '';
  
  // Add validation for admin users
  if (editUser.value.role === 'Admin') {
  }
  
  console.log('Sending edit user data:', editUser.value);
  
  try {
    const response = await fetch(`http://localhost:5000/api/users/${editUser.value.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({fullName: editUser.value.fullName,
        username: editUser.value.username,
        role: editUser.value.role})
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
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
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



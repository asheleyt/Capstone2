<template>
  <div class="min-h-screen flex flex-col bg-neutral">
    <main class="flex-1 flex items-center justify-center">
      <div class="bg-base-100 rounded-lg shadow-lg w-full max-w-5xl flex min-h-[500px]">
        <!-- Left: Brand Name Instead of Image -->
        <div class="flex-1 bg-gray-200 flex items-center justify-left">
          <h1 class="text-1xl md:text-1xl lg:text-4xl font-bold text-gray-800 text-center px-4">
            Kraezeus Grill and Restaurant
          </h1>
        </div>
        <!-- Right: Login Form -->
        <div class="flex-1 flex items-center justify-center">
          <div class="w-full max-w-xs mx-auto">
            <form @submit.prevent="handleLogin" class="space-y-4">
              <div>
                <label class="block mb-1 font-semibold">Username</label>
                <input v-model="formData.username" class="input input-bordered w-full" type="text" placeholder="Enter your username" required/>
              </div>

              <div>
                <label class="block mb-1 font-semibold">Password</label>
                <input 
                  v-model="formData.password" 
                  class="input input-bordered w-full" 
                  type="password" 
                  placeholder="At least 8 characters" 
                  required
                />

                
              </div>
              <div v-if="errorMessage" class="alert alert-error text-sm">
                {{ errorMessage }}
              </div>
              <button type="submit" class="btn btn-neutral w-full mt-2" :disabled="isLoading">
                {{ isLoading ? 'Logging in...' : 'Log in' }}
              </button>
              
              <!-- Forgot Password Link for Admin Users -->
              <div class="text-center mt-2">
                <a @click.prevent="goToForgotPassword" class="text-blue-600 hover:underline cursor-pointer text-sm">
                  Forgot Password? (Admin Only)
                </a>
              </div>
              
              <!-- Temporary account for testing -->
              <div class="text-center mt-4 p-3 bg-base-200 rounded-lg">
                <p class="text-xs font-semibold mb-2">Temporary Admin Account:</p>
                <div class="text-xs">
                  <div><strong>Admin:</strong> admin / admin123</div>
                  <p class="text-xs mt-1 text-gray-600">Use this to access admin dashboard and create other accounts</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login } = useAuth();
const isLoading = ref(false);
const errorMessage = ref('');

const formData = ref({
  username: '',
  password: ''
});

function handleLogout() {
  localStorage.removeItem('user');
  router.push('/login');
}

function goToForgotPassword() {
  router.push('/admin/forgot-password');
}

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const trimmedUsername = formData.value.username.trim();
    formData.value.username = trimmedUsername;

    if (!trimmedUsername) {
      errorMessage.value = 'Please enter your username.';
      isLoading.value = false;
      return;
    }

    const result = await login(trimmedUsername, formData.value.password);
    console.log('Login result:', result);
    
    if (result.success) {
      // Route based on user role and security setup status
      console.log('User role:', result.user.role, 'Security setup complete:', result.user.security_setup_complete);
      if (result.user.role === 'SuperAdmin' && !result.user.security_setup_complete) {
        console.log('Routing to /superadmin/setup');
        router.push('/superadmin/setup');
      } else if (result.user.role === 'SuperAdmin' && result.user.security_setup_complete) {
        console.log('Routing to /admin/dashboard');
        router.push('/admin/dashboard');
      } else if (result.user.role === 'Admin') {
        if (!result.user.security_setup_complete) {
          console.log('Routing to /admin/security-setup');
          router.push('/admin/security-setup');
        } else {
          console.log('Routing to /admin/dashboard');
          router.push('/admin/dashboard');
        }
      } else if (result.user.role === 'Kitchen') {
        console.log('Routing to /kds');
        router.push('/kds');
      } else if (result.user.role === 'Cashier') {
        console.log('Routing to /pos');
        router.push('/pos');
      } else if (result.user.role === 'Server') {
        console.log('Routing to /server/tables');
        router.push('/server/tables');
      } else {
        console.log('Routing to /');
        router.push('/');
      }
    } else {
      errorMessage.value = result.error || 'Invalid username or password. Please try again.';
      console.log('Login failed:', errorMessage.value);
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable.';
    console.log('Network/login error:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>

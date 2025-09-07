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
              <div class="text-center mt-2">
                <span class="text-xs">Forgot your password? <router-link to="/forgot-password" class="link link-primary">Reset Password</router-link></span>
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

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  const result = await login(formData.value.username, formData.value.password);
  
  if (result.success) {
    // Route based on user role
    if (result.user.role === 'Admin') {
      router.push('/admin/dashboard');
    } else if (result.user.role === 'Kitchen') {
      router.push('/kds');
    } else if (result.user.role === 'Cashier') {
      router.push('/pos');
    } else {
      router.push('/');
    }
  } else {
    errorMessage.value = result.error || 'Invalid username or password. Please try again.';
  }
  
  isLoading.value = false;
};
</script> 
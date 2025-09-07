<template>
  <div class="min-h-screen flex flex-col bg-neutral">
    <main class="flex-1 flex items-center justify-center">
      <div class="bg-base-100 rounded-lg shadow-lg w-full max-w-md p-8">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p class="text-gray-600" v-if="username">Hello {{ username }}, please enter your new password.</p>
          <p class="text-gray-600" v-else>Please enter your new password.</p>
        </div>

        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <div>
            <label class="block mb-1 font-semibold">New Password</label>
            <input 
              v-model="newPassword" 
              class="input input-bordered w-full" 
              type="password" 
              placeholder="Enter new password" 
              required
              minlength="8"
            />
            <p class="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
          </div>

          <div>
            <label class="block mb-1 font-semibold">Confirm Password</label>
            <input 
              v-model="confirmPassword" 
              class="input input-bordered w-full" 
              type="password" 
              placeholder="Confirm new password" 
              required
            />
          </div>

          <div v-if="passwordMismatch" class="alert alert-error text-sm">
            Passwords do not match
          </div>

          <div v-if="errorMessage" class="alert alert-error text-sm">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="alert alert-success text-sm">
            {{ successMessage }}
          </div>

          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading || passwordMismatch">
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>

          <div class="text-center">
            <router-link to="/login" class="link link-primary text-sm">
              ← Back to Login
            </router-link>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const username = ref('');

const passwordMismatch = computed(() => {
  return confirmPassword.value && newPassword.value !== confirmPassword.value;
});

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    errorMessage.value = 'Invalid reset link. Please request a new password reset.';
    return;
  }

  // Verify the token
  try {
    const response = await fetch(`http://localhost:5000/api/users/verify-reset-token/${token}`);
    const data = await response.json();
    
    if (response.ok) {
      username.value = data.username;
    } else {
      errorMessage.value = data.error || 'Invalid or expired reset link.';
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable.';
  }
});

const handleResetPassword = async () => {
  if (passwordMismatch.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await fetch('http://localhost:5000/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token: route.query.token,
        newPassword: newPassword.value 
      })
    });

    const data = await response.json();

    if (response.ok) {
      successMessage.value = data.message;
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } else {
      errorMessage.value = data.error || 'Failed to reset password. Please try again.';
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable.';
  } finally {
    isLoading.value = false;
  }
};
</script>

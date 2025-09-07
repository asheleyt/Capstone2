<template>
  <div class="min-h-screen flex flex-col bg-neutral">
    <main class="flex-1 flex items-center justify-center">
      <div class="bg-base-100 rounded-lg shadow-lg w-full max-w-md p-8">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
          <p class="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="space-y-4">
          <div>
            <label class="block mb-1 font-semibold">Email Address</label>
            <input 
              v-model="email" 
              class="input input-bordered w-full" 
              type="email" 
              placeholder="Enter your email address" 
              required
            />
          </div>

          <div v-if="errorMessage" class="alert alert-error text-sm">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="alert alert-success text-sm">
            {{ successMessage }}
          </div>

          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
            {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const handleForgotPassword = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await fetch('http://localhost:5000/api/users/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    });

    const data = await response.json();

    if (response.ok) {
      successMessage.value = data.message;
      email.value = ''; // Clear the email field
    } else {
      errorMessage.value = data.error || 'Failed to send reset email. Please try again.';
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Admin Password Recovery</h1>
        <p class="text-gray-600 mt-2">Answer your security questions to reset your password</p>
      </div>

      <!-- Step 1: Enter Username -->
      <div v-if="step === 1" class="space-y-4">
        <div>
          <label class="block mb-1 font-medium text-gray-800">Admin Username</label>
          <input 
            v-model="username" 
            type="text" 
            class="input input-bordered w-full" 
            placeholder="Enter your admin username"
            required
          />
        </div>
        <div v-if="errorMessage" class="alert alert-error text-sm">
          {{ errorMessage }}
        </div>
        <button 
          @click="getSecurityQuestions" 
          class="btn btn-primary w-full" 
          :disabled="!username || isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Continue</span>
        </button>
        <div class="text-center">
          <a @click.prevent="goToLogin" class="text-blue-600 hover:underline cursor-pointer text-sm">
            Back to Login
          </a>
        </div>
      </div>

      <!-- Step 2: Answer Security Questions -->
      <div v-if="step === 2" class="space-y-4">
        <div class="text-center mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Security Questions</h2>
          <p class="text-gray-600 text-sm">Please answer all three questions to reset your password</p>
        </div>

        <div v-if="securityQuestions.q1" class="space-y-3">
          <div>
            <label class="block mb-1 font-medium text-gray-800">Question 1:</label>
            <p class="text-gray-700 mb-2">{{ securityQuestions.q1 }}</p>
            <input 
              v-model="answers.a1" 
              type="text" 
              class="input input-bordered w-full" 
              placeholder="Your answer"
              required
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-800">Question 2:</label>
            <p class="text-gray-700 mb-2">{{ securityQuestions.q2 }}</p>
            <input 
              v-model="answers.a2" 
              type="text" 
              class="input input-bordered w-full" 
              placeholder="Your answer"
              required
            />
          </div>

          <div>
            <label class="block mb-1 font-medium text-gray-800">Question 3:</label>
            <p class="text-gray-700 mb-2">{{ securityQuestions.q3 }}</p>
            <input 
              v-model="answers.a3" 
              type="text" 
              class="input input-bordered w-full" 
              placeholder="Your answer"
              required
            />
          </div>
        </div>

        <div v-if="errorMessage" class="alert alert-error text-sm">
          {{ errorMessage }}
        </div>

        <div class="flex space-x-2">
          <button 
            @click="step = 1; errorMessage = ''" 
            class="btn btn-outline flex-1"
          >
            Back
          </button>
          <button 
            @click="verifyAnswers" 
            class="btn btn-primary flex-1" 
            :disabled="!answers.a1 || !answers.a2 || !answers.a3 || isLoading"
          >
            <span v-if="isLoading">Verifying...</span>
            <span v-else>Verify Answers</span>
          </button>
        </div>
      </div>

      <!-- Step 3: Reset Password -->
      <div v-if="step === 3" class="space-y-4">
        <div class="text-center mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Reset Password</h2>
          <p class="text-gray-600 text-sm">Enter your new password</p>
        </div>

        <div>
          <label class="block mb-1 font-medium text-gray-800">New Password</label>
          <input 
            v-model="newPassword" 
            type="password" 
            class="input input-bordered w-full" 
            placeholder="Enter new password"
            required
          />
        </div>

        <div>
          <label class="block mb-1 font-medium text-gray-800">Confirm Password</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            class="input input-bordered w-full" 
            placeholder="Confirm new password"
            required
          />
        </div>

        <div v-if="errorMessage" class="alert alert-error text-sm">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="alert alert-success text-sm">
          {{ successMessage }}
        </div>

        <div class="flex space-x-2">
          <button 
            @click="step = 2; errorMessage = ''; successMessage = ''" 
            class="btn btn-outline flex-1"
          >
            Back
          </button>
          <button 
            @click="resetPassword" 
            class="btn btn-primary flex-1" 
            :disabled="!newPassword || !confirmPassword || isLoading"
          >
            <span v-if="isLoading">Resetting...</span>
            <span v-else>Reset Password</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const step = ref(1);
const username = ref('');
const securityQuestions = ref({});
const answers = ref({ a1: '', a2: '', a3: '' });
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function getSecurityQuestions() {
  if (!username.value.trim()) {
    errorMessage.value = 'Please enter a username';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch(`http://localhost:5000/api/users/security-questions/${username.value}`);
    const data = await response.json();

    if (response.ok) {
      securityQuestions.value = data;
      step.value = 2;
    } else {
      errorMessage.value = data.error || 'Failed to get security questions';
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable';
  } finally {
    isLoading.value = false;
  }
}

async function verifyAnswers() {
  if (!answers.value.a1.trim() || !answers.value.a2.trim() || !answers.value.a3.trim()) {
    errorMessage.value = 'Please answer all security questions';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch('http://localhost:5000/api/users/reset-admin-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        answers: answers.value,
        newPassword: 'temp_password_for_verification'
      })
    });

    const data = await response.json();

    if (response.ok) {
      step.value = 3;
    } else {
      errorMessage.value = data.error || 'Invalid security answers';
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable';
  } finally {
    isLoading.value = false;
  }
}

async function resetPassword() {
  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all password fields';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch('http://localhost:5000/api/users/reset-admin-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        answers: answers.value,
        newPassword: newPassword.value
      })
    });

    const data = await response.json();

    if (response.ok) {
      successMessage.value = 'Password reset successfully! You can now log in with your new password.';
      setTimeout(() => {
        goToLogin();
      }, 2000);
    } else {
      errorMessage.value = data.error || 'Failed to reset password';
    }
  } catch (err) {
    errorMessage.value = 'Network error or server not reachable';
  } finally {
    isLoading.value = false;
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

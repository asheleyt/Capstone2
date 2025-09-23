<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div class="bg-white shadow rounded-lg w-full max-w-xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold">Super Admin Security Setup</h2>
          <button @click="logout" class="text-gray-500 hover:text-gray-700 text-sm">Logout</button>
        </div>
        <p class="text-sm text-gray-600 mb-6">Set three security questions and answers. This is required before accessing the admin dashboard.</p>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <div v-for="n in 3" :key="n" class="grid grid-cols-1 gap-2">
          <label :for="`q${n}`" class="font-medium">Question {{ n }}</label>
          <input :id="`q${n}`" v-model="form.questions[`q${n}`]" type="text" class="border rounded px-3 py-2" required />
          <label :for="`a${n}`" class="font-medium">Answer {{ n }}</label>
          <input :id="`a${n}`" v-model="form.answers[`a${n}`]" type="text" class="border rounded px-3 py-2" required />
        </div>

        <div class="flex items-center justify-between pt-4">
          <button type="button" @click="onCancel" class="px-4 py-2 border rounded text-gray-700">Cancel & Reset</button>
          <button type="submit" :disabled="submitting" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{{ submitting ? 'Saving...' : 'Save & Continue' }}</button>
        </div>
      </form>

      <p v-if="error" class="text-red-600 mt-4">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { logout: authLogout } = useAuth();
const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
const user = storedUser ? JSON.parse(storedUser) : null;

const form = reactive({
  questions: { q1: '', q2: '', q3: '' },
  answers: { a1: '', a2: '', a3: '' }
});
const submitting = ref(false);
const error = ref('');

const authHeaders = () => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const onSubmit = async () => {
  error.value = '';
  submitting.value = true;
  try {
    const res = await fetch('http://localhost:5000/api/users/superadmin/security-setup', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ questions: form.questions, answers: form.answers })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to setup security');

    // Update localStorage user with security_setup_complete
    const updatedUser = { ...user, security_setup_complete: true };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    router.push('/admin/dashboard');
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
};

const onCancel = async () => {
  try {
    await fetch('http://localhost:5000/api/users/superadmin/security-reset', {
      method: 'POST',
      headers: authHeaders()
    });
  } catch (_) {}
  // Clear any inputs and ensure user flag is unset locally
  form.questions = { q1: '', q2: '', q3: '' };
  form.answers = { a1: '', a2: '', a3: '' };
  const updatedUser = { ...user, security_setup_complete: false };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  // Stay on page
};

const logout = async () => {
  await authLogout();
};
</script>

<style scoped>
.bg-white {
  background: #fff !important;
}
.text-gray-800, .text-gray-900, .font-semibold, label, h2, .text-sm, .font-medium {
  color: #222 !important;
}
input {
  background: #fff !important;
  color: #222 !important;
  border: 1px solid #888 !important;
  font-weight: 500;
}
input::placeholder {
  color: #555 !important;
  opacity: 1;
}
label {
  color: #222 !important;
  font-weight: 600;
}
button, .text-blue-600 {
  color: #0d47a1 !important;
}
.text-gray-600, .text-gray-500 {
  color: #333 !important;
}
.text-red-600 {
  color: #c00 !important;
}
</style>



import { ref } from 'vue';
import { useAuth } from './useAuth';

export function useOrders() {
  const orders = ref([]);
  const loading = ref(false);
  const error = ref('');
  let getAuthHeaders = () => ({});
  try {
    // useAuth may not be available in POS, so fallback
    getAuthHeaders = useAuth ? useAuth().getAuthHeaders : () => ({});
  } catch {}

  async function fetchOrders() {
    loading.value = true;
    error.value = '';
    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        headers: getAuthHeaders ? getAuthHeaders() : {},
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      orders.value = await res.json();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { orders, loading, error, fetchOrders };
} 
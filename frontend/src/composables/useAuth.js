import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const user = ref(null);
const token = ref(localStorage.getItem('token') || null);

// Initialize user from localStorage if token exists
if (token.value) {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      token.value = null;
    }
  }
}

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'Admin');
  const isCashier = computed(() => user.value?.role === 'Cashier');
  const isKitchen = computed(() => user.value?.role === 'Kitchen');

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store token and user data
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error or server not reachable' };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to log the activity
      if (token.value) {
        await fetch('http://localhost:5000/api/users/logout', {
          method: 'POST',
          headers: getAuthHeaders()
        });
      }
    } catch (error) {
      console.error('Error calling logout endpoint:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local data regardless of API call result
      user.value = null;
      token.value = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  const getAuthHeaders = () => {
    if (!token.value) return {};
    return {
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json'
    };
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If token is expired or invalid, logout user
    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  };

  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const requireAdmin = () => {
    if (!requireAuth()) return false;
    if (!isAdmin.value) {
      router.push('/unauthorized');
      return false;
    }
    return true;
  };

  const requireRole = (allowedRoles) => {
    if (!requireAuth()) return false;
    if (!allowedRoles.includes(user.value.role)) {
      router.push('/unauthorized');
      return false;
    }
    return true;
  };

  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    isAuthenticated,
    isAdmin,
    isCashier,
    isKitchen,
    login,
    logout,
    getAuthHeaders,
    makeAuthenticatedRequest,
    requireAuth,
    requireAdmin,
    requireRole
  };
}

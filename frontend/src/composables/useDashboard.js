import { ref, computed, onMounted } from 'vue';

// Dashboard state
const dashboardData = ref({
  salesOverview: {
    labels: [],
    data: []
  },
  topSellingItems: [],
  todaySaleSummary: {
    cashSale: 0,
    cashlessSale: 0,
    totalDiscount: 0,
    totalSale: 0,
    items: []
  }
});

const loading = ref(false);
const error = ref('');

export function useDashboard() {
  // Fetch dashboard data from API
  async function fetchDashboardData(period = 'daily') {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`http://localhost:5000/api/sales/dashboard?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      dashboardData.value = data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching dashboard data:', err);
    } finally {
      loading.value = false;
    }
  }

  // Computed properties for chart data
  const chartData = computed(() => {
    return {
      labels: dashboardData.value.salesOverview.labels,
      datasets: [{
        label: 'Sales',
        data: dashboardData.value.salesOverview.data,
        borderColor: '#222',
        fill: false,
      }],
    };
  });

  const topSelling = computed(() => {
    return dashboardData.value.topSellingItems.map(item => ({
      name: item.name,
      sold: item.sold
    }));
  });

  const saleSummary = computed(() => {
    return dashboardData.value.todaySaleSummary.items;
  });

  const cashSale = computed(() => {
    return dashboardData.value.todaySaleSummary.cashSale;
  });

  const cashlessSale = computed(() => {
    return dashboardData.value.todaySaleSummary.cashlessSale;
  });

  const totalDiscount = computed(() => {
    return dashboardData.value.todaySaleSummary.totalDiscount;
  });

  const totalSale = computed(() => {
    return dashboardData.value.todaySaleSummary.totalSale;
  });

  // Initialize dashboard data
  onMounted(() => {
    fetchDashboardData('daily');
  });

  return {
    // State
    dashboardData,
    loading,
    error,
    
    // Computed
    chartData,
    topSelling,
    saleSummary,
    cashSale,
    cashlessSale,
    totalDiscount,
    totalSale,
    
    // Functions
    fetchDashboardData
  };
}

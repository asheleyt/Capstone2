<template>
  <div>
    <Line :data="chartData" :options="options" v-if="chartData" />
    <div v-else class="text-red-500">No chart data provided.</div>
  </div>
</template>

<script setup>
import { Line } from 'vue-chartjs';
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
} from 'chart.js';
import { computed } from 'vue';

Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  }
});

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { display: true } }
  }
}));
</script>

<style scoped>
div {
  width: 100%;
  height: 100%;
}
</style> 
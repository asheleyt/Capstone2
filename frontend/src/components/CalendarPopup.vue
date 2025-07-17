<template>
  <div class="bg-gray-800 rounded-lg p-4 w-80 text-white">
    <div class="flex items-center justify-between mb-2">
      <button @click="prevMonth" class="px-2 py-1 text-xl font-bold">&#8592;</button>
      <span class="font-semibold text-lg">{{ monthName }} {{ currentYear }}</span>
      <button @click="nextMonth" class="px-2 py-1 text-xl font-bold">&#8594;</button>
    </div>
    <div class="grid grid-cols-7 gap-1 text-center text-xs mb-1">
      <div v-for="d in days" :key="d" class="font-bold text-gray-200">{{ d }}</div>
    </div>
    <div class="grid grid-cols-7 gap-1 text-center">
      <div v-for="d in leadingDays" :key="'lead'+d" class="py-2 text-gray-500 bg-gray-700 rounded cursor-not-allowed">{{ d }}</div>
      <div v-for="day in daysInMonth" :key="day" :class="['py-2 rounded font-semibold', isToday(day) ? 'bg-white text-gray-800' : 'bg-gray-900 hover:bg-gray-700 cursor-pointer']">
        {{ day }}
      </div>
      <div v-for="d in trailingDays" :key="'trail'+d" class="py-2 text-gray-500 bg-gray-700 rounded cursor-not-allowed">{{ d }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());

const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthName = computed(() => monthNames[currentMonth.value]);

function getFirstDayOfMonth(year, month) {
  // Make Monday the first day of the week
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const firstDayOfMonth = computed(() => getFirstDayOfMonth(currentYear.value, currentMonth.value));
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

const leadingDays = computed(() => {
  const prevMonth = currentMonth.value === 0 ? 11 : currentMonth.value - 1;
  const prevYear = currentMonth.value === 0 ? currentYear.value - 1 : currentYear.value;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
  return Array.from({ length: firstDayOfMonth.value }, (_, i) => daysInPrevMonth - firstDayOfMonth.value + i + 1);
});

const trailingDays = computed(() => {
  const total = leadingDays.value.length + daysInMonth.value;
  const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
  return Array.from({ length: trailing }, (_, i) => i + 1);
});

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}
function isToday(day) {
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  );
}
</script> 
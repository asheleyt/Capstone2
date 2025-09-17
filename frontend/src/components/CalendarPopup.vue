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
      <div v-for="day in daysInMonth" :key="day" :class="['py-2 rounded font-semibold', getDayClasses(day)]" @click="selectDate(day)">
        {{ day }}
      </div>
      <div v-for="d in trailingDays" :key="'trail'+d" class="py-2 text-gray-500 bg-gray-700 rounded cursor-not-allowed">{{ d }}</div>
    </div>
    <div v-if="selectedDate" class="mt-3 text-center">
      <button @click="clearSelection" class="text-xs text-gray-400 hover:text-white">Clear Selection</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Date,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);

const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());
const selectedDate = ref(props.modelValue);

// Keep internal selection in sync with parent v-model
watch(() => props.modelValue, (val) => {
  selectedDate.value = val;
});

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

function isSelected(day) {
  if (!selectedDate.value) return false;
  return (
    day === selectedDate.value.getDate() &&
    currentMonth.value === selectedDate.value.getMonth() &&
    currentYear.value === selectedDate.value.getFullYear()
  );
}

function getDayClasses(day) {
  if (isSelected(day)) {
    return 'bg-white text-gray-800 ring-2 ring-blue-500';
  }
  return 'bg-gray-900 hover:bg-gray-700 cursor-pointer';
}

function selectDate(day) {
  const date = new Date(currentYear.value, currentMonth.value, day);
  selectedDate.value = date;
  emit('update:modelValue', date);
}

function clearSelection() {
  selectedDate.value = null;
  emit('update:modelValue', null);
}
</script> 
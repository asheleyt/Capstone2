<template>
  <div class="rounded-lg bg-white shadow-lg p-4 w-80">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-semibold">Select Expiry Date</h3>
      <button class="btn btn-xs" @click="$emit('cancel')">✕</button>
    </div>
    <div class="flex items-center justify-between mb-3">
      <button class="btn btn-sm" @click="prevMonth">‹</button>
      <div class="font-medium">{{ monthYear }}</div>
      <button class="btn btn-sm" @click="nextMonth">›</button>
    </div>
    <div class="grid grid-cols-7 text-center text-xs mb-1">
      <div v-for="d in days" :key="d" class="font-semibold">{{ d }}</div>
    </div>
    <div class="grid grid-cols-7 gap-1 text-center">
      <div v-for="(cell, idx) in cells" :key="idx" class="h-8">
        <button v-if="cell"
                class="w-8 h-8 rounded hover:bg-indigo-100"
                :class="{ 'bg-indigo-500 text-white': isSelected(cell), 'opacity-50 cursor-not-allowed': !isEnabled(cell) }"
                :disabled="!isEnabled(cell)"
                @click="select(cell)">
          {{ cell.getDate() }}
        </button>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-3">
      <button class="btn" @click="$emit('cancel')">Cancel</button>
      <button class="btn btn-primary" :disabled="!temp" @click="apply">Apply</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  minDate: { type: String, default: '' },
  maxDate: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue','apply','cancel']);

const shown = ref(new Date());
const temp = ref(null);

watch(() => props.modelValue, (v) => {
  if (!v) return;
  const d = new Date(v);
  if (!isNaN(d)) {
    shown.value = new Date(d.getFullYear(), d.getMonth(), 1);
    temp.value = d;
  }
}, { immediate: true });

const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const monthYear = computed(() => shown.value.toLocaleString(undefined, { month: 'long', year: 'numeric' }));

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

const cells = computed(() => {
  const start = startOfMonth(shown.value);
  const end = endOfMonth(shown.value);
  const leading = start.getDay();
  const total = leading + end.getDate();
  const rows = Math.ceil(total / 7) * 7;
  const arr = Array(rows).fill(null);
  for (let i = 0; i < end.getDate(); i++) {
    arr[leading + i] = new Date(shown.value.getFullYear(), shown.value.getMonth(), i + 1);
  }
  return arr;
});

function isSelected(d) {
  if (!temp.value) return false;
  return temp.value.toDateString() === d.toDateString();
}
function isEnabled(d) {
  if (!d) return false;
  const min = props.minDate ? new Date(props.minDate) : null;
  const max = props.maxDate ? new Date(props.maxDate) : null;
  if (min && d < min) return false;
  if (max && d > max) return false;
  return true;
}
function select(d) {
  temp.value = d;
  emit('update:modelValue', toOut(d));
}
function prevMonth() { shown.value = new Date(shown.value.getFullYear(), shown.value.getMonth() - 1, 1); }
function nextMonth() { shown.value = new Date(shown.value.getFullYear(), shown.value.getMonth() + 1, 1); }

function toOut(d) {
  // Keep YYYY-MM-DD for new selections; do not alter existing values passed in
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function apply() {
  if (!temp.value) return;
  emit('apply', toOut(temp.value));
}
</script>

<style scoped>
.btn { @apply px-3 py-1 rounded border border-gray-300; }
.btn-primary { @apply bg-indigo-600 text-white border-indigo-600; }
.btn-xs { @apply text-sm px-2 py-0.5; }
.btn-sm { @apply text-sm; }
</style>


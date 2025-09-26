<template>
  <div class="w-80 bg-white rounded-xl shadow-xl p-5">
    <div class="flex items-center justify-between mb-4">
      <button class="btn btn-ghost btn-circle btn-xs" @click="prevMonth">‹</button>
      <div class="text-sm font-semibold">{{ monthYearLabel }}</div>
      <button class="btn btn-ghost btn-circle btn-xs" @click="nextMonth">›</button>
    </div>
    <div class="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-2">
      <div v-for="d in weekdays" :key="d" class="text-center">{{ d }}</div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <div v-for="n in leadingBlanks" :key="'b'+n"></div>
      <button
        v-for="day in daysInMonth"
        :key="day"
        class="relative h-10 w-10 rounded-md border text-sm flex items-center justify-center transition"
        :class="cellClass(day)" aria-label="Select day"
        :disabled="isDisabled(day)"
        @click="selectDay(day)"
      >
        {{ day }}
      </button>
    </div>
    <div class="flex justify-end gap-2 mt-4">
      <button class="btn" @click="$emit('cancel')">Cancel</button>
      <button class="btn btn-primary" :disabled="!selectedISO" @click="apply">Apply</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  minDate: { type: String, default: '' }, // YYYY-MM-DD
});
const emit = defineEmits(['update:modelValue','cancel','apply']);

function toISO(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return dt.toISOString().slice(0,10);
}
function fromISO(s) {
  if (!s) return null;
  const [y,m,dd] = s.split('-').map(Number);
  if (!y || !m || !dd) return null;
  return new Date(Date.UTC(y, m-1, dd));
}

const today = new Date();
const viewDate = ref(fromISO(props.modelValue) || new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)));
const selectedISO = ref(props.modelValue || '');

watch(() => props.modelValue, (v)=>{ selectedISO.value = v || ''; if (v) { const d=fromISO(v); if (d) viewDate.value = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }});

const weekdays = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const monthYearLabel = computed(()=>{
  const d = viewDate.value;
  const formatter = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return formatter.format(d);
});
const firstDayIndex = computed(()=>{
  const d = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth(), 1));
  return d.getUTCDay();
});
const daysInMonth = computed(()=>{
  const y = viewDate.value.getUTCFullYear();
  const m = viewDate.value.getUTCMonth();
  return new Date(Date.UTC(y, m+1, 0)).getUTCDate();
});
const leadingBlanks = computed(()=> Array.from({length:firstDayIndex.value}, (_,i)=>i+1));

function prevMonth(){
  const y = viewDate.value.getUTCFullYear();
  const m = viewDate.value.getUTCMonth();
  viewDate.value = new Date(Date.UTC(y, m-1, 1));
}
function nextMonth(){
  const y = viewDate.value.getUTCFullYear();
  const m = viewDate.value.getUTCMonth();
  viewDate.value = new Date(Date.UTC(y, m+1, 1));
}
function isDisabled(day){
  if (!props.minDate) return false;
  const min = fromISO(props.minDate);
  const d = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth(), day));
  return d < min;
}
function cellClass(day){
  const d = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth(), day));
  const isToday = toISO(today) === toISO(d);
  const isSelected = selectedISO.value && selectedISO.value === toISO(d);
  return [
    "text-center",
    isSelected ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-600" : "border-gray-300 hover:bg-indigo-50 hover:border-indigo-400 text-gray-800",
    isToday && !isSelected ? "ring-1 ring-indigo-300" : ""
  ].join(" ");
}
function selectDay(day){
  const d = new Date(Date.UTC(viewDate.value.getUTCFullYear(), viewDate.value.getUTCMonth(), day));
  selectedISO.value = toISO(d);
  emit('update:modelValue', selectedISO.value);
}
function apply(){
  if (selectedISO.value) emit('apply', selectedISO.value);
}
</script>



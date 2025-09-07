// Example: How to determine if sales are from today, tomorrow, or any specific date

// Method 1: Using ISO Date String (Recommended)
function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // Returns "2024-01-30"
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0]; // Returns "2024-01-31"
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0]; // Returns "2024-01-29"
}

// Method 2: Date Comparison Functions
function isToday(dateString) {
  return dateString === getTodayDate();
}

function isTomorrow(dateString) {
  return dateString === getTomorrowDate();
}

function isYesterday(dateString) {
  return dateString === getYesterdayDate();
}

// Method 3: Date Range Functions
function isWithinDateRange(dateString, startDate, endDate) {
  return dateString >= startDate && dateString <= endDate;
}

function isThisWeek(dateString) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];
  
  return isWithinDateRange(dateString, startDate, endDate);
}

function isThisMonth(dateString) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const startDate = startOfMonth.toISOString().split('T')[0];
  const endDate = endOfMonth.toISOString().split('T')[0];
  
  return isWithinDateRange(dateString, startDate, endDate);
}

// Method 4: Human-readable Date Labels
function getDateLabel(dateString) {
  if (isToday(dateString)) return 'Today';
  if (isTomorrow(dateString)) return 'Tomorrow';
  if (isYesterday(dateString)) return 'Yesterday';
  
  // For other dates, return formatted date
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Method 5: Sales Analysis Functions
function analyzeSalesByDate(salesData) {
  const today = getTodayDate();
  const tomorrow = getTomorrowDate();
  const yesterday = getYesterdayDate();
  
  const analysis = {
    today: {
      date: today,
      sales: salesData.filter(sale => sale.date === today),
      total: 0,
      count: 0
    },
    tomorrow: {
      date: tomorrow,
      sales: salesData.filter(sale => sale.date === tomorrow),
      total: 0,
      count: 0
    },
    yesterday: {
      date: yesterday,
      sales: salesData.filter(sale => sale.date === yesterday),
      total: 0,
      count: 0
    },
    thisWeek: {
      sales: salesData.filter(sale => isThisWeek(sale.date)),
      total: 0,
      count: 0
    },
    thisMonth: {
      sales: salesData.filter(sale => isThisMonth(sale.date)),
      total: 0,
      count: 0
    }
  };
  
  // Calculate totals
  Object.keys(analysis).forEach(key => {
    analysis[key].total = analysis[key].sales.reduce((sum, sale) => sum + sale.total, 0);
    analysis[key].count = analysis[key].sales.length;
  });
  
  return analysis;
}

// Method 6: Real-time Date Checking
function getCurrentDateTime() {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0],
    timestamp: now.getTime(),
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    isWeekend: now.getDay() === 0 || now.getDay() === 6
  };
}

// Example Usage:
const sampleSales = [
  { id: 1, date: '2024-01-30', total: 100 }, // Today
  { id: 2, date: '2024-01-31', total: 150 }, // Tomorrow
  { id: 3, date: '2024-01-29', total: 80 },  // Yesterday
  { id: 4, date: '2024-01-25', total: 200 }, // Last week
];

console.log('=== Date Determination Examples ===');

// Check specific dates
console.log('Today:', getTodayDate());
console.log('Tomorrow:', getTomorrowDate());
console.log('Yesterday:', getYesterdayDate());

// Check if sales are from specific dates
sampleSales.forEach(sale => {
  console.log(`Sale ${sale.id} (${sale.date}):`);
  console.log(`  - Is Today: ${isToday(sale.date)}`);
  console.log(`  - Is Tomorrow: ${isTomorrow(sale.date)}`);
  console.log(`  - Is Yesterday: ${isYesterday(sale.date)}`);
  console.log(`  - Label: ${getDateLabel(sale.date)}`);
  console.log(`  - This Week: ${isThisWeek(sale.date)}`);
  console.log(`  - This Month: ${isThisMonth(sale.date)}`);
});

// Analyze sales by date
const analysis = analyzeSalesByDate(sampleSales);
console.log('\n=== Sales Analysis ===');
console.log('Today:', analysis.today);
console.log('Tomorrow:', analysis.tomorrow);
console.log('Yesterday:', analysis.yesterday);
console.log('This Week:', analysis.thisWeek);
console.log('This Month:', analysis.thisMonth);

// Current date/time info
const currentInfo = getCurrentDateTime();
console.log('\n=== Current Date/Time ===');
console.log(currentInfo);

module.exports = {
  getTodayDate,
  getTomorrowDate,
  getYesterdayDate,
  isToday,
  isTomorrow,
  isYesterday,
  isWithinDateRange,
  isThisWeek,
  isThisMonth,
  getDateLabel,
  analyzeSalesByDate,
  getCurrentDateTime
};

const ExcelJS = require('exceljs');

// Mock sales data - in a real app, this would come from your database
const mockSalesData = [
  {
    id: 1,
    number: '001',
    time: '14:30',
    date: '2024-01-15',
    table: 'Table 1',
    status: 'Completed',
    total: 450,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 1, name: 'Grilled Chicken', quantity: 2, price: 150 },
      { id: 2, name: 'French Fries', quantity: 1, price: 80 },
      { id: 3, name: 'Soft Drink', quantity: 2, price: 35 }
    ],
    completedAt: '2024-01-15T14:45:00'
  },
  {
    id: 2,
    number: '002',
    time: '14:25',
    date: '2024-01-15',
    table: 'Table 3',
    status: 'Completed',
    total: 320,
    paymentMethod: 'cashless',
    discount: 10,
    items: [
      { id: 4, name: 'Beef Steak', quantity: 1, price: 200 },
      { id: 5, name: 'Rice', quantity: 1, price: 30 },
      { id: 6, name: 'Iced Tea', quantity: 1, price: 45 },
      { id: 7, name: 'Soup', quantity: 1, price: 45 }
    ],
    completedAt: '2024-01-15T14:40:00'
  },
  {
    id: 3,
    number: '003',
    time: '14:20',
    date: '2024-01-15',
    table: 'Table 5',
    status: 'Completed',
    total: 280,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 8, name: 'Fish Fillet', quantity: 1, price: 180 },
      { id: 9, name: 'Vegetables', quantity: 1, price: 60 },
      { id: 10, name: 'Water', quantity: 1, price: 20 },
      { id: 11, name: 'Dessert', quantity: 1, price: 20 }
    ],
    completedAt: '2024-01-15T14:35:00'
  },
  {
    id: 4,
    number: '004',
    time: '15:30',
    date: '2024-01-16',
    table: 'Table 2',
    status: 'Completed',
    total: 380,
    paymentMethod: 'cashless',
    discount: 20,
    items: [
      { id: 12, name: 'Pork Chop', quantity: 1, price: 180 },
      { id: 13, name: 'Mashed Potatoes', quantity: 1, price: 60 },
      { id: 14, name: 'Gravy', quantity: 1, price: 20 },
      { id: 15, name: 'Coffee', quantity: 1, price: 30 },
      { id: 16, name: 'Cheesecake', quantity: 1, price: 90 }
    ],
    completedAt: '2024-01-16T15:45:00'
  },
  {
    id: 5,
    number: '005',
    time: '16:15',
    date: '2024-01-16',
    table: 'Table 4',
    status: 'Completed',
    total: 250,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 17, name: 'Chicken Salad', quantity: 1, price: 120 },
      { id: 18, name: 'Bread Roll', quantity: 2, price: 15 },
      { id: 19, name: 'Orange Juice', quantity: 1, price: 40 },
      { id: 20, name: 'Ice Cream', quantity: 1, price: 60 }
    ],
    completedAt: '2024-01-16T16:30:00'
  },
  // Add today's sales data for dashboard functionality
  {
    id: 6,
    number: '006',
    time: '10:30',
    date: new Date().toISOString().split('T')[0], // Today's date
    table: 'Table 1',
    status: 'Completed',
    total: 450,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 21, name: 'Grilled Chicken', quantity: 2, price: 150 },
      { id: 22, name: 'French Fries', quantity: 1, price: 80 },
      { id: 23, name: 'Soft Drink', quantity: 2, price: 35 }
    ],
    completedAt: new Date().toISOString()
  },
  {
    id: 7,
    number: '007',
    time: '11:15',
    date: new Date().toISOString().split('T')[0], // Today's date
    table: 'Table 2',
    status: 'Completed',
    total: 320,
    paymentMethod: 'cashless',
    discount: 10,
    items: [
      { id: 24, name: 'Beef Steak', quantity: 1, price: 200 },
      { id: 25, name: 'Rice', quantity: 1, price: 30 },
      { id: 26, name: 'Iced Tea', quantity: 1, price: 45 },
      { id: 27, name: 'Soup', quantity: 1, price: 45 }
    ],
    completedAt: new Date().toISOString()
  },
  {
    id: 8,
    number: '008',
    time: '12:45',
    date: new Date().toISOString().split('T')[0], // Today's date
    table: 'Table 3',
    status: 'Completed',
    total: 280,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 28, name: 'Fish Fillet', quantity: 1, price: 180 },
      { id: 29, name: 'Vegetables', quantity: 1, price: 60 },
      { id: 30, name: 'Water', quantity: 1, price: 20 },
      { id: 31, name: 'Dessert', quantity: 1, price: 20 }
    ],
    completedAt: new Date().toISOString()
  },
  {
    id: 9,
    number: '009',
    time: '14:20',
    date: new Date().toISOString().split('T')[0], // Today's date
    table: 'Table 4',
    status: 'Completed',
    total: 380,
    paymentMethod: 'cashless',
    discount: 20,
    items: [
      { id: 32, name: 'Pork Chop', quantity: 1, price: 180 },
      { id: 33, name: 'Mashed Potatoes', quantity: 1, price: 60 },
      { id: 34, name: 'Gravy', quantity: 1, price: 20 },
      { id: 35, name: 'Coffee', quantity: 1, price: 30 },
      { id: 36, name: 'Cheesecake', quantity: 1, price: 90 }
    ],
    completedAt: new Date().toISOString()
  },
  {
    id: 10,
    number: '010',
    time: '15:30',
    date: new Date().toISOString().split('T')[0], // Today's date
    table: 'Table 5',
    status: 'Completed',
    total: 250,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 37, name: 'Chicken Salad', quantity: 1, price: 120 },
      { id: 38, name: 'Bread Roll', quantity: 2, price: 15 },
      { id: 39, name: 'Orange Juice', quantity: 1, price: 40 },
      { id: 40, name: 'Ice Cream', quantity: 1, price: 60 }
    ],
    completedAt: new Date().toISOString()
  },
  // Add some recent sales for the weekly chart
  {
    id: 11,
    number: '011',
    time: '18:45',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    table: 'Table 1',
    status: 'Completed',
    total: 520,
    paymentMethod: 'cashless',
    discount: 15,
    items: [
      { id: 41, name: 'Grilled Chicken', quantity: 2, price: 150 },
      { id: 42, name: 'French Fries', quantity: 2, price: 80 },
      { id: 43, name: 'Soft Drink', quantity: 3, price: 35 },
      { id: 44, name: 'Dessert', quantity: 1, price: 20 }
    ],
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 12,
    number: '012',
    time: '19:15',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    table: 'Table 2',
    status: 'Completed',
    total: 180,
    paymentMethod: 'cash',
    discount: 0,
    items: [
      { id: 45, name: 'Beef Steak', quantity: 1, price: 200 },
      { id: 46, name: 'Rice', quantity: 1, price: 30 },
      { id: 47, name: 'Iced Tea', quantity: 1, price: 45 }
    ],
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper functions for date analysis
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getTomorrowDate() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
}

function getYesterdayDate() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return today.toISOString().split('T')[0];
}

function getDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateString === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateString === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

function isToday(dateString) {
  return dateString === getTodayDate();
}

function isTomorrow(dateString) {
  return dateString === getTomorrowDate();
}

function isYesterday(dateString) {
  return dateString === getYesterdayDate();
}

// Get sales for specific date
function getSalesForDate(dateString) {
  return mockSalesData.filter(order => order.date === dateString);
}

// New API endpoint to demonstrate date determination
async function getSalesDateAnalysis(req, res) {
  try {
    const today = getTodayDate();
    const tomorrow = getTomorrowDate();
    const yesterday = getYesterdayDate();
    
    // Get sales for different dates
    const todaySales = getSalesForDate(today);
    const tomorrowSales = getSalesForDate(tomorrow);
    const yesterdaySales = getSalesForDate(yesterday);
    
    // Calculate totals
    const todayTotal = todaySales.reduce((sum, order) => sum + order.total, 0);
    const tomorrowTotal = tomorrowSales.reduce((sum, order) => sum + order.total, 0);
    const yesterdayTotal = yesterdaySales.reduce((sum, order) => sum + order.total, 0);
    
    // Get all sales with date labels
    const allSalesWithLabels = mockSalesData.map(order => ({
      ...order,
      dateLabel: getDateLabel(order.date),
      isToday: isToday(order.date),
      isTomorrow: isTomorrow(order.date),
      isYesterday: isYesterday(order.date)
    }));
    
    res.json({
      dateInfo: {
        today: {
          date: today,
          label: 'Today',
          sales: todaySales,
          total: todayTotal,
          count: todaySales.length
        },
        tomorrow: {
          date: tomorrow,
          label: 'Tomorrow',
          sales: tomorrowSales,
          total: tomorrowTotal,
          count: tomorrowSales.length
        },
        yesterday: {
          date: yesterday,
          label: 'Yesterday',
          sales: yesterdaySales,
          total: yesterdayTotal,
          count: yesterdaySales.length
        }
      },
      allSales: allSalesWithLabels,
      summary: {
        totalSales: mockSalesData.length,
        totalRevenue: mockSalesData.reduce((sum, order) => sum + order.total, 0),
        todaySales: todaySales.length,
        todayRevenue: todayTotal,
        tomorrowSales: tomorrowSales.length,
        tomorrowRevenue: tomorrowTotal,
        yesterdaySales: yesterdaySales.length,
        yesterdayRevenue: yesterdayTotal
      }
    });
  } catch (error) {
    console.error('Error analyzing sales dates:', error);
    res.status(500).json({ error: 'Failed to analyze sales dates', details: error.message });
  }
}

async function generateSalesReport(req, res) {
  try {
    const { startDate, endDate, reportType = 'detailed' } = req.query;
    
    // Filter data by date range if provided
    let filteredData = mockSalesData;
    if (startDate && endDate) {
      filteredData = mockSalesData.filter(order => 
        order.date >= startDate && order.date <= endDate
      );
    }

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Set up headers based on report type
    if (reportType === 'summary') {
      // Summary report - just totals and key metrics
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Orders', key: 'totalOrders', width: 15 },
        { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
        { header: 'Average Order Value', key: 'avgOrderValue', width: 20 }
      ];

      // Group by date and calculate summary
      const summaryData = {};
      filteredData.forEach(order => {
        if (!summaryData[order.date]) {
          summaryData[order.date] = {
            date: order.date,
            totalOrders: 0,
            totalRevenue: 0,
            orders: []
          };
        }
        summaryData[order.date].totalOrders++;
        summaryData[order.date].totalRevenue += order.total;
        summaryData[order.date].orders.push(order);
      });

      // Add summary rows
      Object.values(summaryData).forEach(summary => {
        worksheet.addRow({
          date: summary.date,
          totalOrders: summary.totalOrders,
          totalRevenue: `₱${summary.totalRevenue.toFixed(2)}`,
          avgOrderValue: `₱${(summary.totalRevenue / summary.totalOrders).toFixed(2)}`
        });
      });

    } else {
      // Detailed report - all order details
      worksheet.columns = [
        { header: 'Order #', key: 'orderNumber', width: 10 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Time', key: 'time', width: 10 },
        { header: 'Table', key: 'table', width: 10 },
        { header: 'Items', key: 'items', width: 40 },
        { header: 'Total', key: 'total', width: 12 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      // Add data rows
      filteredData.forEach(order => {
        const itemsList = order.items.map(item => 
          `${item.quantity}x ${item.name}`
        ).join(', ');

        worksheet.addRow({
          orderNumber: order.number,
          date: order.date,
          time: order.time,
          table: order.table,
          items: itemsList,
          total: `₱${order.total.toFixed(2)}`,
          status: order.status
        });
      });
    }

    // Add a second worksheet for item analysis
    const itemWorksheet = workbook.addWorksheet('Item Analysis');
    
    // Calculate item sales
    const itemSales = {};
    filteredData.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = {
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
            averagePrice: item.price
          };
        }
        itemSales[item.name].totalQuantity += item.quantity;
        itemSales[item.name].totalRevenue += item.price * item.quantity;
      });
    });

    // Sort items by total revenue
    const sortedItems = Object.values(itemSales).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Set up item analysis worksheet
    itemWorksheet.columns = [
      { header: 'Item Name', key: 'name', width: 25 },
      { header: 'Total Quantity Sold', key: 'totalQuantity', width: 20 },
      { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
      { header: 'Average Price', key: 'averagePrice', width: 15 }
    ];

    // Add item data
    sortedItems.forEach(item => {
      itemWorksheet.addRow({
        name: item.name,
        totalQuantity: item.totalQuantity,
        totalRevenue: `₱${item.totalRevenue.toFixed(2)}`,
        averagePrice: `₱${item.averagePrice.toFixed(2)}`
      });
    });

    // Style the item analysis header row
    itemWorksheet.getRow(1).font = { bold: true };
    itemWorksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add a third worksheet for summary metrics
    const summaryWorksheet = workbook.addWorksheet('Summary');
    
    // Calculate key metrics
    const totalRevenue = filteredData.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredData.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueItems = new Set();
    const totalItemsSold = filteredData.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    filteredData.forEach(order => {
      order.items.forEach(item => uniqueItems.add(item.name));
    });

    // Add summary data
    summaryWorksheet.addRow(['Sales Report Summary']);
    summaryWorksheet.addRow([]);
    summaryWorksheet.addRow(['Metric', 'Value']);
    summaryWorksheet.addRow(['Total Orders', totalOrders]);
    summaryWorksheet.addRow(['Total Revenue', `₱${totalRevenue.toFixed(2)}`]);
    summaryWorksheet.addRow(['Average Order Value', `₱${averageOrderValue.toFixed(2)}`]);
    summaryWorksheet.addRow(['Total Items Sold', totalItemsSold]);
    summaryWorksheet.addRow(['Unique Items', uniqueItems.size]);
    summaryWorksheet.addRow(['Date Range', `${startDate || 'All'} to ${endDate || 'All'}`]);
    summaryWorksheet.addRow(['Report Generated', new Date().toLocaleString()]);

    // Style the summary worksheet
    summaryWorksheet.getRow(1).font = { bold: true, size: 16 };
    summaryWorksheet.getRow(3).font = { bold: true };
    summaryWorksheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set column widths for summary
    summaryWorksheet.getColumn(1).width = 25;
    summaryWorksheet.getColumn(2).width = 20;

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add totals row for detailed reports
    if (reportType === 'detailed') {
      const totalRevenue = filteredData.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = filteredData.length;
      
      worksheet.addRow({}); // Empty row
      worksheet.addRow({
        orderNumber: '',
        date: '',
        time: '',
        table: '',
        items: `TOTAL (${totalOrders} orders)`,
        total: `₱${totalRevenue.toFixed(2)}`,
        status: ''
      });

      // Style the totals row
      const totalsRow = worksheet.getRow(worksheet.rowCount);
      totalsRow.font = { bold: true };
      totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }

    // Set response headers for file download
    const filename = `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ error: 'Failed to generate sales report', details: error.message });
  }
}

// Get dashboard analytics data
async function getDashboardAnalytics(req, res) {
  try {
    const { period = 'daily' } = req.query;
    const today = getTodayDate();
    
    // Filter today's orders
    const todayOrders = mockSalesData.filter(order => order.date === today);
    
    // Calculate sales overview data
    const salesOverview = calculateSalesOverview(period);
    
    // Calculate top selling items
    const topSellingItems = calculateTopSellingItems(todayOrders);
    
    // Calculate today's sale summary
    const todaySaleSummary = calculateTodaySaleSummary(todayOrders);
    
    res.json({
      salesOverview,
      topSellingItems,
      todaySaleSummary
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics', details: error.message });
  }
}

// Calculate sales overview data for different periods
function calculateSalesOverview(period) {
  const today = getTodayDate();
  
  if (period === 'daily') {
    // Last 7 days
    const dailyData = [];
    const labels = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayOrders = mockSalesData.filter(order => order.date === dateStr);
      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      
      dailyData.push(dayRevenue);
      labels.push(dayName);
    }
    
    return {
      labels,
      data: dailyData
    };
  } else if (period === 'weekly') {
    // Last 4 weeks
    const weeklyData = [];
    const labels = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * i));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekOrders = mockSalesData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= weekStart && orderDate <= weekEnd;
      });
      
      const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);
      
      weeklyData.push(weekRevenue);
      labels.push(`Week ${4 - i}`);
    }
    
    return {
      labels,
      data: weeklyData
    };
  } else {
    // Last 7 months
    const monthlyData = [];
    const labels = [];
    
    for (let i = 6; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      
      const monthOrders = mockSalesData.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() === month.getMonth() && 
               orderDate.getFullYear() === month.getFullYear();
      });
      
      const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total, 0);
      
      monthlyData.push(monthRevenue);
      labels.push(monthName);
    }
    
    return {
      labels,
      data: monthlyData
    };
  }
}

// Calculate top selling items
function calculateTopSellingItems(orders) {
  const itemSales = {};
  
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = {
          name: item.name,
          sold: 0,
          revenue: 0
        };
      }
      itemSales[item.name].sold += item.quantity;
      itemSales[item.name].revenue += item.price * item.quantity;
    });
  });
  
  // Sort by quantity sold and return top 5
  return Object.values(itemSales)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
}

// Calculate today's sale summary
function calculateTodaySaleSummary(orders) {
  const summary = {
    cashSale: 0,
    cashlessSale: 0,
    totalDiscount: 0,
    totalSale: 0,
    items: []
  };
  
  const itemMap = new Map();
  
  orders.forEach(order => {
    // Calculate payment method totals
    if (order.paymentMethod === 'cash') {
      summary.cashSale += order.total;
    } else {
      summary.cashlessSale += order.total;
    }
    
    summary.totalDiscount += order.discount || 0;
    summary.totalSale += order.total;
    
    // Aggregate items
    order.items.forEach(item => {
      if (itemMap.has(item.name)) {
        const existing = itemMap.get(item.name);
        existing.qty += item.quantity;
        existing.total += item.price * item.quantity;
      } else {
        itemMap.set(item.name, {
          item: item.name,
          qty: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        });
      }
    });
  });
  
  summary.items = Array.from(itemMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);
  
  return summary;
}

module.exports = { 
  generateSalesReport, 
  getSalesDateAnalysis,
  getDashboardAnalytics
}; 
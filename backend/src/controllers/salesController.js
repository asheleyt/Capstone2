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
    items: [
      { id: 17, name: 'Chicken Salad', quantity: 1, price: 120 },
      { id: 18, name: 'Bread Roll', quantity: 2, price: 15 },
      { id: 19, name: 'Orange Juice', quantity: 1, price: 40 },
      { id: 20, name: 'Ice Cream', quantity: 1, price: 60 }
    ],
    completedAt: '2024-01-16T16:30:00'
  }
];

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

module.exports = { generateSalesReport }; 
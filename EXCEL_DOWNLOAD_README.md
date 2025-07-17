# Excel Sales Report Download Feature

## Overview
The admin dashboard now includes a functional "Download Excel" feature that generates comprehensive sales reports in Excel format.

## Features

### 1. Multiple Report Types
- **Detailed Report**: Complete order information including order numbers, dates, times, tables, items, totals, and status
- **Summary Report**: Daily summaries with total orders, revenue, and average order values
- **Item Analysis**: Breakdown of item sales performance
- **Summary Metrics**: Key performance indicators and statistics

### 2. Excel File Structure
The generated Excel file contains multiple worksheets:
- **Sales Report**: Main order details or summary (depending on report type)
- **Item Analysis**: Top-selling items with quantities and revenue
- **Summary**: Key metrics and report information

### 3. Data Included
- Order details (number, date, time, table, status)
- Item breakdowns with quantities and prices
- Revenue calculations
- Performance metrics
- Date filtering capabilities

## How to Use

### Frontend
1. Navigate to any admin page (Dashboard, Inventory Management, or Manage Users)
2. Click on "Download Excel" or "Download Sales Report" in the navigation
3. The file will automatically download with the current date in the filename

### Backend API
The Excel generation is handled by the `/api/sales/report` endpoint:

```
GET /api/sales/report?reportType=detailed&startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `reportType`: "detailed" or "summary" (default: "detailed")
- `startDate`: Start date for filtering (optional)
- `endDate`: End date for filtering (optional)

## Technical Implementation

### Backend
- **Controller**: `backend/src/controllers/salesController.js`
- **Routes**: `backend/src/routes/sales.js`
- **Dependency**: `exceljs` for Excel file generation

### Frontend
- **Pages Updated**: 
  - `AdminDashboard.vue`
  - `InventoryOrders.vue` 
  - `ManageUsers.vue`
- **Function**: `downloadSalesReport()` handles the API call and file download

## File Format
- **Format**: `.xlsx` (Excel 2007+)
- **Filename**: `sales_report_YYYY-MM-DD.xlsx`
- **Content**: Multiple worksheets with formatted data and styling

## Future Enhancements
- Real-time data integration with database
- Custom date range selection in UI
- Additional report types (hourly, weekly, monthly)
- Export to PDF option
- Email report functionality
- Scheduled report generation

## Dependencies
- Backend: `exceljs` (for Excel generation)
- Frontend: Standard browser APIs for file download 
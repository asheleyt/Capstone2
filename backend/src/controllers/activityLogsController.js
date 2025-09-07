const { getActivityLogs, getActivityLogsCount, getActivityStats } = require('../models/activityLogs');

// Get activity logs with filtering and pagination
async function getActivityLogsHandler(req, res) {
  try {
    const {
      userId,
      action,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 20
    } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;
    
    // Build filters object
    const filters = {};
    if (userId) filters.userId = parseInt(userId);
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      filters.endDate = endDateTime;
    }
    if (status) filters.status = status;
    
    // Add pagination to filters
    filters.limit = limitNum;
    filters.offset = offset;
    
    // Get logs and count
    const [logs, totalCount] = await Promise.all([
      getActivityLogs(filters),
      getActivityLogsCount(filters)
    ]);
    
    // Format response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      user: {
        id: log.user_id,
        username: log.username,
        role: log.role
      },
      action: log.action,
      description: log.description,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      status: log.status,
      metadata: log.metadata
    }));
    
    res.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  }
}

// Get activity statistics
async function getActivityStatsHandler(req, res) {
  try {
    const stats = await getActivityStats();
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity statistics',
      error: error.message
    });
  }
}

// Get available actions for filtering
async function getAvailableActionsHandler(req, res) {
  try {
    const actions = [
      'login',
      'logout',
      'create_order',
      'update_order',
      'delete_order',
      'add_inventory',
      'update_inventory',
      'delete_inventory',
      'create_user',
      'update_user',
      'delete_user',
      'download_report'
    ];
    
    res.json({
      success: true,
      actions: actions
    });
  } catch (error) {
    console.error('Error getting available actions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available actions',
      error: error.message
    });
  }
}

module.exports = {
  getActivityLogsHandler,
  getActivityStatsHandler,
  getAvailableActionsHandler
};

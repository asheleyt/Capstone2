const { logActivity } = require('../models/activityLogs');

// Middleware to log user activities
function createActivityLogger(action, descriptionGenerator) {
  return async (req, res, next) => {
    // Store original res.json to intercept the response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the activity after the response is sent
      setImmediate(async () => {
        try {
          // Only log if user is authenticated
          if (req.user && req.user.id) {
            const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
            const userAgent = req.get('User-Agent');
            
            // Determine status based on response
            const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';
            
            // Generate description
            let description = action;
            if (typeof descriptionGenerator === 'function') {
              description = descriptionGenerator(req, data);
            } else if (typeof descriptionGenerator === 'string') {
              description = descriptionGenerator;
            }
            
            // Extract relevant metadata
            const metadata = {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode,
              timestamp: new Date().toISOString()
            };
            
            // Add request-specific metadata
            if (req.body && Object.keys(req.body).length > 0) {
              // Don't log sensitive information like passwords
              const sanitizedBody = { ...req.body };
              if (sanitizedBody.password) delete sanitizedBody.password;
              if (sanitizedBody.newPassword) delete sanitizedBody.newPassword;
              if (sanitizedBody.confirmPassword) delete sanitizedBody.confirmPassword;
              metadata.requestBody = sanitizedBody;
            }
            
            if (req.params && Object.keys(req.params).length > 0) {
              metadata.params = req.params;
            }
            
            if (req.query && Object.keys(req.query).length > 0) {
              metadata.query = req.query;
            }
            
            await logActivity(
              req.user.id,
              action,
              description,
              ipAddress,
              userAgent,
              status,
              metadata
            );
          }
        } catch (error) {
          console.error('Error logging activity:', error);
          // Don't fail the request if logging fails
        }
      });
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Specific activity loggers for common actions
const activityLoggers = {
  // User authentication
  login: createActivityLogger('login', (req) => `User logged in from ${req.ip}`),
  logout: createActivityLogger('logout', (req) => `User logged out`),
  
  // User management
  createUser: createActivityLogger('create_user', (req, data) => 
    `Created user: ${req.body.username || data?.user?.username || 'Unknown'}`
  ),
  updateUser: createActivityLogger('update_user', (req, data) => 
    `Updated user: ${req.params.id || data?.user?.id || 'Unknown'}`
  ),
  deleteUser: createActivityLogger('delete_user', (req, data) => 
    `Deleted user: ${req.params.id || 'Unknown'}`
  ),
  
  // Order management
  createOrder: createActivityLogger('create_order', (req, data) => 
    `Created order #${data?.order?.id || 'Unknown'}`
  ),
  updateOrder: createActivityLogger('update_order', (req, data) => 
    `Updated order #${req.params.id || data?.order?.id || 'Unknown'}`
  ),
  deleteOrder: createActivityLogger('delete_order', (req, data) => 
    `Deleted order #${req.params.id || 'Unknown'}`
  ),
  
  // Inventory management
  addInventory: createActivityLogger('add_inventory', (req, data) => 
    `Added inventory item: ${req.body.name || data?.item?.name || 'Unknown'}`
  ),
  updateInventory: createActivityLogger('update_inventory', (req, data) => 
    `Updated inventory item: ${req.params.id || data?.item?.id || 'Unknown'}`
  ),
  deleteInventory: createActivityLogger('delete_inventory', (req, data) => 
    `Deleted inventory item: ${req.params.id || 'Unknown'}`
  ),
  
  // Sales and reports
  downloadReport: createActivityLogger('download_report', (req) => 
    `Downloaded ${req.query.reportType || 'sales'} report`
  ),
  
  // Generic logger for custom actions
  custom: (action, description) => createActivityLogger(action, description)
};

module.exports = {
  createActivityLogger,
  activityLoggers
};

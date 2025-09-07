const pool = require('../db');

// Initialize activity logs table
async function initActivityLogsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address INET,
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'success',
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(query);
    console.log('Activity logs table initialized successfully');
    
    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `);
    
    console.log('Activity logs indexes created successfully');
  } catch (error) {
    console.error('Error initializing activity logs table:', error);
    throw error;
  }
}

// Log an activity
async function logActivity(userId, action, description, ipAddress, userAgent, status = 'success', metadata = null) {
  try {
    const query = `
      INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent, status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [userId, action, description, ipAddress, userAgent, status, metadata];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

// Get activity logs with pagination and filtering
async function getActivityLogs(filters = {}) {
  try {
    let query = `
      SELECT 
        al.*,
        u.username,
        u.role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;
    
    // Add filters
    if (filters.userId) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      values.push(filters.userId);
    }
    
    if (filters.action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      values.push(filters.action);
    }
    
    if (filters.startDate) {
      paramCount++;
      query += ` AND al.created_at >= $${paramCount}`;
      values.push(filters.startDate);
    }
    
    if (filters.endDate) {
      paramCount++;
      query += ` AND al.created_at <= $${paramCount}`;
      values.push(filters.endDate);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND al.status = $${paramCount}`;
      values.push(filters.status);
    }
    
    // Add ordering
    query += ` ORDER BY al.created_at DESC`;
    
    // Add pagination
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }
    
    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
}

// Get activity logs count for pagination
async function getActivityLogsCount(filters = {}) {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;
    
    // Add same filters as getActivityLogs
    if (filters.userId) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      values.push(filters.userId);
    }
    
    if (filters.action) {
      paramCount++;
      query += ` AND al.action = $${paramCount}`;
      values.push(filters.action);
    }
    
    if (filters.startDate) {
      paramCount++;
      query += ` AND al.created_at >= $${paramCount}`;
      values.push(filters.startDate);
    }
    
    if (filters.endDate) {
      paramCount++;
      query += ` AND al.created_at <= $${paramCount}`;
      values.push(filters.endDate);
    }
    
    if (filters.status) {
      paramCount++;
      query += ` AND al.status = $${paramCount}`;
      values.push(filters.status);
    }
    
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error getting activity logs count:', error);
    throw error;
  }
}

// Get activity statistics
async function getActivityStats() {
  try {
    const query = `
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
      FROM activity_logs
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error getting activity stats:', error);
    throw error;
  }
}

module.exports = {
  initActivityLogsTable,
  logActivity,
  getActivityLogs,
  getActivityLogsCount,
  getActivityStats
};

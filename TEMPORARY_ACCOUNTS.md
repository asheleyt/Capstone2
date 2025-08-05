# Temporary Accounts for Testing

This system automatically creates temporary accounts when the database is first initialized. These accounts are for testing purposes only and should be removed before production deployment.

## Default Account

The following account is automatically created when you first run the application:

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin
- **Access:** Admin Dashboard, User Management, All Features

**Note:** This temporary admin account allows you to access the admin dashboard where you can create additional user accounts for cashier and kitchen staff through the user management system.

## How to Use

1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to the login page
4. Use any of the above credentials to log in

## Important Notes

- These accounts are created automatically when the database is first initialized
- The accounts will only be created if they don't already exist
- You can see the creation messages in the backend console when the server starts
- These are temporary accounts for development/testing only
- **Remember to remove this functionality before production deployment**

## Removing Temporary Accounts

When you're ready to deploy to production, you should:

1. Remove the `createDefaultAccounts()` call from the `initUserTable()` function in `backend/src/models/user.js`
2. Delete the `createDefaultAccounts()` function entirely
3. Remove the `bcrypt` import if it's not used elsewhere
4. Create proper user accounts through the admin dashboard

## Security Warning

These are simple passwords for testing purposes. In a real production environment, you should:
- Use strong, unique passwords
- Implement proper password policies
- Use environment variables for sensitive data
- Implement proper authentication and authorization 
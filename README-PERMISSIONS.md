# Neptune Holidays Permission System

This document outlines the permission structure in the Neptune Holidays API system.

## Permission Design Philosophy

The permission system follows these key principles:

1. **Separation of Concerns**: Permissions are divided by functionality and risk level
2. **Principle of Least Privilege**: Users receive only permissions necessary for their role
3. **Delete Operations Separation**: Delete operations are separated from other management operations for enhanced security control
4. **Hierarchical Structure**: Permissions are organized in a logical hierarchy

## Permission Categories

### User Management
- `viewUsers`: View user details
- `manageUsers`: Create and update users (explicitly excludes deletion)
- `deleteUsers`: Delete users (high-risk operation, separated for accountability)

### Admin Management
- `admin:view`: View admin details
- `admin:manage`: Create and update admins (explicitly excludes deletion)
- `admin:delete`: Delete admins (high-risk operation, separated for accountability)
- `registerAdmins`: Special permission to register new admins (restricted to superAdmins by default)

### Role Management
- `viewRoles`: View role details
- `manageRoles`: Create and update roles (explicitly excludes deletion)
- `deleteRoles`: Delete roles (high-risk operation, separated for accountability)

### Permission Management
- `viewPermissions`: View all system permissions
- `assignPermissions`: Assign permissions to roles

### Content Management
- `viewContent`: View content details
- `manageContent`: Create and update content (explicitly excludes deletion)
- `deleteContent`: Delete content (high-risk operation, separated for accountability)

### System Management
- `viewSystemHealth`: View system health information
- `manageSystemSettings`: Modify system-level settings
- `viewLogs`: Access system logs
- `viewSessions`: View active user sessions
- `manageSessions`: Manage (create/revoke) user sessions

## Roles

### Built-in Roles

1. **superAdmin**
   - Has all permissions
   - Can create other admins

2. **admin**
   - Has most management permissions
   - Cannot delete high-value assets without specific permissions
   - Cannot create other admins (requires the specific `registerAdmins` permission)

3. **contentManager**
   - `viewUsers`
   - `viewContent`
   - `manageContent`

4. **support**
   - `viewUsers`
   - `viewContent`
   - `viewSystemHealth`
   - `viewSessions`
   - `manageSessions`

## Implementation Details

### Permission Checking

Permissions are validated using middleware:

```javascript
// Example permission middleware
const hasPermission = (permission) => (req, res, next) => {
  if (!req.user || !req.user.permissions.includes(permission)) {
    return res.status(403).json({ 
      error: "Forbidden", 
      message: `Missing required permission: ${permission}` 
    });
  }
  next();
};

// Usage in routes
router.delete('/users/:userId', 
  authenticate, 
  hasPermission('deleteUsers'), 
  userController.deleteUser
);
```

### Role-Based Checks

For role-specific operations:

```javascript
// Example role middleware
const hasRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ 
      error: "Forbidden", 
      message: `Requires ${role} role` 
    });
  }
  next();
};

// Usage in routes with additional permission check
router.post('/admin/register', 
  authenticate, 
  (req, res, next) => {
    // Either superAdmin role OR specific permission is required
    if (req.user.role === 'superAdmin' || req.user.permissions.includes('registerAdmins')) {
      return next();
    }
    return res.status(403).json({ 
      error: "Forbidden", 
      message: "Requires superAdmin role or registerAdmins permission" 
    });
  },
  adminController.registerAdmin
);
```

## Best Practices

1. **Always separate delete operations** from other management operations for better security control
2. **Limit admin creation** to superAdmins or specifically authorized admins with `registerAdmins` permission
3. **Review permission assignments** regularly
4. **Maintain audit logs** for all permission-related changes
5. **Implement role-based access control (RBAC)** consistently throughout the application

## Testing Permissions

You can test permissions using the Postman collection by:

1. Logging in with different user types
2. Attempting operations with and without required permissions
3. Verifying correct access control behavior 
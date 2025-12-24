# Role-Based Authentication & Navigation

This document describes the role-based authentication and navigation system implemented in the Kapoor & Sons Demo Booking mobile app.

## Overview

The app implements a comprehensive role-based access control (RBAC) system with three distinct user roles:
- **Customer** (default role)
- **Staff** (installers/technicians)
- **Admin** (administrators)

## Architecture

### 1. Authentication Context (`src/context/AuthContext.tsx`)

The `AuthContext` provides global authentication state management:

**State:**
- `user`: Current user object with role information
- `token`: JWT authentication token
- `isLoading`: Loading state for async operations
- `isAuthenticated`: Boolean indicating if user is logged in

**Methods:**
- `login(email, password)`: Authenticate user and store token
- `register(name, email, password, phone?)`: Register new user
- `logout()`: Clear authentication and navigate to login
- `refreshUser()`: Refresh user data from server

**Token Storage:**
- Uses `expo-secure-store` for secure JWT token storage
- Automatically loads stored token on app start
- Validates token with backend on app launch
- Clears invalid tokens automatically

### 2. Role-Based Navigation (`src/navigation/AppNavigator.tsx`)

The `AppNavigator` conditionally renders different navigation stacks based on user authentication and role:

**Navigation Flow:**
```
App Start
  ↓
Check Authentication (AuthContext)
  ↓
├─ Not Authenticated → AuthStack (Login, Register)
│
└─ Authenticated → Check Role
    ├─ customer → CustomerStack
    ├─ staff → StaffStack
    └─ admin → AdminStack
```

### 3. User Roles & Access

#### Customer Role
**Access:**
- Create new demo bookings
- View own bookings
- Update profile

**Screens:**
- CustomerDashboard
- BookingForm
- MyBookings
- Profile

**Color Theme:** Blue (#007AFF)

#### Staff Role
**Access:**
- View assigned demo installations
- View all bookings
- Update installation status
- Manage schedule

**Screens:**
- StaffDashboard
- AllBookings
- MyAssignments
- Profile

**Color Theme:** Green (#28a745)

#### Admin Role
**Access:**
- Full access to all features
- View all bookings
- Manage users (create, edit, delete)
- View analytics and reports
- System settings
- Activity logs

**Screens:**
- AdminDashboard
- AllBookings
- UserManagement
- Analytics
- SystemSettings
- ActivityLogs
- Profile

**Color Theme:** Red (#dc3545)

## API Integration

### Base URL Configuration

The API base URL is configured in `AuthContext.tsx`:

```typescript
const API_BASE_URL = "http://localhost:4000/api/v1";
```

**Important:** Update this based on your environment:
- **iOS Simulator:** `http://localhost:4000/api/v1`
- **Android Emulator:** `http://10.0.2.2:4000/api/v1`
- **Physical Device:** `http://<YOUR_IP>:4000/api/v1`

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile (requires token)

### Authorization Header

All authenticated requests include:
```
Authorization: Bearer <JWT_TOKEN>
```

This is automatically handled by axios interceptor in `AuthContext`.

## Testing

### Test Accounts

Use these accounts to test different roles:

**Customer:**
```
Email: customer@example.com
Password: password123
```

**Staff:**
```
Email: staff@example.com
Password: staff123
```

**Admin:**
```
Email: admin@example.com
Password: admin123
```

### Testing Flow

1. **Start Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Mobile App:**
   ```bash
   cd mobile
   npm start
   ```

3. **Test Login:**
   - Open app → Should show Login screen
   - Login with customer account → Should navigate to CustomerDashboard
   - Logout → Should return to Login screen
   - Login with staff account → Should navigate to StaffDashboard
   - Login with admin account → Should navigate to AdminDashboard

4. **Test Token Persistence:**
   - Login with any account
   - Close app completely
   - Reopen app → Should automatically login and show appropriate dashboard

5. **Test Invalid Token:**
   - Login successfully
   - Stop backend server
   - Close and reopen app → Should detect invalid token and show Login screen

## Security Features

### Token Security
- JWT tokens stored in `expo-secure-store` (encrypted storage)
- Tokens automatically validated on app start
- Invalid/expired tokens cleared automatically
- Automatic logout on 401 responses

### Password Security
- Passwords hashed with bcrypt on backend
- Minimum 6 characters required
- Never stored in plain text

### Role Validation
- Role checked on every navigation
- Backend validates role on every API request
- Frontend role-based UI prevents unauthorized access

## File Structure

```
mobile/src/
├── context/
│   └── AuthContext.tsx          # Global auth state management
├── navigation/
│   └── AppNavigator.tsx         # Role-based navigation
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx      # Login form
│   │   └── RegisterScreen.tsx   # Registration form
│   ├── customer/
│   │   └── CustomerDashboard.tsx
│   ├── staff/
│   │   └── StaffDashboard.tsx
│   └── admin/
│       └── AdminDashboard.tsx
└── App.tsx                      # Root component with AuthProvider
```

## Future Enhancements

### Planned Features
- [ ] Biometric authentication (Face ID / Touch ID)
- [ ] Remember me functionality
- [ ] Password reset flow
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Role-based feature flags
- [ ] Offline mode with token caching
- [ ] Push notifications for role-specific events

### Staff-Specific Features (Coming Soon)
- [ ] View assigned installations
- [ ] Update installation status
- [ ] Upload installation photos
- [ ] Digital signature capture
- [ ] Route optimization

### Admin-Specific Features (Coming Soon)
- [ ] User management (CRUD operations)
- [ ] Real-time analytics dashboard
- [ ] System configuration
- [ ] Activity logs viewer
- [ ] Export reports

## Troubleshooting

### Issue: "Network request failed"
**Solution:** Check API_BASE_URL configuration:
- iOS Simulator: Use `localhost`
- Android Emulator: Use `10.0.2.2`
- Physical Device: Use your computer's IP address

### Issue: "Token validation failed"
**Solution:** 
- Ensure backend server is running
- Check JWT_SECRET matches between frontend and backend
- Clear app data and login again

### Issue: "Cannot read property 'role' of null"
**Solution:**
- Ensure user is logged in
- Check AuthContext is properly wrapped around App
- Verify token is valid and not expired

### Issue: App stuck on loading screen
**Solution:**
- Check backend server is running
- Verify API_BASE_URL is correct
- Check network connectivity
- Clear expo cache: `expo start -c`

## Support

For issues or questions:
1. Check backend logs: `cd backend && npm start`
2. Check mobile logs: `cd mobile && npm start`
3. Review AuthContext console logs for authentication flow
4. Test API endpoints with curl or Postman

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0


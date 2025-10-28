# Admin Login Test

## Issue Fixed
The 400 Bad Request error was caused by the admin login using the same validation function as user login, which was modified to handle username-only mode.

## Root Cause
- `USERNAME_ONLY=true` was set in environment
- `validateLogin` function was modified to expect `username` instead of `email` for users
- Admin login was using the same `validateLogin` function
- Admin login always requires `email` and `password`, not `username`

## Solution
Created a separate `validateAdminLogin` function that always requires:
- `email` (valid email format)
- `password` (required)

## Test the Fix

### 1. Test Admin Login with Correct Credentials

**Endpoint**: `POST http://localhost:5000/api/admin/login`

**Request Body**:
```json
{
  "email": "joshua.giowaya@yardstik.com",
  "password": "Bleep2do.com"
}
```

**Expected Response** (200 OK):
```json
{
  "_id": "690107785c12a9e12fe802ec",
  "username": "joshua_admin",
  "email": "joshua.giowaya@yardstik.com",
  "token": "jwt_token_here"
}
```

### 2. Test Admin Login with Wrong Credentials

**Request Body**:
```json
{
  "email": "joshua.giowaya@yardstik.com",
  "password": "wrongpassword"
}
```

**Expected Response** (401 Unauthorized):
```json
{
  "message": "Invalid email or password"
}
```

### 3. Test Admin Login with Missing Fields

**Request Body**:
```json
{
  "email": "joshua.giowaya@yardstik.com"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "errors": [
    {
      "msg": "Password is required",
      "param": "password",
      "location": "body"
    }
  ]
}
```

### 4. Test Admin Login with Invalid Email

**Request Body**:
```json
{
  "email": "invalid-email",
  "password": "Bleep2do.com"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "errors": [
    {
      "msg": "Please include a valid email",
      "param": "email",
      "location": "body"
    }
  ]
}
```

## Available Admin Accounts

1. **Joshua (Original)**:
   - Email: `joshua.giowaya@gmail.com`
   - Username: `admin`
   - Password: `admin123`

2. **Joshua (Yardstik)**:
   - Email: `joshua.giowaya@yardstik.com`
   - Username: `joshua_admin`
   - Password: `Bleep2do.com`

3. **Brooks**:
   - Email: `brooks.szewczyk@yardstik.com`
   - Username: `brooks_admin`
   - Password: `0.69frghxtgwRYMM`

## Frontend Test

1. Go to admin login page
2. Enter email: `joshua.giowaya@yardstik.com`
3. Enter password: `Bleep2do.com`
4. Click login
5. Should redirect to admin dashboard

## API Test with curl

```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: 1fd3e078-75ce-4a8f-bc47-65db4ea920b3" \
  -d '{
    "email": "joshua.giowaya@yardstik.com",
    "password": "Bleep2do.com"
  }'
```

## Changes Made

1. **Created `validateAdminLogin`** in `validators.js`:
   - Always requires email and password
   - Not affected by `USERNAME_ONLY` environment variable

2. **Updated admin routes** in `adminRoutes.js`:
   - Changed from `validateLogin` to `validateAdminLogin`
   - Admin login now uses admin-specific validation

3. **Exported new validation** in `validators.js`:
   - Added `validateAdminLogin` to module exports

## Status
✅ **Fixed**: Admin login now works correctly
✅ **Tested**: Validation works for all scenarios
✅ **Verified**: Admin accounts are available
✅ **Confirmed**: No breaking changes to user login

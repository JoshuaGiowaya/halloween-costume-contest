# Manual Contest Control Test

## Environment Variable Configuration

### Backend .env
```bash
MANUAL_CONTEST_CONTROL=true
```

## Test Scenarios

### 1. Manual Control Mode Enabled
- **Environment**: `MANUAL_CONTEST_CONTROL=true`
- **Expected Behavior**:
  - Admin dashboard shows "Manual Control Mode" alert
  - Contest cards show "Manual Control" badge
  - Buttons show "Start Contest" / "Stop Contest" instead of "Start Voting" / "Stop Voting"
  - Admins can start/stop contests regardless of scheduled dates

### 2. Manual Control Mode Disabled
- **Environment**: `MANUAL_CONTEST_CONTROL=false` or not set
- **Expected Behavior**:
  - No manual control alert shown
  - No "Manual Control" badge on contest cards
  - Buttons show "Start Voting" / "Stop Voting"
  - Normal date-based contest behavior

### 3. API Endpoint Test
- **Endpoint**: `GET /api/contests/manual-control-mode`
- **Expected Response**:
  ```json
  {
    "manualControlMode": true,
    "message": "Manual contest control enabled"
  }
  ```

### 4. Admin Dashboard Features

#### When Manual Control Enabled:
- ✅ Blue info alert with detailed explanation of available controls
- ✅ Contest cards show "Manual Control" badge
- ✅ **Voting Controls**: "Start Voting" / "Stop Voting" buttons (always available)
- ✅ **Force Controls**: "Force Start Contest" / "Force Stop Contest" buttons (override schedule)
- ✅ Visual distinction between voting and force controls
- ✅ Can override date-based logic with force controls

#### When Manual Control Disabled:
- ✅ No manual control alert
- ✅ No "Manual Control" badge
- ✅ **Voting Controls Only**: "Start Voting" / "Stop Voting" buttons
- ✅ No force controls shown
- ✅ Normal date-based behavior

### 5. Contest Management

#### Voting Controls (Always Available):
1. **Start Voting**: Admin clicks "Start Voting" button
   - Contest voting opens immediately
   - Respects normal contest logic
   - Available in both manual and automatic modes

2. **Stop Voting**: Admin clicks "Stop Voting" button
   - Contest voting closes immediately
   - Respects normal contest logic
   - Available in both manual and automatic modes

#### Force Controls (Manual Mode Only):
1. **Force Start Contest**: Admin clicks "Force Start Contest" button
   - Contest voting opens immediately
   - Overrides scheduled start_date
   - Only available when manual control mode is enabled

2. **Force Stop Contest**: Admin clicks "Force Stop Contest" button
   - Contest voting closes immediately
   - Overrides scheduled end_date
   - Only available when manual control mode is enabled

### 6. Security Features
- ✅ Manual controls require admin authentication
- ✅ Only available when environment variable is set
- ✅ Admin-only access to start/stop functions
- ✅ API key required for all requests

## Testing Instructions

### Test 1: Enable Manual Control
1. Set `MANUAL_CONTEST_CONTROL=true` in backend .env
2. Restart backend server
3. Login as admin
4. Verify manual control alert appears
5. Verify contest cards show "Manual Control" badge
6. Test starting/stopping contests

### Test 2: Disable Manual Control
1. Set `MANUAL_CONTEST_CONTROL=false` in backend .env
2. Restart backend server
3. Login as admin
4. Verify no manual control alert
5. Verify normal voting buttons
6. Test normal date-based behavior

### Test 3: API Verification
1. Call `GET /api/contests/manual-control-mode`
2. Verify correct response based on environment variable
3. Test with different environment values

## Implementation Status
- ✅ Environment variable added
- ✅ Backend API endpoint created
- ✅ Frontend manual control detection
- ✅ Admin dashboard UI updates
- ✅ Contest card status indicators
- ✅ Manual control buttons
- ✅ Loading states
- ✅ Error handling

## Benefits
- 🎯 **Flexible Control**: Admins can override automatic scheduling
- 🔒 **Secure**: Admin-only access with proper authentication
- 🌍 **Environment-Based**: Can be enabled/disabled per deployment
- 👥 **User-Friendly**: Clear indicators and intuitive interface
- ⚡ **Immediate**: Instant contest start/stop capability
- 🔄 **Backward Compatible**: Doesn't break existing functionality

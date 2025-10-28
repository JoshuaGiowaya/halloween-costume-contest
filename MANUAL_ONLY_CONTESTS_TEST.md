# Manual-Only Contest Creation Test

## Overview
When `MANUAL_CONTEST_CONTROL=true`, admins can only create contests without scheduled dates (manual control contests). Scheduled contests are only allowed when `MANUAL_CONTEST_CONTROL=false`.

## Environment Configuration

### Manual Control Mode (MANUAL_CONTEST_CONTROL=true)
- ✅ **Contest Creation**: Only manual control contests allowed
- ✅ **Date Fields**: Hidden in creation form
- ✅ **Validation**: No date validation required
- ✅ **Contest Type**: All contests created as manual control

### Automatic Mode (MANUAL_CONTEST_CONTROL=false)
- ✅ **Contest Creation**: Only scheduled contests allowed
- ✅ **Date Fields**: Required in creation form
- ✅ **Validation**: Date validation required
- ✅ **Contest Type**: All contests created as scheduled

## Test Scenarios

### 1. Manual Control Mode Enabled (MANUAL_CONTEST_CONTROL=true)

#### Contest Creation Form:
- ✅ **Title Field**: Required and visible
- ✅ **Description Field**: Required and visible
- ✅ **Start Date Field**: Hidden
- ✅ **End Date Field**: Hidden
- ✅ **Warning Alert**: Shows "Manual Control Mode: Contests will be created without scheduled dates"

#### Contest Creation Process:
1. Admin fills title and description
2. Clicks "Create Contest"
3. Contest created with:
   - `start_date: null`
   - `end_date: null`
   - `manual_control: true`
4. Success message: "Manual Contest Created - Use force controls to start/stop"

#### Contest Display:
- ✅ **Contest Cards**: Show "Type: Manual Control Contest" instead of dates
- ✅ **Voting Status**: Shows "Voting: Open/Closed"
- ✅ **Manual Control Badge**: Shows "Manual Control" badge
- ✅ **Force Controls**: Available for start/stop

### 2. Automatic Mode (MANUAL_CONTEST_CONTROL=false)

#### Contest Creation Form:
- ✅ **Title Field**: Required and visible
- ✅ **Description Field**: Required and visible
- ✅ **Start Date Field**: Required and visible
- ✅ **End Date Field**: Required and visible
- ✅ **No Warning Alert**: Normal form display

#### Contest Creation Process:
1. Admin fills title, description, start date, end date
2. Clicks "Create Contest"
3. Contest created with:
   - `start_date: [provided date]`
   - `end_date: [provided date]`
   - `manual_control: false`
4. Success message: "Contest Added"

#### Contest Display:
- ✅ **Contest Cards**: Show start and end dates
- ✅ **Voting Status**: Shows "Voting: Open/Closed"
- ✅ **No Manual Control Badge**: Normal display
- ✅ **Voting Controls Only**: Standard start/stop voting

## Backend Changes

### Contest Model Updates:
```javascript
const contestSchema = new mongoose.Schema({
    title: String,
    description: String,
    start_date: { 
        type: Date, 
        required: function() { return !this.manual_control; } 
    },
    end_date: { 
        type: Date, 
        required: function() { return !this.manual_control; } 
    },
    voting_open: { type: Boolean, default: false },
    votingOpenedAt: { type: Date },
    manual_control: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});
```

### Validation Updates:
- ✅ **Dynamic Validation**: Dates only required when not manual control
- ✅ **Environment Check**: Validates based on `MANUAL_CONTEST_CONTROL` setting
- ✅ **Contest Type Check**: Validates based on `manual_control` field

### API Updates:
- ✅ **Contest Creation**: Handles `manual_control` field
- ✅ **Contest Display**: Returns `manual_control` field
- ✅ **Contest Update**: Preserves manual control status

## Frontend Changes

### Admin Dashboard Updates:
- ✅ **Mode Detection**: Checks `MANUAL_CONTEST_CONTROL` setting
- ✅ **Conditional Forms**: Shows/hides date fields based on mode
- ✅ **Contest Display**: Different display for manual vs scheduled contests
- ✅ **Edit Forms**: Handles manual control contests appropriately

### UI Improvements:
- ✅ **Clear Indicators**: Warning alerts for manual mode
- ✅ **Visual Distinction**: Different display for contest types
- ✅ **User Guidance**: Clear instructions for each mode

## Test Cases

### Test 1: Create Manual Contest (Manual Mode)
1. Set `MANUAL_CONTEST_CONTROL=true`
2. Restart backend
3. Login as admin
4. Click "Create Contest"
5. Verify date fields are hidden
6. Fill title and description
7. Click "Create Contest"
8. Verify success message mentions manual control
9. Verify contest shows "Type: Manual Control Contest"

### Test 2: Create Scheduled Contest (Automatic Mode)
1. Set `MANUAL_CONTEST_CONTROL=false`
2. Restart backend
3. Login as admin
4. Click "Create Contest"
5. Verify date fields are visible and required
6. Fill all fields including dates
7. Click "Create Contest"
8. Verify success message is normal
9. Verify contest shows start and end dates

### Test 3: Edit Manual Contest
1. Create a manual contest
2. Click "Edit" on the contest
3. Verify date fields are hidden
4. Verify info alert about manual control
5. Update title/description
6. Save changes
7. Verify contest remains manual control type

### Test 4: Edit Scheduled Contest
1. Create a scheduled contest
2. Click "Edit" on the contest
3. Verify date fields are visible
4. Update dates
5. Save changes
6. Verify contest remains scheduled type

## Benefits

- 🎯 **Clear Separation**: Manual and scheduled contests are clearly distinguished
- 🔒 **Environment Control**: Contest type controlled by environment variable
- 👥 **User-Friendly**: Clear UI indicators and guidance
- ⚡ **Flexible Management**: Different control methods for different needs
- 🔄 **Backward Compatible**: Existing scheduled contests continue to work
- 🎨 **Professional UI**: Clean, intuitive interface

## Implementation Status
- ✅ Contest model updated with manual_control field
- ✅ Dynamic validation based on contest type
- ✅ Frontend form conditional rendering
- ✅ Contest display differentiation
- ✅ Edit form handling
- ✅ Backend API updates
- ✅ Environment-based control

## Summary
The system now enforces that scheduled contests can only be created when `MANUAL_CONTEST_CONTROL=false`, and manual control contests can only be created when `MANUAL_CONTEST_CONTROL=true`. This provides clear separation between the two contest management approaches while maintaining full functionality for both modes.

# WebSocket Connection Fix

## Issue
React Native mobile app wasn't connecting to local server WebSocket.

## Root Cause
WebSocket URL mismatch:
- **Server expects**: `ws://IP:8000/ws/home/{home_id}?token={token}`
- **Mobile was sending**: `ws://IP:8000/ws/home/{home_id}/?token={token}` (extra `/`)

## Fix
Updated `mobile/src/api/websocket.ts`:
- Changed line 41 from `${this.url}/home/${homeId}/?token=` to `${this.url}/home/${homeId}?token=`
- Removed trailing slash before query parameters

## Testing
1. Make sure local server is running: `python manage.py runserver 0.0.0.0:8000`
2. Check server console for WebSocket connection confirmation
3. Mobile app should now connect successfully

## Expected Logs
**Server**:
```
=== WebSocket connect() called ===
Query string: token=...
✓ WebSocket connected: home_1 (user: testuser)
```

**Mobile**:
```
Connecting to WebSocket: ws://192.168.x.x:8000/ws/home/1?token=...
WebSocket connected
```

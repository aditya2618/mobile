# Simplified Provisioning Flow for ESPHome

## Overview

This simplified provisioning flow works with **ESPHome's built-in captive portal** instead of requiring custom HTTP API endpoints. The user configures WiFi through the ESP32's web interface, then the device auto-discovers via MQTT.

## Why This Approach?

ESPHome doesn't natively support custom HTTP REST API endpoints like `/api/info`, `/api/wifi`, `/api/mqtt`. Instead of writing custom C++ components, we leverage ESPHome's existing features:

✅ **Built-in captive portal** - ESPHome's web interface for WiFi configuration
✅ **MQTT auto-discovery** - Device automatically connects and publishes to MQTT
✅ **No custom firmware** - Uses standard ESPHome features

## New 4-Step Flow

### Step 1: Prepare Device
- User enters device name (optional)
- App pre-registers device with backend
- Backend creates Device record with `provisioning_id`
- **Progress: 20% → 40%**

### Step 2: Connect to ESP32 AP
- User manually connects phone to ESP32's WiFi AP
- Generic instructions work with any ESP32 device
- **Progress: 40% → 60%**

### Step 3: Configure via Web Interface
- App opens ESP32's web interface at `http://192.168.4.1`
- User selects home WiFi network
- User enters WiFi password
- User taps "Save" in ESPHome's web interface
- User returns to app and taps "Configuration Done"
- **Progress: 60% → 80%**

### Step 4: Wait for Connection
- ESP32 reboots and connects to home WiFi
- ESP32 connects to MQTT broker
- ESP32 publishes first message
- Backend detects message and marks device as provisioned
- App polls backend every 3 seconds
- **Progress: 80% → 100%**

## User Experience

```
┌─────────────────────────────────────┐
│  Step 3: Configure WiFi             │
├─────────────────────────────────────┤
│  Use the ESP32's web interface to   │
│  configure WiFi                     │
│                                     │
│  📝 Configuration Steps:            │
│  1. Tap "Open Web Interface" below  │
│  2. Select your home WiFi network   │
│  3. Enter your WiFi password        │
│  4. Tap "Save" in the web interface │
│  5. Return to this app and tap      │
│     "Configuration Done"            │
│                                     │
│  [Open Web Interface]               │
│  [Configuration Done]               │
└─────────────────────────────────────┘
```

## Technical Details

### Opening Web Interface

```typescript
import { Linking } from 'react-native';

const handleOpenWebInterface = () => {
  Linking.openURL('http://192.168.4.1');
};
```

This opens the ESP32's web interface in the phone's browser while the app stays in the background.

### Polling for Connection

```typescript
const interval = setInterval(async () => {
  const status = await provisioningAPI.getProvisioningStatus(provisioningId);
  
  if (status.is_provisioned && status.device.is_online) {
    // Device connected!
    clearInterval(interval);
    setCurrentStep('complete');
  }
}, 3000); // Poll every 3 seconds
```

### Timeout Handling

- Polls for 2 minutes (40 attempts × 3 seconds)
- If timeout, shows alert with options:
  - "Keep Waiting" - continues polling
  - "Done" - exits (device may still connect in background)

## Advantages

✅ **No custom firmware needed** - Works with standard ESPHome
✅ **Familiar interface** - Users see ESPHome's polished web UI
✅ **Reliable** - Uses ESPHome's tested captive portal
✅ **Flexible** - Works with any ESPHome device
✅ **Auto-discovery** - Device appears automatically via MQTT

## Disadvantages

⚠️ **Extra step** - User must interact with web interface
⚠️ **Manual process** - Can't fully automate WiFi configuration
⚠️ **Context switch** - User leaves app briefly

## Testing Checklist

- [ ] Step 1: Pre-registration succeeds
- [ ] Step 2: Instructions clear for connecting to ESP32 AP
- [ ] Step 3: Web interface opens correctly
- [ ] Step 3: ESPHome web UI loads and shows WiFi networks
- [ ] Step 3: User can configure WiFi successfully
- [ ] Step 4: Polling detects device connection
- [ ] Step 4: Timeout handled gracefully
- [ ] Step 5: Device appears in device list
- [ ] Step 5: Sensor data visible

## Files Modified

- `mobile/src/screens/ProvisionDeviceScreen.tsx` - Simplified 4-step flow
- Removed dependency on custom HTTP API endpoints
- Added `Linking.openURL()` to open web interface
- Added polling with timeout handling

## Related Documentation

- `server/documents/WIFI_PROVISIONING.md` - Backend provisioning API
- `mobile/docs/PRE_REGISTRATION_FLOW.md` - Pre-registration pattern
- `esp-flasher/README_DHT11_PROVISIONING.md` - ESPHome firmware guide

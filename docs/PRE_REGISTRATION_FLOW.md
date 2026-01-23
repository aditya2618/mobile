# Pre-Registration Provisioning Flow - Technical Documentation

## Problem Statement

When a user connects their phone to an ESP32's WiFi Access Point during provisioning, the phone loses internet connectivity. This prevents the mobile app from communicating with the Django backend server to register the device and retrieve MQTT configuration.

## Solution: Pre-Registration Pattern

The device is registered with the backend **before** the phone connects to the ESP32 AP. This allows the app to retrieve and store MQTT configuration locally, then send it to the device without requiring internet access.

## Updated Provisioning Flow

### Step 1: Prepare Device (Phone on Home WiFi ✅)

**User Action:**
- Optionally enters device name
- Taps "Continue"

**Backend Communication:**
```typescript
POST /api/provision/register/
{
  "chip_id": "temp_1234567890",  // Temporary ID
  "home_id": 1,
  "device_name": "Living Room Sensor"
}

Response:
{
  "provisioning_id": "abc123",
  "mqtt_config": {
    "broker_host": "192.168.29.91",
    "broker_port": 1883,
    "topic_prefix": "home/esp32_dht11_001",
    "node_name": "esp32_dht11_001"
  }
}
```

**App State:**
- Stores `provisioning_id` and `mqtt_config` in component state
- Progress: 20% → 40%

---

### Step 2: Connect to Device (Manual WiFi Switch)

**User Action:**
- Goes to phone WiFi settings
- Connects to `esp32-dht11-Setup` (password: `12345678`)
- Returns to app
- Taps "I'm Connected to Device WiFi"

**Phone Status:**
- ❌ No internet connection
- ✅ Can reach ESP32 at `192.168.4.1`

**App State:**
- Progress: 40% → 60%

---

### Step 3: Configure Device (Phone on ESP32 AP, No Internet ❌)

**User Action:**
- Enters home WiFi SSID and password
- Taps "Send Configuration to Device"

**Local Communication (No Internet Required):**
```typescript
// Get actual device chip ID
GET http://192.168.4.1/api/info
Response: { "chip_id": "A4CF12EF5678", ... }

// Send WiFi credentials
POST http://192.168.4.1/api/wifi
{ "ssid": "MyHomeWiFi", "password": "mypassword" }

// Send MQTT config (from Step 1)
POST http://192.168.4.1/api/mqtt
{
  "broker": "192.168.29.91",
  "port": 1883,
  "topic_prefix": "home/esp32_dht11_001",
  "node_name": "esp32_dht11_001"
}

// Restart device
POST http://192.168.4.1/api/restart
```

**App State:**
- Stores actual `chip_id`
- Progress: 60% → 80%
- Shows alert: "Please reconnect to your home WiFi"

---

### Step 4: Reconnect to Home WiFi (Manual WiFi Switch)

**User Action:**
- Goes to phone WiFi settings
- Reconnects to home WiFi (`MyHomeWiFi`)
- Returns to app
- Taps "Check Device Connection"

**Phone Status:**
- ✅ Internet connection restored
- ✅ Can reach Django backend again

**Backend Communication:**
```typescript
GET /api/provision/status/abc123

Response:
{
  "provisioning_id": "abc123",
  "is_provisioned": true,  // Device sent first MQTT message
  "device_id": 42,
  "connected_at": "2026-01-20T21:30:00Z"
}
```

**What Happened Behind the Scenes:**
1. ESP32 rebooted
2. Connected to `MyHomeWiFi`
3. Connected to MQTT broker at `192.168.29.91:1883`
4. Published: `home/esp32_dht11_001/status` → `"online"`
5. Django MQTT handler detected first message
6. Marked device as `is_provisioned = True`

**App State:**
- Progress: 80% → 100%
- Moves to completion screen

---

### Step 5: Complete

**User sees:**
- ✓ Device Connected
- Device ID: A4CF12EF5678
- Added to: Home

**User Action:**
- Taps "Go to Devices"
- Device appears in device list with live sensor data

---

## Key Technical Details

### State Management

```typescript
// Stored in component state (survives WiFi switches)
const [provisioningId, setProvisioningId] = useState('');
const [mqttConfig, setMqttConfig] = useState(null);
const [deviceId, setDeviceId] = useState('');
```

### Error Handling

**Scenario 1: Backend unreachable in Step 1**
- User still on home WiFi, should have internet
- Show error: "Cannot reach server. Check your internet connection."

**Scenario 2: ESP32 unreachable in Step 3**
- User not connected to ESP32 AP
- Show error: "Cannot reach device. Make sure you're connected to esp32-dht11-Setup"

**Scenario 3: Device never connects (Step 4)**
- Poll timeout after 60 seconds
- Show error with retry option
- Device may still connect in background

### Progress Tracking

| Step | Progress | Internet Required | Communicates With |
|------|----------|-------------------|-------------------|
| 1. Prepare | 20% → 40% | ✅ Yes | Django Backend |
| 2. Connect | 40% → 60% | ❌ No | None |
| 3. Configure | 60% → 80% | ❌ No | ESP32 Local |
| 4. Reconnect | 80% → 100% | ✅ Yes | Django Backend |
| 5. Complete | 100% | ✅ Yes | None |

---

## Advantages of This Approach

✅ **Solves connectivity issue** - MQTT config retrieved before losing internet
✅ **Clear user guidance** - Explicit instructions for WiFi switching
✅ **Robust error handling** - Can detect and guide user through issues
✅ **No additional permissions** - Works without programmatic WiFi control
✅ **Cross-platform** - Works on both iOS and Android

## Future Enhancements

### Automatic WiFi Switching (Android)

```typescript
import WifiManager from 'react-native-wifi-reborn';

// Auto-connect to ESP32 AP
await WifiManager.connectToProtectedSSID('esp32-dht11-Setup', '12345678', false);

// Auto-reconnect to home WiFi
await WifiManager.connectToProtectedSSID(wifiSSID, wifiPassword, false);
```

**Benefits:**
- Eliminates manual WiFi switching
- Reduces provisioning time from ~3 minutes to ~1 minute

**Limitations:**
- Requires `ACCESS_FINE_LOCATION` permission on Android
- Limited support on iOS (requires user approval)
- Would keep manual flow as fallback

---

## Testing Checklist

- [ ] Step 1: Pre-registration succeeds with valid home
- [ ] Step 1: Error shown if no internet connection
- [ ] Step 2: Instructions clear for manual WiFi switch
- [ ] Step 3: Configuration sent successfully to ESP32
- [ ] Step 3: Error shown if not connected to ESP32 AP
- [ ] Step 4: Reconnection instructions clear
- [ ] Step 4: Polling detects device connection
- [ ] Step 4: Timeout handled gracefully
- [ ] Step 5: Device appears in device list
- [ ] Step 5: Sensor data visible in real-time

---

## API Endpoints Used

| Endpoint | Method | Step | Purpose |
|----------|--------|------|---------|
| `/api/provision/register/` | POST | 1 | Pre-register device, get MQTT config |
| `/api/provision/status/{id}` | GET | 4 | Check if device connected |
| `http://192.168.4.1/api/info` | GET | 3 | Get device chip ID |
| `http://192.168.4.1/api/wifi` | POST | 3 | Send WiFi credentials |
| `http://192.168.4.1/api/mqtt` | POST | 3 | Send MQTT config |
| `http://192.168.4.1/api/restart` | POST | 3 | Restart device |

---

## Files Modified

- `mobile/src/screens/ProvisionDeviceScreen.tsx` - Complete refactor with 5-step flow
- `mobile/src/api/provisionClient.ts` - Already supports all required endpoints

## Related Documentation

- `server/documents/WIFI_PROVISIONING.md` - Full provisioning specification
- `esp-flasher/README_DHT11_PROVISIONING.md` - ESP32 firmware guide

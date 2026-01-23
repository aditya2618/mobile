package com.imphal.smarthome

import android.os.Build
import android.os.Bundle
import android.content.Intent
import android.nfc.NdefMessage
import android.nfc.NfcAdapter

import com.facebook.react.ReactActivity
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    handleNfcIntent(intent)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }

  /**
   * Handle NFC intent when app is already running
   */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleNfcIntent(intent)
  }

  /**
   * Handle NFC intent when app resumes
   */
  override fun onResume() {
    super.onResume()
    handleNfcIntent(intent)
  }

  /**
   * Process NFC intent and forward to React Native
   */
  private fun handleNfcIntent(intent: Intent?) {
    if (intent == null) return

    val action = intent.action
    
    // Check if this is an NFC intent
    if (NfcAdapter.ACTION_NDEF_DISCOVERED == action || 
        NfcAdapter.ACTION_TAG_DISCOVERED == action) {
      
      android.util.Log.d("MainActivity", "🏷️ NFC tag detected: $action")
      
      // Get NDEF messages from intent
      val rawMessages = intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES)
      
      if (rawMessages != null && rawMessages.isNotEmpty()) {
        val ndefMessage = rawMessages[0] as NdefMessage
        val records = ndefMessage.records
        
        if (records.isNotEmpty()) {
          // Read first record payload (skip first 3 bytes for text records)
          val payload = records[0].payload
          val text = String(payload.copyOfRange(3, payload.size))
          
          android.util.Log.d("MainActivity", "📌 NFC payload: $text")
          
          // Send to React Native
          sendNfcEventToReactNative(text)
        }
      }
    }
  }

  /**
   * Forward NFC data to React Native via event emitter
   */
  private fun sendNfcEventToReactNative(tagData: String) {
    try {
      val params: WritableMap = Arguments.createMap()
      params.putString("tagData", tagData)
      
      reactInstanceManager?.currentReactContext?.let { context ->
        context
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit("nfcTagScanned", params)
        
        android.util.Log.d("MainActivity", "✅ NFC event sent to React Native")
      }
    } catch (e: Exception) {
      android.util.Log.e("MainActivity", "❌ Error sending NFC event: ${e.message}")
    }
  }
}

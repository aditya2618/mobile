import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider } from "react-native-paper";
import HomeBootstrap from "./src/screens/HomeBootstrap";
import AppTabs from "./src/navigation/AppTabs";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import { useAuthStore } from "./src/store/authStore";
import { useHomeStore } from "./src/store/homeStore";
import { useDeviceStore } from "./src/store/deviceStore";
import { useServerConfigStore } from "./src/store/serverConfigStore";
import { wsClient } from "./src/api/websocket";
import { ThemeProvider } from "./src/context/ThemeContext";
// Temporarily disabled - notifee native module not ready
// import { initBackgroundNfcListener } from "./src/services/backgroundNfcHandler";

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const token = useAuthStore((s) => s.token);
  const selectedHome = useHomeStore((s) => s.selectedHome);
  const loadSelectedHome = useHomeStore((s) => s.loadSelectedHome);
  const updateEntityState = useDeviceStore((s) => s.updateEntityState);
  const updateDeviceStatus = useDeviceStore((s) => s.updateDeviceStatus);
  const loadServerConfig = useServerConfigStore((s) => s.loadServerConfig);
  const getWebSocketUrl = useServerConfigStore((s) => s.getWebSocketUrl);
  const [ready, setReady] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Load server config, home, then restore session
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 App initialization started...');

        // Load server config first
        console.log('📡 Loading server config...');
        await loadServerConfig();
        console.log('✅ Server config loaded');

        // Load selected home from storage
        console.log('🏠 Loading selected home...');
        await loadSelectedHome();
        console.log('✅ Selected home loaded');

        // Then restore auth session
        console.log('🔐 Restoring session...');
        await restoreSession();
        console.log('✅ Session restored');

        // Temporarily disabled - notifee native module not ready
        // Initialize background NFC listener
        // initBackgroundNfcListener();
        // console.log('📡 Background NFC handler initialized');

        console.log('✅ App initialization complete!');
      } catch (error) {
        console.error('❌ Error during initialization:', error);
      }
    };
    initialize();
  }, []);

  // Connect to WebSocket when authenticated and home is loaded
  useEffect(() => {
    if (isAuthenticated && ready && selectedHome && token) {
      console.log("Connecting to WebSocket from App.tsx");

      // Set WebSocket URL from server config
      const wsUrl = getWebSocketUrl();
      if (wsUrl) {
        console.log("Setting WebSocket URL:", wsUrl);
        wsClient.setUrl(wsUrl);

        wsClient.connect(token, selectedHome.id, (data) => {
          console.log("WebSocket update received:", data);

          // Handle entity state updates
          if (data.type === "entity_state" && data.entity_id && data.state) {
            updateEntityState(data.entity_id, data.state);

            // Also update device online status if provided
            if (data.device_id !== undefined && data.is_online !== undefined) {
              updateDeviceStatus(data.device_id, data.is_online);
            }
          }
          // Handle device status updates (e.g. from LWT)
          else if (data.type === "device_status" && data.device_id !== undefined) {
            updateDeviceStatus(data.device_id, data.is_online);
            console.log(`📡 Device ${data.device_id} is now ${data.is_online ? 'ONLINE ✅' : 'OFFLINE ❌'}`);
          }
        });
      } else {
        console.error("❌ WebSocket URL is empty - server not configured");
      }

      // Cleanup on logout or unmount
      return () => {
        console.log("Disconnecting WebSocket from App.tsx");
        wsClient.disconnect();
      };
    }
  }, [isAuthenticated, ready, selectedHome, token]);

  // Reset ready state when user logs out
  useEffect(() => {
    if (!isAuthenticated && ready) {
      console.log("User logged out, resetting ready state...");
      setReady(false);
      wsClient.disconnect();
    }
  }, [isAuthenticated]);

  // Show loading screen while checking for saved session
  if (isLoading) {
    return (
      <ThemeProvider>
        <PaperProvider>
          <NavigationContainer>
            <></>
          </NavigationContainer>
        </PaperProvider>
      </ThemeProvider>
    );
  }

  // Determine which screen to show
  let screen;
  if (!isAuthenticated) {
    screen = showRegister ? (
      <RegisterScreen onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginScreen onSwitchToRegister={() => setShowRegister(true)} />
    );
  } else if (!ready) {
    screen = <HomeBootstrap onReady={() => setReady(true)} />;
  } else {
    screen = <AppTabs />;
  }

  return (
    <ThemeProvider>
      <PaperProvider>
        <NavigationContainer>{screen}</NavigationContainer>
      </PaperProvider>
    </ThemeProvider>
  );
}

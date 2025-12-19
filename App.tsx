import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider } from "react-native-paper";
import HomeBootstrap from "./src/screens/HomeBootstrap";
import AppTabs from "./src/navigation/AppTabs";
import LoginScreen from "./src/screens/LoginScreen";
import { useAuthStore } from "./src/store/authStore";
import { useHomeStore } from "./src/store/homeStore";
import { useDeviceStore } from "./src/store/deviceStore";
import { wsClient } from "./src/api/websocket";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const activeHome = useHomeStore((s) => s.activeHome);
  const updateEntityState = useDeviceStore((s) => s.updateEntityState);
  const [ready, setReady] = useState(false);

  // Connect to WebSocket when authenticated and home is loaded
  useEffect(() => {
    if (isAuthenticated && ready && activeHome && token) {
      console.log("Connecting to WebSocket from App.tsx");
      wsClient.connect(token, activeHome.id, (data) => {
        console.log("WebSocket update received:", data);

        // Handle different message types
        if (data.type === "entity_state" && data.entity_id && data.state) {
          updateEntityState(data.entity_id, data.state);
        }
      });

      // Cleanup on logout or unmount
      return () => {
        wsClient.disconnect();
      };
    }
  }, [isAuthenticated, ready, activeHome, token]);

  return (
    <ThemeProvider>
      <PaperProvider>
        <NavigationContainer>
          {!isAuthenticated ? (
            <LoginScreen />
          ) : !ready ? (
            <HomeBootstrap onReady={() => setReady(true)} />
          ) : (
            <AppTabs />
          )}
        </NavigationContainer>
      </PaperProvider>
    </ThemeProvider>
  );
}

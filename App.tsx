import { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider } from "react-native-paper";
import HomeBootstrap from "./src/screens/HomeBootstrap";
import AppTabs from "./src/navigation/AppTabs";
import LoginScreen from "./src/screens/LoginScreen";
import { useAuthStore } from "./src/store/authStore";

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  return (
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
  );
}

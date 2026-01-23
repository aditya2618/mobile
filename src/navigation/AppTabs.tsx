import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Icon } from "react-native-paper";
import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ScenesScreen from "../screens/ScenesScreen";
import AutomationsScreen from "../screens/AutomationsScreen";
import CreateAutomationScreen from "../screens/CreateAutomationScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ManageDevicesScreen from "../screens/ManageDevicesScreen";
import RemoveDevicesScreen from "../screens/RemoveDevicesScreen";
import SystemStatusScreen from "../screens/SystemStatusScreen";
import LogsScreen from "../screens/LogsScreen";
import EnergyDashboardScreen from "../screens/EnergyDashboardScreen";
import CreateSceneScreen from "../screens/CreateSceneScreen";
import EditSceneScreen from "../screens/EditSceneScreen";
// Temporarily disabled - expo-speech-recognition module not ready
// import VoiceCommandScreen from "../screens/VoiceCommandScreen";
import NFCSettingsScreen from "../screens/NFCSettingsScreen";
import AddDeviceScreen from "../screens/AddDeviceScreen";
import ProvisionDeviceScreen from "../screens/ProvisionDeviceScreen";
import { useTheme } from "../context/ThemeContext";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const ScenesStack = createNativeStackNavigator();
const AutomationsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Home Stack Navigator
function HomeStackScreen() {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="HomeMain" component={HomeScreen} />
            {/* Temporarily disabled - expo-speech-recognition module not ready */}
            {/* <HomeStack.Screen name="VoiceCommand" component={VoiceCommandScreen} /> */}
        </HomeStack.Navigator>
    );
}

// Dashboard Stack Navigator
function DashboardStackScreen() {
    return (
        <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
            <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} />
            <DashboardStack.Screen
                name="ManageDevices"
                component={ManageDevicesScreen}
            />
            <DashboardStack.Screen
                name="RemoveDevices"
                component={RemoveDevicesScreen}
            />
            <DashboardStack.Screen
                name="AddDevice"
                component={AddDeviceScreen}
            />
            <DashboardStack.Screen
                name="ProvisionDevice"
                component={ProvisionDeviceScreen}
            />
        </DashboardStack.Navigator>
    );
}

// Scenes Stack Navigator
function ScenesStackScreen() {
    return (
        <ScenesStack.Navigator screenOptions={{ headerShown: false }}>
            <ScenesStack.Screen name="ScenesMain" component={ScenesScreen} />
            <ScenesStack.Screen
                name="CreateScene"
                component={CreateSceneScreen}
            />
            <ScenesStack.Screen
                name="EditScene"
                component={EditSceneScreen}
            />
        </ScenesStack.Navigator>
    );
}

// Automations Stack Navigator
function AutomationsStackScreen() {
    return (
        <AutomationsStack.Navigator screenOptions={{ headerShown: false }}>
            <AutomationsStack.Screen name="AutomationsMain" component={AutomationsScreen} />
            <AutomationsStack.Screen
                name="CreateAutomation"
                component={CreateAutomationScreen}
            />
        </AutomationsStack.Navigator>
    );
}

// Settings Stack Navigator
function SettingsStackScreen() {
    return (
        <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
            <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
            <SettingsStack.Screen
                name="SystemStatus"
                component={SystemStatusScreen}
            />
            <SettingsStack.Screen
                name="Logs"
                component={LogsScreen}
            />
            <SettingsStack.Screen
                name="EnergyDashboard"
                component={EnergyDashboardScreen}
            />
            <SettingsStack.Screen
                name="NFCSettings"
                component={NFCSettingsScreen}
            />
        </SettingsStack.Navigator>
    );
}

export default function AppTabs() {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.cardBackground,
                    borderTopWidth: 0,
                    elevation: 8,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStackScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Devices"
                component={DashboardStackScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="devices" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Scenes"
                component={ScenesStackScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="filmstrip" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Automations"
                component={AutomationsStackScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="robot" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsStackScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="cog" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

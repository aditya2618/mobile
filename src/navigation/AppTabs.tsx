import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import { Icon } from "react-native-paper";
import DashboardScreen from "../screens/DashboardScreen";
import ScenesScreen from "../screens/ScenesScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

function Placeholder({ title }: { title: string }) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{title}</Text>
            <Text style={styles.subtext}>Coming Soon</Text>
        </View>
    );
}

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,  // Hide headers for app-like feel
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#4CAF50',
                tabBarInactiveTintColor: '#999',
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Scenes"
                component={ScenesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="filmstrip" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Voice"
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="microphone" size={size} color={color} />
                    ),
                }}
            >
                {() => <Placeholder title="Voice Control" />}
            </Tab.Screen>
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon source="cog" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
    },
    text: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "600",
    },
    subtext: {
        color: "#999",
        fontSize: 14,
        marginTop: 8,
    },
    tabBar: {
        backgroundColor: "#1e1e2e",
        borderTopWidth: 0,
        elevation: 8,
        height: 60,
        paddingBottom: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: "600",
    },
});

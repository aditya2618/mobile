import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";

const Tab = createBottomTabNavigator();

function Placeholder({ title }: { title: string }) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{title}</Text>
        </View>
    );
}

export default function AppTabs() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Scenes">
                {() => <Placeholder title="Scenes" />}
            </Tab.Screen>
            <Tab.Screen name="Voice">
                {() => <Placeholder title="Voice" />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0E0E0E",
    },
    text: {
        color: "#fff",
        fontSize: 18,
    },
});

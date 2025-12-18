import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
    const login = useAuthStore((s) => s.login);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Sign in
            </Text>

            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                mode="outlined"
            />

            <TextInput
                label="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
            />

            <Button
                mode="contained"
                style={styles.button}
                onPress={() => login(username, password)}
            >
                Login
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
    },
    title: {
        marginBottom: 24,
    },
    input: {
        marginTop: 16,
    },
    button: {
        marginTop: 24,
    },
});

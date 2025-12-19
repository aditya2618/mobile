import { useState } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../context/ThemeContext";

export default function LoginScreen() {
    const login = useAuthStore((s) => s.login);
    const { theme, mode } = useTheme();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await login(username, password);
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar
                barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.content}>
                    <Text variant="displaySmall" style={[styles.title, { color: theme.text }]}>
                        Welcome
                    </Text>
                    <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Sign in to your smart home
                    </Text>

                    <TextInput
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                        mode="outlined"
                        autoCapitalize="none"
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                    />

                    <TextInput
                        label="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        mode="outlined"
                        outlineColor={theme.border}
                        activeOutlineColor={theme.primary}
                        textColor={theme.text}
                    />

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        style={styles.button}
                        buttonColor={theme.primary}
                        loading={loading}
                        disabled={loading || !username || !password}
                    >
                        Sign In
                    </Button>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    content: {
        maxWidth: 400,
        width: "100%",
        alignSelf: "center",
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 32,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
});

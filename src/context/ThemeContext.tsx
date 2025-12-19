import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
    // Backgrounds
    background: string;
    cardBackground: string;
    surfaceBackground: string;

    // Text
    text: string;
    textSecondary: string;
    textDisabled: string;

    // Borders & Dividers
    border: string;
    divider: string;

    // Status Colors
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;

    // States
    activeBackground: string;
    inactiveBackground: string;
}

const lightTheme: ThemeColors = {
    background: '#f5f5f5',
    cardBackground: '#ffffff',
    surfaceBackground: '#fafafa',

    text: '#1a1a1a',
    textSecondary: '#666666',
    textDisabled: '#999999',

    border: '#e0e0e0',
    divider: '#eeeeee',

    primary: '#4CAF50',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#f44336',
    info: '#2196F3',

    activeBackground: '#E8F5E9',
    inactiveBackground: '#f5f5f5',
};

const darkTheme: ThemeColors = {
    background: '#0a0a0a',
    cardBackground: '#1e1e2e',
    surfaceBackground: '#16162a',

    text: '#ffffff',
    textSecondary: '#aaaaaa',
    textDisabled: '#666666',

    border: '#2a2a3e',
    divider: '#1a1a2a',

    primary: '#4CAF50',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#f44336',
    info: '#2196F3',

    activeBackground: '#2a3a2e',
    inactiveBackground: '#1a1a2a',
};

interface ThemeContextType {
    mode: ThemeMode;
    theme: ThemeColors;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('dark');

    useEffect(() => {
        // Load saved theme preference
        AsyncStorage.getItem('theme').then((savedTheme) => {
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setMode(savedTheme);
            }
        });
    }, []);

    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        AsyncStorage.setItem('theme', newMode);
    };

    const setTheme = (newMode: ThemeMode) => {
        setMode(newMode);
        AsyncStorage.setItem('theme', newMode);
    };

    const theme = mode === 'light' ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ mode, theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

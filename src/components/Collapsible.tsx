import { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface CollapsibleProps {
    isExpanded: boolean;
    children: React.ReactNode;
}

export default function Collapsible({ isExpanded, children }: CollapsibleProps) {
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const animatedOpacity = useRef(new Animated.Value(0)).current;
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(isExpanded);

    useEffect(() => {
        if (isExpanded) {
            setShouldRender(true);
            setIsAnimating(true);
        }

        Animated.parallel([
            Animated.timing(animatedHeight, {
                toValue: isExpanded ? 1 : 0,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(animatedOpacity, {
                toValue: isExpanded ? 1 : 0,
                duration: 250,
                useNativeDriver: false, // Changed to false to match height animation
            }),
        ]).start(() => {
            setIsAnimating(false);
            if (!isExpanded) {
                setShouldRender(false);
            }
        });
    }, [isExpanded]);

    const heightInterpolate = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1000], // Max height
    });

    if (!shouldRender && !isAnimating) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    maxHeight: heightInterpolate,
                    opacity: animatedOpacity,
                },
            ]}
        >
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

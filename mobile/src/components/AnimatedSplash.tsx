import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const circleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(circleAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(circleAnim, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
    ]).start(() => {
      setTimeout(onFinish, 1200);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated blue circles */}
      <Animated.View
        style={[styles.circle, {
          opacity: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
          transform: [{ scale: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
        }]}
      />
      <Animated.View
        style={[styles.circle, styles.circle2, {
          opacity: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
          transform: [{ scale: circleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) }],
        }]}
      />
      {/* KS Logo */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 10,
  },
  circle: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#2196F3',
    top: height / 2 - width * 0.35,
    left: width / 2 - width * 0.35,
  },
  circle2: {
    backgroundColor: '#4FC3F7',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    top: height / 2 - width * 0.25,
    left: width / 2 - width * 0.25,
  },
});

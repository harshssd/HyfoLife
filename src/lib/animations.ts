import { Animated, Easing } from "react-native";

export const pressScale = (to = 0.98, dur = 120) => {
  const v = new Animated.Value(1);
  const onPressIn = () => Animated.timing(v, { toValue: to, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  return { v, onPressIn, onPressOut, style: { transform: [{ scale: v }] } };
};

export const pulseOnce = (dur = 200) => {
  const v = new Animated.Value(0);
  const run = () => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  };
  const style = {
    transform: [{ scale: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] }) }],
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1] })
  };
  return { run, style };
};
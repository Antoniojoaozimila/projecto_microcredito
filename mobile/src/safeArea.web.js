import { View } from "react-native";

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };

export const SafeAreaProvider = ({ children }) => children;

export const useSafeAreaInsets = () => ZERO;

export const SafeAreaView = View;

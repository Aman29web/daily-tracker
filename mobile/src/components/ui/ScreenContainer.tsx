import { View, StyleSheet, ViewProps } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ScreenContainer({ style, children, ...rest }: ViewProps) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { queryClient } from "@/api/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { useAppTheme } from "@/hooks/useAppTheme";
import SplashScreen from "@/components/ui/SplashScreen";
import ToastHost from "@/components/ui/ToastHost";

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const booting = useAuthBootstrap();
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const { scheme } = useAppTheme();

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  if (booting || !themeHydrated || status === "idle") {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === "authenticated"}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(more)" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen name="search" options={{ presentation: "modal" }} />
          <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
        </Stack.Protected>
        <Stack.Protected guard={status !== "authenticated"}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

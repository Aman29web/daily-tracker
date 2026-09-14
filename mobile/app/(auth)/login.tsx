import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react-native";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLogin } from "@/features/auth/hooks";
import { loginSchema, LoginInput } from "@/features/auth/schemas";
import { extractErrorMessage } from "@/api/client";

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (input: LoginInput) => login.mutate(input);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Momentum</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Welcome back — sign in to continue.</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextField
                label="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                label="Password"
                secureTextEntry={!showPassword}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.toggleRow}>
            {showPassword ? <EyeOff size={14} color={colors.textMuted} /> : <Eye size={14} color={colors.textMuted} />}
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>
              {showPassword ? "Hide password" : "Show password"}
            </Text>
          </Pressable>

          {login.isError ? (
            <Text style={[styles.errorBanner, { color: colors.danger }]}>{extractErrorMessage(login.error, "Login failed")}</Text>
          ) : null}

          <Button label="Log in" onPress={handleSubmit(onSubmit)} loading={login.isPending} />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted }}>Don't have an account? </Text>
          <Link href="/(auth)/register" style={{ color: colors.primary, fontWeight: "700" }}>
            Sign up
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 24 },
  title: { fontSize: 30, fontWeight: "800" },
  subtitle: { fontSize: 15 },
  form: { gap: 14 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  toggleText: { fontSize: 13 },
  errorBanner: { fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
});

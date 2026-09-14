import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, RegisterInput } from "@/features/auth/schemas";
import { extractErrorMessage } from "@/api/client";

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const register = useRegister();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (input: RegisterInput) => register.mutate(input);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Start building momentum — habits, tasks, focus, and more.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField label="Name" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />
            )}
          />
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
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={errors.password?.message}
              />
            )}
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            8+ characters, with an uppercase letter, a lowercase letter, and a number.
          </Text>

          {register.isError ? (
            <Text style={[styles.errorBanner, { color: colors.danger }]}>
              {extractErrorMessage(register.error, "Registration failed")}
            </Text>
          ) : null}

          <Button label="Create account" onPress={handleSubmit(onSubmit)} loading={register.isPending} />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted }}>Already have an account? </Text>
          <Link href="/(auth)/login" style={{ color: colors.primary, fontWeight: "700" }}>
            Log in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 24 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 15 },
  form: { gap: 14 },
  hint: { fontSize: 12, marginTop: -6 },
  errorBanner: { fontSize: 13 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
});

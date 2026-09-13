import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { settingsApi } from "../../api/endpoints/insights";
import { authApi } from "../../api/endpoints/auth";
import { extractErrorMessage } from "../../api/client";
import { useAuthStore } from "../../stores/authStore";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not save settings")),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      if (accessToken) setSession(user, accessToken);
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "Could not update profile")),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => toast.success("Password changed"),
    onError: (err) => toast.error(extractErrorMessage(err, "Could not change password")),
  });
}

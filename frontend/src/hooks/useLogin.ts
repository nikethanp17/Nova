import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { TokenResponse } from "@/types/auth";
import { ResponseEnvelope } from "@/types/api";

export function useLogin() {
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const { data } = await api.post<ResponseEnvelope<TokenResponse>>(
        "/auth/login",
        credentials
      );
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Login failed");
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
    },
  });
}

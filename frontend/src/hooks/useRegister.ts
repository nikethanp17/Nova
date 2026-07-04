import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { User } from "@/types/auth";
import { ResponseEnvelope } from "@/types/api";

export function useRegister() {
  return useMutation({
    mutationFn: async (userData: Record<string, string>) => {
      const { data } = await api.post<ResponseEnvelope<User>>(
        "/auth/register",
        userData
      );
      if (data.success && data.data) {
        return data.data;
      }
      throw new Error(data.error?.message || "Registration failed");
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { User } from "@/types/auth";
import { ResponseEnvelope } from "@/types/api";

export function useProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get<ResponseEnvelope<User>>("/users/me");
      if (data.success && data.data) {
        setUser(data.data);
        return data.data;
      }
      throw new Error(data.error?.message || "Failed to fetch profile");
    },
    enabled: isAuthenticated,
  });
}

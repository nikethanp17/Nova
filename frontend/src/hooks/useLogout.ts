import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutStore = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        // Revoke token on the server
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch {
      // Ignore network/server errors during logout to guarantee client-side cleanup succeeds
    } finally {
      // Client-side cleanup
      logoutStore();
      queryClient.clear();
      toast.success("Signed out successfully.");
      router.push("/login");
    }
  };

  return handleLogout;
}

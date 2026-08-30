import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function GoogleOneTap() {
  useEffect(() => {
    let cancelled = false;
    let googlePoll: ReturnType<typeof setInterval> | undefined;
    let pollTimeout: ReturnType<typeof setTimeout> | undefined;

    const initialize = async () => {
      try {
        const response = await fetch("/api/config", { credentials: "include" });
        if (!response.ok) return;

        const { googleClientId } = (await response.json()) as {
          googleClientId?: string;
        };
        if (!googleClientId || cancelled) return;

        const showPrompt = () => {
          if (!window.google || cancelled) return false;

          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false,
            callback: async ({ credential }) => {
              try {
                await apiRequest("POST", "/api/auth/google", { credential });
                await queryClient.invalidateQueries({
                  queryKey: ["/api/auth/user"],
                });
              } catch (error) {
                console.error("Google One Tap sign-in failed:", error);
              }
            },
          });
          window.google.accounts.id.prompt();
          return true;
        };

        if (showPrompt()) return;

        googlePoll = setInterval(() => {
          if (showPrompt() && googlePoll) clearInterval(googlePoll);
        }, 100);
        pollTimeout = setTimeout(() => {
          if (googlePoll) clearInterval(googlePoll);
        }, 5_000);
      } catch (error) {
        console.error("Failed to initialize Google One Tap:", error);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      if (googlePoll) clearInterval(googlePoll);
      if (pollTimeout) clearTimeout(pollTimeout);
      window.google?.accounts.id.cancel?.();
    };
  }, []);

  return null;
}

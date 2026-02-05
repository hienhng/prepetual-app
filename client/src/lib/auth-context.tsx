import { createContext, useContext, ReactNode, useCallback } from "react";

interface AuthDialogContextType {
  openLoginDialog: () => void;
  openSignUpDialog: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextType | null>(null);

export function AuthDialogProvider({ children, navigate }: { children: ReactNode; navigate: (path: string) => void }) {
  const openLoginDialog = useCallback(() => {
    navigate("/auth?mode=login");
  }, [navigate]);

  const openSignUpDialog = useCallback(() => {
    navigate("/auth?mode=signup");
  }, [navigate]);

  return (
    <AuthDialogContext.Provider value={{ 
      openLoginDialog, 
      openSignUpDialog, 
    }}>
      {children}
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider");
  }
  return context;
}

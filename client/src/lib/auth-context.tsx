import { createContext, useContext, useState, ReactNode } from "react";

interface AuthDialogContextType {
  isOpen: boolean;
  defaultTab: "login" | "register";
  openAuthDialog: (tab?: "login" | "register") => void;
  closeAuthDialog: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextType | null>(null);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"login" | "register">("login");

  const openAuthDialog = (tab: "login" | "register" = "login") => {
    setDefaultTab(tab);
    setIsOpen(true);
  };

  const closeAuthDialog = () => {
    setIsOpen(false);
  };

  return (
    <AuthDialogContext.Provider value={{ isOpen, defaultTab, openAuthDialog, closeAuthDialog }}>
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

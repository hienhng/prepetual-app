import { createContext, useContext, useState, ReactNode } from "react";

interface AuthDialogContextType {
  isLoginOpen: boolean;
  isSignUpOpen: boolean;
  openLoginDialog: () => void;
  openSignUpDialog: () => void;
  closeLoginDialog: () => void;
  closeSignUpDialog: () => void;
  switchToSignUp: () => void;
  switchToLogin: () => void;
}

const AuthDialogContext = createContext<AuthDialogContextType | null>(null);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const openLoginDialog = () => {
    setIsSignUpOpen(false);
    setIsLoginOpen(true);
  };

  const openSignUpDialog = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  };

  const closeLoginDialog = () => {
    setIsLoginOpen(false);
  };

  const closeSignUpDialog = () => {
    setIsSignUpOpen(false);
  };

  const switchToSignUp = () => {
    setIsLoginOpen(false);
    setTimeout(() => setIsSignUpOpen(true), 150);
  };

  const switchToLogin = () => {
    setIsSignUpOpen(false);
    setTimeout(() => setIsLoginOpen(true), 150);
  };

  return (
    <AuthDialogContext.Provider value={{ 
      isLoginOpen, 
      isSignUpOpen, 
      openLoginDialog, 
      openSignUpDialog, 
      closeLoginDialog, 
      closeSignUpDialog,
      switchToSignUp,
      switchToLogin
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

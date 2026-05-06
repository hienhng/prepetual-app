import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface VerificationPromptProps {
  email: string;
  open: boolean;
}

export function VerificationPrompt({ email, open }: VerificationPromptProps) {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [otpValue, setOtpValue] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Auto refresh when window is focused
  useEffect(() => {
    const handleFocus = () => {
      if (open) {
        refetch();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [open, refetch]);

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", { code });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Email verified!", description: "You're all set to start." });
      refetch();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Verification failed", 
        description: error.message || t("auth.invalidCode"), 
        variant: "destructive" 
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: t("auth.codeResent"),
        description: "A new verification code has been sent to " + email,
      });
      setTimeout(() => setEmailSent(false), 5000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {open && <div className="fixed inset-0 backdrop-blur-sm z-40" style={{ pointerEvents: 'none' }} />}
      <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t("auth.verifyEmail")}
          </DialogTitle>
          <DialogDescription>
            {t("auth.codeSent").replace("{email}", email)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              onComplete={(value) => verifyMutation.mutate(value)}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="rounded-md border-2 h-12 w-10 sm:h-14 sm:w-12 text-xl" />
                <InputOTPSlot index={1} className="rounded-md border-2 h-12 w-10 sm:h-14 sm:w-12 text-xl" />
                <InputOTPSlot index={2} className="rounded-md border-2 h-12 w-10 sm:h-14 sm:w-12 text-xl" />
                <InputOTPSlot index={3} className="rounded-md border-2 h-12 w-10 sm:h-14 sm:w-12 text-xl" />
                <InputOTPSlot index={4} className="rounded-md border-2 h-12 w-10 sm:h-14 sm:w-12 text-xl" />
                <InputOTPSlot index={5} className="rounded-md border-2 h-12 w-10 sm:h-14 sm:w-12 text-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {emailSent && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">{t("auth.codeResent")}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => verifyMutation.mutate(otpValue)}
              disabled={otpValue.length !== 6 || verifyMutation.isPending}
              className="w-full font-semibold"
              data-testid="button-verify-code"
            >
              {verifyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("auth.verify")}
            </Button>
            
            <Button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-resend-code"
            >
              {resendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("auth.resendCode")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

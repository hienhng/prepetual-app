import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

interface VerificationPromptProps {
  email: string;
  open: boolean;
}

export function VerificationPrompt({ email, open }: VerificationPromptProps) {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
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

  const handleCheckStatus = async () => {
    setIsChecking(true);
    await refetch();
    setIsChecking(false);
  };

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: () => {
      setEmailSent(true);
      toast({
        title: "Email sent",
        description: "Verification email has been sent to " + email,
      });
      setTimeout(() => setEmailSent(false), 5000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send email",
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
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            Please verify your email address to access all features
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-foreground">
              A verification email has been sent to:
            </p>
            <p className="font-semibold text-foreground mt-2">{email}</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Follow the link in the email to verify your account.</p>
            <p>Check your spam folder if you don't see it.</p>
          </div>
          {emailSent && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">Email sent successfully</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full"
              data-testid="button-check-verification-status"
            >
              {isChecking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              I've verified my email
            </Button>
            
            <Button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-resend-verification"
            >
              {resendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Resend Verification Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

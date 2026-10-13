import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { KeyRound, Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import type { AccountSecuritySettings } from "@shared/account-security";

export function AccountSecurityCard({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const security = useQuery<AccountSecuritySettings>({
    queryKey: ["/api/auth/security"],
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  const formatDate = (value: string) => new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const showError = (error: Error) => {
    toast({ title: t("common.error"), description: error.message, variant: "destructive" });
  };

  const finishSignOut = async (title: string) => {
    await queryClient.cancelQueries();
    queryClient.clear();
    queryClient.setQueryData(["/api/auth/user"], null);
    setLocation("/auth");
    toast({ title, description: t("settings.signInAgain") });
  };

  const changePassword = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/change-password", { currentPassword, newPassword }),
    onSuccess: () => finishSignOut(t("settings.passwordChanged")),
    onError: showError,
  });
  const logoutAll = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout-all"),
    onSuccess: () => finishSignOut(t("settings.signedOutAll")),
    onError: showError,
  });
  const verifyEmail = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/verify-email", { code }),
    onSuccess: () => {
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/security"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: t("settings.emailVerifiedSuccess") });
    },
    onError: showError,
  });
  const resendVerification = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/resend-verification", { email: security.data?.email }),
    onSuccess: () => {
      setResendCooldown(60);
      toast({ title: t("settings.verificationRequested"), description: t("settings.checkInbox") });
    },
    onError: showError,
  });
  const endingSession = changePassword.isPending || logoutAll.isPending;

  const closePasswordForm = () => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  const submitPassword = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    if (hasUnsavedChanges || endingSession) return;
    if (newPassword.length < 8 || new TextEncoder().encode(newPassword).length > 72) {
      setPasswordError(t("settings.passwordRequirements"));
    } else if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
    } else {
      changePassword.mutate();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />{t("settings.accountSecurity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {security.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-9 w-40" /></div>
        ) : security.isError || !security.data ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">{t("settings.securityLoadError")}</p>
            <Button variant="outline" size="sm" disabled={security.isFetching} onClick={() => security.refetch()}>{t("settings.retrySecurity")}</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4" />{t("settings.emailVerification")}</span>
                <Badge variant="outline">{security.data.emailVerified ? t("common.verified") : t("common.notVerified")}</Badge>
              </div>
              <p className="break-all text-xs text-muted-foreground">{security.data.email}</p>
              {!security.data.emailVerified && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">{t("settings.verificationDescription")}</p>
                  <form className="space-y-2" onSubmit={event => { event.preventDefault(); if (/^\d{6}$/.test(code) && !verifyEmail.isPending) verifyEmail.mutate(); }}>
                    <Label htmlFor="security-verification-code">{t("settings.verificationCode")}</Label>
                    <div className="flex flex-wrap gap-2">
                      <Input id="security-verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1" required disabled={endingSession || verifyEmail.isPending} data-testid="input-security-verification-code" />
                      <Button type="submit" size="sm" disabled={!/^\d{6}$/.test(code) || verifyEmail.isPending || endingSession} data-testid="button-security-verify-email">
                        {verifyEmail.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("settings.verifyEmail")}
                      </Button>
                    </div>
                  </form>
                  <Button variant="outline" size="sm" disabled={resendVerification.isPending || resendCooldown > 0 || endingSession || verifyEmail.isPending} onClick={() => resendVerification.mutate()} data-testid="button-security-resend-verification">
                    {resendVerification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {resendCooldown > 0 ? t("settings.resendCountdown", { seconds: resendCooldown }) : t("settings.resendVerification")}
                  </Button>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{t("settings.googleAccount")}</span>
                <Badge variant="outline">{security.data.googleConnected ? t("settings.connected") : t("settings.notConnected")}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{security.data.googleConnected ? t("settings.googleConnectedDescription") : t("settings.googleNotConnectedDescription")}</p>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium"><KeyRound className="h-4 w-4" />{t("settings.password")}</p>
              {security.data.hasPassword ? (
                <>
                  <p className="text-xs text-muted-foreground">{t("settings.changePasswordDescription")}</p>
                  {!showPasswordForm ? (
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)} disabled={endingSession || hasUnsavedChanges} data-testid="button-open-change-password">{t("settings.changePassword")}</Button>
                  ) : (
                    <form className="space-y-3" onSubmit={submitPassword}>
                      <div className="space-y-1.5">
                        <Label htmlFor="security-current-password">{t("settings.currentPassword")}</Label>
                        <Input id="security-current-password" type="password" autoComplete="current-password" maxLength={128} value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required disabled={endingSession} data-testid="input-current-password" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="security-new-password">{t("settings.newPassword")}</Label>
                        <Input id="security-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={event => setNewPassword(event.target.value)} required disabled={endingSession} aria-describedby="security-password-hint security-password-error" data-testid="input-new-password" />
                        <p id="security-password-hint" className="text-xs text-muted-foreground">{t("settings.passwordRequirements")}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="security-confirm-password">{t("settings.confirmPassword")}</Label>
                        <Input id="security-confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required disabled={endingSession} data-testid="input-confirm-password" />
                      </div>
                      <p id="security-password-error" role={passwordError ? "alert" : undefined} className="text-xs text-destructive">{passwordError}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" size="sm" disabled={endingSession || hasUnsavedChanges} data-testid="button-change-password">
                          {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t("settings.changePassword")}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={closePasswordForm} disabled={endingSession}>{t("settings.cancelSecurityAction")}</Button>
                      </div>
                    </form>
                  )}
                </>
              ) : <p className="text-xs text-muted-foreground">{t("settings.googlePasswordDescription")}</p>}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t("settings.sessions")}</p>
                <Button variant="ghost" size="sm" disabled={security.isFetching || endingSession} onClick={() => security.refetch()} data-testid="button-refresh-sessions">{t("settings.refreshSessions")}</Button>
              </div>
              <div className="space-y-2" data-testid="active-sessions-list">
                {security.data.sessions.map((session, index) => (
                  <div key={index} className="space-y-1 rounded-md border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{[session.browser, session.platform].filter(Boolean).join(" · ") || t("settings.unknownDevice")}</span>
                      {session.current && <Badge variant="secondary">{t("settings.thisDevice")}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{session.signedInAt ? t("settings.sessionSignedIn", { date: formatDate(session.signedInAt) }) : t("settings.legacySession")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.sessionExpires", { date: formatDate(session.expiresAt) })}</p>
                  </div>
                ))}
                {security.data.sessions.length === 0 && <p className="text-xs text-muted-foreground">{t("settings.noSessions")}</p>}
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.signOutAllDescription")}</p>
              {hasUnsavedChanges && <p className="text-xs text-amber-600 dark:text-amber-400">{t("settings.saveBeforeSecurityAction")}</p>}
              <Button variant="outline" size="sm" className="gap-2" disabled={endingSession || hasUnsavedChanges} onClick={() => setLogoutDialogOpen(true)} data-testid="button-sign-out-all">
                {logoutAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}{t("settings.signOutAll")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.signOutAllConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.signOutAllDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.cancelSecurityAction")}</AlertDialogCancel>
            <AlertDialogAction disabled={endingSession || hasUnsavedChanges} onClick={() => logoutAll.mutate()} data-testid="button-confirm-sign-out-all">{t("settings.signOutAll")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getConfig } from "@/lib/config";
import { AuthContent } from "@/components/auth/auth-content";
import { getEnabledAuthProviderIds } from "@/lib/auth/provider-config";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  const config = await getConfig();
  const providers = await getEnabledAuthProviderIds();
  const hasCredentials = providers.includes("credentials");

  // Block registration if disabled or credentials not enabled
  if (!hasCredentials || !config.auth.allowRegistration) {
    redirect("/login");
  }

  return (
    <div className="container flex min-h-[calc(100vh-6rem)] flex-col items-center justify-center py-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">{t("register")}</h1>
          <p className="text-xs text-muted-foreground">{t("registerDescription")}</p>
        </div>
        <div className="border rounded-lg p-4">
          <AuthContent providers={providers} mode="register" />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-foreground hover:underline">{t("login")}</Link>
        </p>
      </div>
    </div>
  );
}

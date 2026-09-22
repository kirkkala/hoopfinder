import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginView } from "@/components/auth/LoginView";
import {
  getAuthSession,
  googleAuthConfigured,
  safeCallbackUrl,
} from "@/auth";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.signInTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const session = await getAuthSession();
  if (session?.user?.isAdmin) redirect(callbackUrl);

  const { courts, fetchedAtBySource } = await getCourtCatalog();
  const error = params.error;
  return (
    <LoginView
      configured={googleAuthConfigured()}
      callbackUrl={callbackUrl}
      signedInEmail={session?.user?.email ?? null}
      error={Array.isArray(error) ? error.length > 0 : Boolean(error)}
      courtCount={courts.length}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}

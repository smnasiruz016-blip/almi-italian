import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started with AlmiItalian",
  description: "Create your AlmiItalian account and start a 7-day free trial of honest CILS & CELI practice.",
  alternates: { canonical: canonical("/signup") },
};

export default function Page() {
  return (
    <AuthCard
      heading="Create your account"
      sub="3 days free, no card. Then a 7-day free trial — card saved, not charged — and $12/month. Cancel anytime."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-almi-link underline">
            Log in
          </Link>
        </>
      }
    >
      <AuthForm mode="signup" />
    </AuthCard>
  );
}

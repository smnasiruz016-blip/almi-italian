import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { AuthForm } from "@/components/AuthForm";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log in — AlmiItalian",
  description: "Log in to AlmiItalian to continue your CILS or CELI practice.",
  alternates: { canonical: canonical("/login") },
};

export default function Page() {
  return (
    <Article eyebrow="Log in" title="Welcome back" shamool={false}>
      <AuthForm mode="login" />
      <p className="text-sm text-almi-text-muted">
        New here? <Link href="/signup" className="text-almi-coral hover:underline">Create an account</Link>.
      </p>
    </Article>
  );
}

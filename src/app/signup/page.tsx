import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { AuthForm } from "@/components/AuthForm";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started with AlmiItalian",
  description: "Create a free AlmiItalian account and start practising CILS or CELI with honest, clearly-labelled estimates.",
  alternates: { canonical: canonical("/signup") },
};

export default function Page() {
  return (
    <Article eyebrow="Get started" title="Create your account" lede="Free to start — practise Listening and Reading with honest, total-based read-outs, and try the Writing composer. The full timed mock and premium features unlock with the 7-day trial." shamool={false}>
      <AuthForm mode="signup" />
      <p className="text-sm text-almi-text-muted">
        Already have an account? <Link href="/login" className="text-almi-coral hover:underline">Log in</Link>.
      </p>
    </Article>
  );
}

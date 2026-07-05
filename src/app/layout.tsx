import type { Metadata } from "next";
import "./globals.css";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

export const metadata: Metadata = {
  title: {
    default: "AlmiItalian | Honest CILS & CELI Practice",
    template: "%s · AlmiItalian",
  },
  description:
    "Practise real CILS and CELI task formats on their own real scales — never mixed. Citizenship needs B1, the long-term permit needs A2. Writing & speaking are labelled estimates, never official scores.",
  metadataBase: new URL("https://almiitalian.almiworld.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <GlobalHeader />
        {children}
        <GlobalFooter />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Console | KALASH & KUMKUM",
  description: "Secure KALASH & KUMKUM store administration.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}

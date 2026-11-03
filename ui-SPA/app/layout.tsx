import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jesus.io"),
  title: "jesuschrist-cli — Scripture in your terminal",
  description: "A fast, keyboard-first Bible terminal experience for Node.js developers.",
  alternates: { canonical: "https://jesus.io" },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#303034",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

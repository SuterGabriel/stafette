import type { Metadata } from "next";
// Font bundled locally (works offline, no Google Fonts request at the venue)
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: "Stafette",
  description: "Switch doctors. Your medical history comes along.",
  icons: { icon: "/stafette-mark.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

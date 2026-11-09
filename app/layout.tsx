import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Montserrat } from "next/font/google";
import { RegisterSW } from "@/components/register-sw";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "دينتال شير", template: "%s | دينتال شير" },
  description: "عيادتك، خدماتك، مجتمعك. عرض تجريبي لمنصة عيادات الأسنان.",
  applicationName: "Dental Share",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${montserrat.variable}`}>
      <body className={`${plex.className} min-h-dvh antialiased`}>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import WhatsAppButton from "@/components/WhatsAppButton";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Trackline — Premium Bus Booking, Cameroon",
  description:
    "Book intercity bus trips across Cameroon in seconds. Beautiful, fast and reliable.",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <I18nProvider>
          <ToastProvider>
            {children}
            <WhatsAppButton />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

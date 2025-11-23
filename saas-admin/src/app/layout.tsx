import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationContainer from "@/components/notifications/NotificationContainer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS Admin",
  description: "Admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // mismatch uyarısını bastır ve server başlangıcını 'dark' yap
    <html lang="en" suppressHydrationWarning className="dark" style={{ colorScheme: "dark" }}>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <NotificationProvider>
            {children}
            <NotificationContainer />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

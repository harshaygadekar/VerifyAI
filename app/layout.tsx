import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: "VerifyAI - AI-Powered Multi-Source Search",
  description: "Advanced search with AI-powered insights, news, images, and real-time information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import { ToastProvider } from '@/components/ToastProvider';
import { LoginModalProvider } from '@/context/LoginModalContext';
import Api401Provider from '@/components/Api401Provider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ImagineHub - Share and Create AI Art",
  description: "A platform for sharing and creating AI-generated art",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-white text-gray-900"}>
        <LoginModalProvider>
          <ToastProvider>
            <Api401Provider>
              <AuthProvider>
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
              </AuthProvider>
            </Api401Provider>
          </ToastProvider>
        </LoginModalProvider>
      </body>
    </html>
  );
}

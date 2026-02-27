import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react";
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'TechWiser – AI Website & App Builder',
  description: 'Futuristic AI-powered platform to build, preview, and refine websites and apps.',
};

import { LanguageProvider } from '@/context/LanguageContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConvexClientProvider } from './ConvexClientProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#050505] text-white antialiased selection:bg-emerald-500/30" suppressHydrationWarning>
        <ConvexClientProvider>
          <SettingsProvider>
            <AuthProvider>
              <LanguageProvider>
                {children}
                <Analytics />
              </LanguageProvider>
            </AuthProvider>
          </SettingsProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

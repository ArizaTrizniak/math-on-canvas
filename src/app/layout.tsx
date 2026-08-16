import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { BASE_URL, OG_IMAGE } from '@/lib/site'
import { AnalyticsInit } from '@/common/utils/AnalyticsInit'
import { AuthProvider } from '@/lib/auth/authContext'
import { NativeAuthModal } from '@/common/widgets/NativeAuthModal/NativeAuthModal'
import { SessionExpiredModal } from '@/common/widgets/SessionExpiredModal/SessionExpiredModal'
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
    metadataBase: new URL(BASE_URL),
    verification: {
        google: 'V9aBAqm7iwSfHdstdu5wLhcsneSwHEDUufFC4VnBIgk',
    },
    title: "Math on Canvas — Online Math Diagram & Formula Editor for Teachers",
    description: "Create math diagrams, geometry figures and LaTeX formulas on one canvas. Export to PDF. Free online tool for math teachers.",
    openGraph: {
        title: "Math on Canvas — Online Math Diagram & Formula Editor for Teachers",
        description: "Create math diagrams, geometry figures and LaTeX formulas on one canvas. Export to PDF. Free online tool for math teachers.",
        url: BASE_URL,
        siteName: "Math on Canvas",
        type: "website",
        images: [OG_IMAGE],
    },
}

// Structured data is emitted per route, in the route's own language:
// the landing builds WebApplication + FAQPage, catalog and pricing build their own.

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers()
    const lang = headersList.get('x-lang') ?? 'en'

    return (
        <html lang={lang}>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <AuthProvider>
                    <AnalyticsInit />
                    {children}
                    <NativeAuthModal />
                    <SessionExpiredModal />
                </AuthProvider>
            </body>
        </html>
    );
}
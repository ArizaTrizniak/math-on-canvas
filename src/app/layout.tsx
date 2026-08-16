import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
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

// `lang` used to come from `headers()` (x-lang, set by the proxy) — a runtime
// read that pins the whole tree to per-request rendering. The locale is
// already the URL's own first path segment (/en, /ru, /es, /de), so an
// inline script can set it client-side before paint instead: same fix as the
// theme-cookie pattern in the Next docs, but reading the pathname needs no
// cookie at all. suppressHydrationWarning tells React to accept the DOM
// value the script wrote over the "en" default baked into the HTML.
const SET_LANG_SCRIPT = `(function(){try{var m=location.pathname.match(/^\\/(en|ru|es|de)(?:\\/|$)/);if(m)document.documentElement.lang=m[1]}catch(e){}})()`

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: SET_LANG_SCRIPT }} />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <AuthProvider>
                    {/* useSearchParams() needs request-time data — wrapping it lets the
                        rest of the tree (now header()-free) still prerender statically. */}
                    <Suspense fallback={null}>
                        <AnalyticsInit />
                    </Suspense>
                    {children}
                    <NativeAuthModal />
                    <SessionExpiredModal />
                </AuthProvider>
            </body>
        </html>
    );
}
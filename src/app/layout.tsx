import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const BASE_URL = 'https://math-on-canvas.com'

export const metadata: Metadata = {
    title: "Math on Canvas — Online Math Diagram & Formula Editor for Teachers",
    description: "Create math diagrams, geometry figures and LaTeX formulas on one canvas. Export to PDF. Free online tool for math teachers.",
    openGraph: {
        title: "Math on Canvas — Online Math Diagram & Formula Editor for Teachers",
        description: "Create math diagrams, geometry figures and LaTeX formulas on one canvas. Export to PDF. Free online tool for math teachers.",
        url: BASE_URL,
        siteName: "Math on Canvas",
        type: "website",
        images: [{
            url: `${BASE_URL}/images/screen1.webp`,
            width: 1600,
            height: 900,
            alt: "Math on Canvas — math diagram editor",
        }],
    },
}

const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Math on Canvas',
    url: BASE_URL,
    description: 'Online math diagram and formula editor for teachers. Create geometry figures, LaTeX formulas, and export to PDF.',
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers()
    const lang = headersList.get('x-lang') ?? 'en'

    return (
        <html lang={lang}>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                {children}
            </body>
        </html>
    );
}
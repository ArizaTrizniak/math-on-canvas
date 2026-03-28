import type { Metadata } from 'next'

const BASE_URL = 'https://math-on-canvas.com'

const ogMeta: Record<string, { title: string; description: string }> = {
    en: {
        title: 'Math on Canvas — Your math diagrams: simpler, faster, clearer.',
        description: 'There are plenty of ready-made materials online, but finding the right one takes time. With MathOnCanvas you build exactly what your lesson needs.',
    },
    ru: {
        title: 'Math on Canvas — Ваши математические наглядные пособия: проще, быстрее, удобнее',
        description: 'В сети много готовых пособий, но поиск нужного занимает время. С MathOnCanvas вы делаете именно то, что нужно вашему уроку — и именно так, как хотите.',
    },
    es: {
        title: 'Math on Canvas — Tus diagramas matemáticos: más simples, rápidos y claros.',
        description: 'Hay muchos materiales listos en internet, pero encontrar el adecuado lleva tiempo. Con MathOnCanvas construyes exactamente lo que tu lección necesita.',
    },
    de: {
        title: 'Math on Canvas — Ihre Mathe-Diagramme: einfacher, schneller, klarer.',
        description: 'Es gibt viele fertige Materialien online, aber das Richtige zu finden dauert. Mit MathOnCanvas erstellen Sie genau das, was Ihre Unterrichtsstunde braucht.',
    },
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string }>
}): Promise<Metadata> {
    const { lang } = await params
    const canonical = `${BASE_URL}/${lang}`
    const og = ogMeta[lang] ?? ogMeta['en']

    return {
        alternates: {
            canonical,
            languages: {
                'en': `${BASE_URL}/en`,
                'ru': `${BASE_URL}/ru`,
                'es': `${BASE_URL}/es`,
                'de': `${BASE_URL}/de`,
                'x-default': `${BASE_URL}/en`,
            },
        },
        openGraph: {
            title: og.title,
            description: og.description,
            url: canonical,
            siteName: 'Math on Canvas',
            type: 'website',
            images: [{
                url: `${BASE_URL}/images/screen1.webp`,
                width: 1600,
                height: 900,
                alt: 'Math on Canvas — math diagram editor',
            }],
        },
    }
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
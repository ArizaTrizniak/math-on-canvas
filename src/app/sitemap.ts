import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/site'
const LANGUAGES = ['en', 'ru', 'es', 'de'] as const

export default function sitemap(): MetadataRoute.Sitemap {
    return LANGUAGES.map((lang) => ({
        url: `${BASE_URL}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
        alternates: {
            languages: Object.fromEntries(
                LANGUAGES.map((l) => [l, `${BASE_URL}/${l}`])
            ),
        },
    }))
}
import { describe, it, expect } from 'vitest'
import { LANGUAGES } from '@/lib/i18n/constants'
import { buildLandingJsonLd } from './jsonld'
import { featureKeys, faqKeys } from './keys'

const BASE = 'https://www.math-on-canvas.com'

describe('buildLandingJsonLd', () => {
    it('emits a WebApplication and a FAQPage', () => {
        const ld = buildLandingJsonLd('en', BASE)
        expect(ld['@graph'].map((node) => node['@type'])).toEqual(['WebApplication', 'FAQPage'])
    })

    it('lists every feature and every FAQ entry', () => {
        const [app, faq] = buildLandingJsonLd('en', BASE)['@graph']
        expect(app.featureList).toHaveLength(featureKeys.length)
        expect(faq.mainEntity).toHaveLength(faqKeys.length)
        expect(faq.mainEntity!.every((q) => q.name.length > 0 && q.acceptedAnswer.text.length > 0)).toBe(true)
    })

    it('describes each locale in its own language', () => {
        for (const { code } of LANGUAGES) {
            const [app, faq] = buildLandingJsonLd(code, BASE)['@graph']
            expect(app.inLanguage).toBe(code)
            expect(faq.inLanguage).toBe(code)
            expect(app.url).toBe(`${BASE}/${code}`)
        }
    })

    it('gives every locale a distinct description', () => {
        const descriptions = LANGUAGES.map(({ code }) => buildLandingJsonLd(code, BASE)['@graph'][0].description)
        expect(new Set(descriptions).size).toBe(LANGUAGES.length)
    })
})
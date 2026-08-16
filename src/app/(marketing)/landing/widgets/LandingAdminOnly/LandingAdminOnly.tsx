'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/lib/auth/authContext'

/**
 * Both components below gate on the client AuthProvider's role, same as the
 * old server-side `isAdmin(user)` check — but this is a UI affordance, not a
 * security boundary: /catalog itself doesn't gate by role, this just keeps
 * the admin-only nav link and teaser out of the way for everyone else. The
 * landing page no longer resolves the user server-side (see LandingPage.tsx),
 * so these read auth state client-side instead.
 */
function useIsAdmin(): boolean {
    const { user } = useAuthContext()
    return user?.role === 'admin'
}

export function LandingAdminNavLink({ href, children }: { href: string; children: ReactNode }) {
    if (!useIsAdmin()) return null
    return (
        <Link href={href} className="landing__ghost">
            {children}
        </Link>
    )
}

interface CategoryLink {
    category: string
    label: string
}

interface LandingAdminCatalogTeaserProps {
    lang: string
    title: string
    description: string
    cta: string
    categoriesLabel: string
    categories: CategoryLink[]
}

export function LandingAdminCatalogTeaser({
    lang,
    title,
    description,
    cta,
    categoriesLabel,
    categories,
}: LandingAdminCatalogTeaserProps) {
    if (!useIsAdmin()) return null

    return (
        <section className="landing__catalog">
            <div className="landing__catalog-copy">
                <h2>{title}</h2>
                <p>{description}</p>
                <Link href={`/${lang}/catalog`} className="landing__catalog-cta">
                    {cta}
                </Link>
            </div>
            <div className="landing__catalog-categories">
                <div className="landing__catalog-categories-title">{categoriesLabel}</div>
                <ul>
                    {categories.map(({ category, label }) => (
                        <li key={category}>
                            <Link href={`/${lang}/catalog/category/${category}`}>{label}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

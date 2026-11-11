export function buildGoogleSignInUrl(apiBase: string, origin: string, pathname: string): string {
    const url = new URL(`${apiBase}/auth/login`)
    url.searchParams.set('redirect_uri', origin + pathname)
    return url.toString()
}

/** Full-page redirect into the Google OAuth flow; returns to the current page. */
export function startGoogleSignIn(): void {
    window.location.href = buildGoogleSignInUrl(
        process.env.NEXT_PUBLIC_AUTH_API_URL ?? '',
        window.location.origin,
        window.location.pathname,
    )
}

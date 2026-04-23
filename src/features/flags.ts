const FLAGS = {
    nativeAuth: false,
} satisfies Record<string, boolean>

export type FeatureFlag = keyof typeof FLAGS

function resolveFromQueryParams(flag: FeatureFlag): boolean | undefined {
    const params = new URLSearchParams(window.location.search)
    return params.has(flag) ? true : undefined
}

export function isEnabled(flag: FeatureFlag): boolean {
    return resolveFromQueryParams(flag) ?? FLAGS[flag]
}
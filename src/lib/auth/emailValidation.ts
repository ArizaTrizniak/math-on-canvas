export type EmailProblem = 'missingAt' | 'missingDomain'

/** Cheap on-blur check for the two typos people actually make. The server is the real validator. */
export function emailProblem(raw: string): EmailProblem | null {
    const email = raw.trim()
    if (!email) return null
    const at = email.lastIndexOf('@')
    if (at < 1) return 'missingAt'
    const domain = email.slice(at + 1)
    const dot = domain.lastIndexOf('.')
    if (dot < 1 || dot === domain.length - 1) return 'missingDomain'
    return null
}

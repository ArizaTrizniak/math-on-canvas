const errorMap: Record<string, string> = {
    email_already_exists: 'auth:errors.emailAlreadyExists',
    invalid_confirmation_code: 'auth:errors.invalidCode',
    unauthorized: 'auth:errors.invalidCredentials',
    rate_limit_exceeded: 'auth:errors.rateLimited',
    password_too_weak: 'auth:errors.passwordTooWeak',
}

export function mapNativeAuthError(code: string): string {
    return errorMap[code] ?? 'auth:errors.unknown'
}

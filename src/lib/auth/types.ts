export type Role = 'free_user' | 'pro_user' | 'business_user' | 'admin'

export interface AuthUser {
    userId: string
    role: Role
    entitlements: string[]
}

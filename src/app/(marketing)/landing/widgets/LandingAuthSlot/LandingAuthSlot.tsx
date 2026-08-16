'use client'

import { useAuthContext } from '@/lib/auth/authContext'
import UserMenu from '@/common/widgets/UserMenu/UserMenu'
import { LandingSignIn } from '../LandingSignIn/LandingSignIn'

interface LandingAuthSlotProps {
    signInLabel: string
    signOutLabel: string
}

/**
 * Reads auth state from AuthProvider instead of a server-passed user/displayName
 * (the page no longer calls cookies()/getUserFromHeaders() — that pinned the
 * whole landing route to per-request rendering). Defaults to the signed-out
 * view while status is 'loading': most visitors are guests, so a returning
 * signed-in user sees a brief flip from "Sign in" to their avatar instead of
 * a skeleton on every load.
 */
export function LandingAuthSlot({ signInLabel, signOutLabel }: LandingAuthSlotProps) {
    const { user, status } = useAuthContext()

    if (status === 'authenticated' && user) {
        return <UserMenu displayName={user.displayName} signOutLabel={signOutLabel} />
    }
    return <LandingSignIn label={signInLabel} />
}

export default LandingAuthSlot

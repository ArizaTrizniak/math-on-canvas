import { Suspense } from 'react'
import { SignUpForm } from './SignUpForm'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
    return (
        <Suspense>
            <SignUpForm />
        </Suspense>
    )
}

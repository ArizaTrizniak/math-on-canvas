import { Suspense } from 'react'
import { ConfirmForm } from './ConfirmForm'

export const dynamic = 'force-dynamic'

export default function ConfirmPage() {
    return (
        <Suspense>
            <ConfirmForm />
        </Suspense>
    )
}

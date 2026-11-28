// @vitest-environment happy-dom

import React, { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthUnauthenticatedError, type UserProfile } from '@/lib/auth/authTypes'
import { saveIntent, readIntent } from '../intent'

const mockAuthApiClient = vi.hoisted(() => ({
  getMe: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signIn: vi.fn(),
  resendCode: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}))

const mockReloadToRecoverSession = vi.hoisted(() => vi.fn())
const mockFlushAnalytics = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/en/catalog',
}))

vi.mock('@/lib/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/common/utils/analytics', () => ({
  flushAnalytics: mockFlushAnalytics,
  syncInternalFromRole: vi.fn(),
}))

vi.mock('@/common/analytics/track', () => ({
  track: vi.fn(),
}))

vi.mock('@/lib/auth/recoverSession', () => ({
  reloadToRecoverSession: mockReloadToRecoverSession,
}))

vi.mock('@/lib/auth/authApiClient', () => ({
  authApiClient: mockAuthApiClient,
}))

import { AuthProvider, useAuthContext } from '@/lib/auth/authContext'
import { CatalogIntentResume } from './CatalogIntentResume'

const testUser: UserProfile = {
  userId: 'usr_1',
  email: 'teacher@example.com',
  displayName: 'Teacher',
  role: 'free_user',
  entitlements: { products: [], aiCredits: null, plan: null },
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('AuthProvider + CatalogIntentResume integration', () => {
  let container: HTMLDivElement
  let root: Root
  let assignSpy: ReturnType<typeof vi.fn>
  let latestAuth: ReturnType<typeof useAuthContext> | null = null

  function Probe({ onUpdate }: { onUpdate: (auth: ReturnType<typeof useAuthContext>) => void }) {
    const auth = useAuthContext()
    useEffect(() => {
      onUpdate(auth)
    }, [auth, onUpdate])
    return <CatalogIntentResume />
  }

  const renderProbe = () => (
    <AuthProvider>
      <Probe onUpdate={(auth) => { latestAuth = auth }} />
    </AuthProvider>
  )

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.clearAllMocks()
    sessionStorage.clear()
    window.history.replaceState(null, '', '/en/catalog')
    assignSpy = vi.fn()
    vi.spyOn(window.location, 'assign').mockImplementation(assignSpy as unknown as (url: string | URL) => void)

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    latestAuth = null
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
    vi.restoreAllMocks()
  })

  it('opens the editor after confirmSignUp auto-signIn fails and user signs in manually', async () => {
    mockAuthApiClient.getMe.mockRejectedValueOnce(new AuthUnauthenticatedError())
    mockAuthApiClient.signUp.mockResolvedValueOnce({ confirmationRequired: true, email: 'teacher@example.com' })
    mockAuthApiClient.confirmSignUp.mockResolvedValueOnce({ confirmed: true })
    mockAuthApiClient.signIn
      .mockRejectedValueOnce(new Error('temporary signIn failure'))
      .mockResolvedValueOnce({ success: true })
    mockAuthApiClient.getMe.mockResolvedValueOnce(testUser)

    await act(async () => {
      root.render(renderProbe())
    })
    await flushEffects()

    expect(latestAuth?.status).toBe('guest')

    await act(async () => {
      saveIntent('doc-1')
      latestAuth?.openSignUpModal('catalog')
      await latestAuth?.submitSignUp('teacher@example.com', 'Password123!', 'Teacher')
      await latestAuth?.submitConfirmEmail('teacher@example.com', '123456')
    })
    await flushEffects()

    expect(latestAuth?.status).toBe('guest')
    expect(latestAuth?.nativeAuthModalOpen).toBe(true)
    expect(assignSpy).not.toHaveBeenCalled()

    await act(async () => {
      await latestAuth?.submitSignIn('teacher@example.com', 'Password123!')
    })
    await flushEffects()

    expect(latestAuth?.status).toBe('authenticated')
    expect(latestAuth?.nativeAuthModalOpen).toBe(false)
    expect(assignSpy).toHaveBeenCalledTimes(1)
    expect(assignSpy).toHaveBeenCalledWith('/editor?doc=doc-1')
  })

  it('resumes intent on Google OAuth return (?auth_result=login)', async () => {
    saveIntent('doc-2')
    window.history.replaceState(null, '', '/en/catalog?auth_result=login')
    mockAuthApiClient.getMe.mockResolvedValueOnce(testUser)

    await act(async () => {
      root.render(renderProbe())
    })
    await flushEffects()

    expect(assignSpy).toHaveBeenCalledTimes(1)
    expect(assignSpy).toHaveBeenCalledWith('/editor?doc=doc-2')
    expect(readIntent()).toBeNull()
  })

  it('clears intent when guest closes the modal and does not redirect on later sign-in', async () => {
    mockAuthApiClient.getMe
      .mockRejectedValueOnce(new AuthUnauthenticatedError())
      .mockResolvedValueOnce(testUser)
    mockAuthApiClient.signIn.mockResolvedValueOnce({ success: true })

    await act(async () => {
      root.render(renderProbe())
    })
    await flushEffects()

    await act(async () => {
      saveIntent('doc-3')
      latestAuth?.openSignUpModal('catalog')
    })
    expect(readIntent()).toBe('doc-3')

    await act(async () => {
      latestAuth?.closeNativeAuthModal()
    })
    await flushEffects()

    expect(readIntent()).toBeNull()

    await act(async () => {
      latestAuth?.openSignInModal('landing')
      await latestAuth?.submitSignIn('teacher@example.com', 'Password123!')
    })
    await flushEffects()

    expect(assignSpy).not.toHaveBeenCalled()
  })

  it('closes modal and redirects when CTA was clicked while auth status was loading', async () => {
    let resolveGetMe!: (user: UserProfile) => void
    mockAuthApiClient.getMe.mockReturnValueOnce(
      new Promise<UserProfile>((resolve) => {
        resolveGetMe = resolve
      }),
    )

    await act(async () => {
      root.render(renderProbe())
    })

    expect(latestAuth?.status).toBe('loading')

    await act(async () => {
      saveIntent('doc-4')
      latestAuth?.openSignUpModal('catalog')
    })

    expect(latestAuth?.nativeAuthModalOpen).toBe(true)
    expect(assignSpy).not.toHaveBeenCalled()

    await act(async () => {
      resolveGetMe(testUser)
    })
    await flushEffects()

    expect(latestAuth?.status).toBe('authenticated')
    expect(latestAuth?.nativeAuthModalOpen).toBe(false)
    expect(assignSpy).toHaveBeenCalledTimes(1)
    expect(assignSpy).toHaveBeenCalledWith('/editor?doc=doc-4')
  })

  it('keeps intent across reloadToRecoverSession when finishSignIn cannot load getMe', async () => {
    mockAuthApiClient.getMe
      .mockRejectedValueOnce(new AuthUnauthenticatedError())
      .mockRejectedValueOnce(new Error('network glitch'))
    mockAuthApiClient.signIn.mockResolvedValueOnce({ success: true })

    await act(async () => {
      root.render(renderProbe())
    })
    await flushEffects()

    await act(async () => {
      saveIntent('doc-5')
      latestAuth?.openSignUpModal('catalog')
      await latestAuth?.submitSignIn('teacher@example.com', 'Password123!')
    })
    await flushEffects()

    expect(mockReloadToRecoverSession).toHaveBeenCalledTimes(1)
    expect(readIntent()).toBe('doc-5')
    expect(assignSpy).not.toHaveBeenCalled()
  })
})

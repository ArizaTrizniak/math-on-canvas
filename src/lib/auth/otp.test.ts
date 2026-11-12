import { describe, it, expect } from 'vitest'
import { OTP_LENGTH, emptyOtp, applyOtpInput, applyOtpBackspace, otpValue, formatCountdown, shouldAutoSubmit } from './otp'

describe('emptyOtp / otpValue', () => {
    it('creates six empty cells and joins them back', () => {
        expect(OTP_LENGTH).toBe(6)
        expect(emptyOtp()).toEqual(['', '', '', '', '', ''])
        expect(otpValue(['1', '2', '', '4', '', ''])).toBe('124')
    })
})

describe('applyOtpInput', () => {
    it('puts a typed digit in the cell and moves focus forward', () => {
        const r = applyOtpInput(emptyOtp(), 0, '4')
        expect(r.cells).toEqual(['4', '', '', '', '', ''])
        expect(r.focusIndex).toBe(1)
    })

    it('ignores non-digits and keeps focus', () => {
        const r = applyOtpInput(emptyOtp(), 2, 'a')
        expect(r.cells).toEqual(emptyOtp())
        expect(r.focusIndex).toBe(2)
    })

    it('replaces an existing digit with the newly typed one', () => {
        const r = applyOtpInput(['1', '2', '', '', '', ''], 1, '27')
        expect(r.cells[1]).toBe('7')
        expect(r.focusIndex).toBe(2)
    })

    it('spreads a pasted code across cells starting at the index', () => {
        const r = applyOtpInput(emptyOtp(), 0, ' 730 926 ')
        expect(r.cells).toEqual(['7', '3', '0', '9', '2', '6'])
        expect(r.focusIndex).toBe(5)
    })

    it('truncates a pasted code that overflows the last cell', () => {
        const r = applyOtpInput(emptyOtp(), 4, '123456')
        expect(r.cells).toEqual(['', '', '', '', '1', '2'])
        expect(r.focusIndex).toBe(5)
    })
})

describe('applyOtpBackspace', () => {
    it('clears the current cell when it has a digit', () => {
        const r = applyOtpBackspace(['1', '2', '3', '', '', ''], 2)
        expect(r.cells).toEqual(['1', '2', '', '', '', ''])
        expect(r.focusIndex).toBe(2)
    })

    it('clears the previous cell and moves back when the current one is empty', () => {
        const r = applyOtpBackspace(['1', '2', '', '', '', ''], 2)
        expect(r.cells).toEqual(['1', '', '', '', '', ''])
        expect(r.focusIndex).toBe(1)
    })

    it('stays on the first cell', () => {
        const r = applyOtpBackspace(emptyOtp(), 0)
        expect(r.focusIndex).toBe(0)
    })
})

describe('formatCountdown', () => {
    it('formats seconds as m:ss', () => {
        expect(formatCountdown(42)).toBe('0:42')
        expect(formatCountdown(60)).toBe('1:00')
        expect(formatCountdown(5)).toBe('0:05')
        expect(formatCountdown(-3)).toBe('0:00')
    })
})

describe('shouldAutoSubmit', () => {
    it('submits when the sixth digit lands', () => {
        expect(shouldAutoSubmit(['1', '2', '3', '4', '5', ''], ['1', '2', '3', '4', '5', '6'])).toBe(true)
    })

    it('submits a freshly pasted code that replaces a rejected full one', () => {
        expect(shouldAutoSubmit(['0', '0', '0', '0', '0', '0'], ['1', '2', '3', '4', '5', '6'])).toBe(true)
    })

    it('does not resubmit an unchanged code or an incomplete one', () => {
        expect(shouldAutoSubmit(['1', '2', '3', '4', '5', '6'], ['1', '2', '3', '4', '5', '6'])).toBe(false)
        expect(shouldAutoSubmit(emptyOtp(), ['1', '2', '', '', '', ''])).toBe(false)
    })
})

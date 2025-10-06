export function validateNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  if (cleaned.startsWith('+234')) {
    return cleaned.length === 14
  }

  if (cleaned.startsWith('0')) {
    return cleaned.length === 11
  }

  if (cleaned.startsWith('234')) {
    return cleaned.length === 13
  }

  return cleaned.length === 10
}

export function formatNigerianPhone(phone: string): string {
  if (!phone) return ''

  let cleaned = phone.replace(/[\s\-\(\)]/g, '')

  if (cleaned.startsWith('+234')) {
    cleaned = cleaned.substring(4)
  } else if (cleaned.startsWith('234')) {
    cleaned = cleaned.substring(3)
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }

  if (cleaned.length !== 10) {
    return phone
  }

  return `+234 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`
}

export function cleanNigerianPhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '')
}

export function isValidNigerianPhoneLength(phone: string): boolean {
  const cleaned = cleanNigerianPhone(phone)

  if (cleaned.startsWith('+234')) {
    return cleaned.length === 14
  }

  if (cleaned.startsWith('234')) {
    return cleaned.length === 13
  }

  if (cleaned.startsWith('0')) {
    return cleaned.length === 11
  }

  return cleaned.length === 10
}

export function formatPhoneInput(value: string): string {
  let cleaned = value.replace(/[^\d]/g, '')

  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = cleaned.substring(1)
  }

  if (cleaned.length > 10) {
    cleaned = cleaned.substring(0, 10)
  }

  let formatted = ''
  if (cleaned.length > 0) {
    formatted = cleaned.substring(0, 3)
  }
  if (cleaned.length >= 4) {
    formatted += ' ' + cleaned.substring(3, 6)
  }
  if (cleaned.length >= 7) {
    formatted += ' ' + cleaned.substring(6, 10)
  }

  return formatted ? `+234 ${formatted}` : ''
}

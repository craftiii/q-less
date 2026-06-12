/** Builds the check-in URL embedded in the QR code */
export function buildCheckInUrl(qrToken) {
  return `${window.location.origin}/check-in/${qrToken}`
}

/** Generates a random anonymous customer token — fallback for HTTP / older mobile browsers */
export function generateCustomerToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

/** Reads or creates a persistent customer token in localStorage */
export function getOrCreateCustomerToken() {
  const key = 'q_customer_token'
  let token = localStorage.getItem(key)
  if (!token) {
    token = generateCustomerToken()
    localStorage.setItem(key, token)
  }
  return token
}

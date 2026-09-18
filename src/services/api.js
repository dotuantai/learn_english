const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://learn-english-backend-a4is.onrender.com').replace(/\/$/, '')
const SESSION_KEY = 'myhoa_auth_session'

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getAuthSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return session?.accessToken && session?.refreshToken ? session : null
  } catch {
    return null
  }
}

export function saveAuthSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY)
}

function errorMessage(problem, fallback) {
  if (problem?.errors) {
    const messages = Object.values(problem.errors).flat().filter(Boolean)
    if (messages.length) return messages.join(' ')
  }
  return problem?.title || problem?.detail || fallback
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const type = response.headers.get('content-type') || ''
  return type.includes('json') ? response.json() : response.text()
}

let refreshPromise = null

async function refreshSession() {
  const session = getAuthSession()
  if (!session) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Refresh token is no longer valid.')
        const nextSession = await response.json()
        saveAuthSession(nextSession)
        return nextSession
      })
      .catch(() => {
        clearAuthSession()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function request(path, options = {}, retry = true) {
  const session = getAuthSession()
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json')
  if (session?.accessToken && !headers.has('Authorization'))
    headers.set('Authorization', `Bearer ${session.accessToken}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (response.status === 401 && retry && session?.refreshToken) {
    const refreshed = await refreshSession()
    if (refreshed) return request(path, options, false)
  }

  const body = await parseResponse(response)
  if (!response.ok) {
    throw new ApiError(
      errorMessage(body, 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'),
      response.status,
      body,
    )
  }

  return body
}

async function authenticate(path, credentials) {
  const session = await request(path, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  saveAuthSession(session)
  return session
}

export const authApi = {
  login: (credentials) => authenticate('/api/auth/login', credentials),
  register: (credentials) => authenticate('/api/auth/register', credentials),
  me: () => request('/api/auth/me'),
  async logout() {
    const session = getAuthSession()
    clearAuthSession()
    if (!session?.refreshToken) return
    try {
      await request(
        '/api/auth/revoke',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        },
        false,
      )
    } catch {
      // The local session is already cleared; revocation remains best effort.
    }
  },
}

export const learningApi = {
  getContent: () => request('/api/learning'),
  getProgress: () => request('/api/learning/progress'),
  importProgress: (masteredWordIds) =>
    request('/api/learning/progress/import', {
      method: 'POST',
      body: JSON.stringify({ masteredWordIds }),
    }),
  setMastered: (wordId, mastered) =>
    request(`/api/learning/progress/${wordId}`, {
      method: 'PUT',
      body: JSON.stringify({ mastered }),
    }),
}

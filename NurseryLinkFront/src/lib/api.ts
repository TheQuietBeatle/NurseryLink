export function getApiUrl() {
  return import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000'
}

export type Account = {
  id: string
  full_name: string
  email: string
  role: string
}

export type Child = {
  id: string
  parent_id: string
  account_id: string | null
  class_id: string | null
  name: string
  date_of_birth: string
  summary_log: string | null
  enrolled_at: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function login(email: string, password: string): Promise<Account> {
  const response = await fetch(`${getApiUrl()}/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.',
    )
  }

  return response.json()
}

export async function getChildrenForAccount(accountId: string): Promise<Child[]> {
  const response = await fetch(`${getApiUrl()}/children/account/${accountId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load children.')
  }

  return response.json()
}

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

export type IncidentReport = {
  id: number
  child_id: number
  description: string
  severity_level: 'low' | 'medium' | 'high' | 'critical'
  incident_timestamp: string
  reported_at: string
  resolved_at: string | null
  teacher_name: string
  acknowledged_at: string | null
}

export type MealLog = {
  id: number
  child_id: number
  activity_timestamp: string
  comments: string | null
  food_portion: string | null
  meal_type: string | null
  teacher_name: string
}

export type SupplyRequest = {
  id: number
  item: string
  quantity: number
  note: string | null
  requested_at: string
  fulfilled_at: string | null
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled'
  teacher_name: string
  responded_at: string | null
  response: string | null
}

export type ToiletLog = {
  id: number
  child_id: number
  activity_timestamp: string
  comments: string | null
  toilet_type: string | null
  recorded_by: string
}

export type AttendanceRecord = {
  id: number
  child_id: number
  check_in_time: string
  check_out_time: string | null
  status: boolean
  reason: string | null
  recorded_at: string
  recorded_by: string
}

export type NotificationItem = {
  id: number
  account_id: string
  notification_type: 'incident' | 'supply' | 'announcement' | 'attendance' | 'activity' | 'temperature_alert'
  sent_at: string
  seen_at: string | null
  handled_at: string | null
  seen: boolean
  handled: boolean
  description: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export type Teacher = {
  id: string
  account_id: string
  class_id: string
  class_name: string
}

export type RosterChild = {
  id: number
  name: string
  date_of_birth: string
  check_in_time: string | null
  check_out_time: string | null
  last_temp: number | null
  last_temp_at: string | null
  last_meal_type: string | null
  last_meal_portion: string | null
  last_meal_at: string | null
  last_toilet_at: string | null
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

export async function getIncidentsForChild(childId: string): Promise<IncidentReport[]> {
  const response = await fetch(`${getApiUrl()}/incidents/${childId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load incidents.')
  }

  return response.json()
}

export async function getMealsForChild(childId: string): Promise<MealLog[]> {
  const response = await fetch(`${getApiUrl()}/meals/${childId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load meals.')
  }

  return response.json()
}

export async function getSuppliesForParent(accountId: string): Promise<SupplyRequest[]> {
  const response = await fetch(`${getApiUrl()}/supplies/${accountId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load supply requests.')
  }

  return response.json()
}

export async function updateAccount(
  accountId: string,
  fields: { full_name?: string; email?: string; password?: string },
): Promise<Account> {
  const response = await fetch(`${getApiUrl()}/account/${accountId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not update account.')
  }

  // Re-fetch the account to get the updated data
  const updated = await fetch(`${getApiUrl()}/account/id/${accountId}`)
  if (!updated.ok) {
    throw new ApiError(updated.status, 'Account updated but could not reload.')
  }
  const rows = await updated.json()
  const row = Array.isArray(rows) ? rows[0] : rows
  return { id: row.id, full_name: row.full_name, email: row.email, role: row.role }
}

export async function getNotificationsForAccount(accountId: string): Promise<NotificationItem[]> {
  const response = await fetch(`${getApiUrl()}/notifications/${accountId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load notifications.')
  }

  return response.json()
}

export async function markNotificationSeen(id: number): Promise<NotificationItem> {
  const response = await fetch(`${getApiUrl()}/notifications/${id}/seen`, {
    method: 'PUT',
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not update notification.')
  }

  return response.json()
}

export async function getTeacherByAccount(accountId: string): Promise<Teacher | null> {
  const response = await fetch(`${getApiUrl()}/teacher/account/${accountId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load teacher profile.')
  }

  return response.json()
}

export async function getClassRoster(classId: string): Promise<RosterChild[]> {
  const response = await fetch(`${getApiUrl()}/class/${classId}/roster`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load class roster.')
  }

  return response.json()
}

export async function logMeal(fields: {
  accountId: string
  childId: number
  mealType: string
  foodPortion: string
  comments?: string
}): Promise<void> {
  const response = await fetch(`${getApiUrl()}/meals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: fields.accountId,
      child_id: fields.childId,
      meal_type: fields.mealType,
      food_portion: fields.foodPortion,
      comments: fields.comments || undefined,
    }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not log meal.')
  }
}

export async function logTemperature(fields: {
  accountId: string
  childId: number
  degreeCelsius: number
  comments?: string
}): Promise<void> {
  const response = await fetch(`${getApiUrl()}/temperature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: fields.accountId,
      child_id: fields.childId,
      degree_celsius: fields.degreeCelsius,
      comments: fields.comments || undefined,
    }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not log temperature.')
  }
}

export async function fileIncidentReport(fields: {
  childId: number
  teacherId: string
  description: string
  severityLevel: 'low' | 'medium' | 'high' | 'critical'
}): Promise<void> {
  const response = await fetch(`${getApiUrl()}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      child_id: fields.childId,
      teacher_id: fields.teacherId,
      description: fields.description,
      severity_level: fields.severityLevel,
    }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not file incident report.')
  }
}

export async function getToiletForChild(childId: string): Promise<ToiletLog[]> {
  const response = await fetch(`${getApiUrl()}/toilet/${childId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load toilet logs.')
  }

  return response.json()
}

export async function logToiletVisit(fields: {
  accountId: string
  childId: number
  toiletType: string
  comments?: string
}): Promise<void> {
  const response = await fetch(`${getApiUrl()}/toilet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: fields.accountId,
      child_id: fields.childId,
      toilet_type: fields.toiletType,
      comments: fields.comments || undefined,
    }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not log toilet visit.')
  }
}

export async function getAttendanceForChild(childId: string): Promise<AttendanceRecord[]> {
  const response = await fetch(`${getApiUrl()}/attendance/${childId}`)

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load attendance records.')
  }

  return response.json()
}

export async function checkInChild(childId: number, adminId: string): Promise<AttendanceRecord> {
  const response = await fetch(`${getApiUrl()}/attendance/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ child_id: childId, admin_id: adminId }),
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not check in child.')
  }

  return response.json()
}

export async function checkOutChild(recordId: number): Promise<AttendanceRecord> {
  const response = await fetch(`${getApiUrl()}/attendance/${recordId}/checkout`, {
    method: 'PUT',
  })

  if (!response.ok) {
    throw new ApiError(response.status, 'Could not check out child.')
  }

  return response.json()
}

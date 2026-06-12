export const GPS_POLL_INTERVAL = 30_000          // ms — how often to update geo position
export const GPS_STALE_THRESHOLD = 120_000        // ms — treat geo as stale after 2 min
export const ALERT_THRESHOLD_MIN = 5              // notify customer when ≤ 5 min away
export const MAX_QUEUE_SIZE = 50                  // hard cap per provider

export const GPS_STATE = {
  PRECISE: 'precise',
  COARSE: 'coarse',
  OFF: 'off',
}

export const QUEUE_STATUS = {
  WAITING: 'waiting',
  IN_SERVICE: 'in_service',
  DONE: 'done',
  CANCELLED: 'cancelled',
}

export const PLAN_TYPE = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
}

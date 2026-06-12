import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from './supabase.js'

export async function registerPushNotifications(customerToken) {
  if (!Capacitor.isNativePlatform()) return null

  const perm = await PushNotifications.requestPermissions()
  if (perm.receive !== 'granted') return null

  await PushNotifications.register()

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', async (token) => {
      if (customerToken) {
        await supabase.rpc('set_fcm_token', {
          p_customer_token: customerToken,
          p_fcm_token: token.value,
        })
      }
      resolve(token.value)
    })
    PushNotifications.addListener('registrationError', () => resolve(null))
  })
}

export function setupPushListeners(onNotification) {
  if (!Capacitor.isNativePlatform()) return

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onNotification?.(notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', () => {
    // App aus Hintergrund geöffnet via Notification
    window.location.href = '/'
  })
}

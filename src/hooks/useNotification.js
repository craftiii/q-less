import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useGeoStore } from '../store/geoStore.js'
import { travelTimeMin } from '../utils/distanceCalculator.js'
import { markAlertSent } from '../services/queueService.js'
import { GPS_STATE, ALERT_THRESHOLD_MIN } from '../config/constants.js'

async function fireNotification(waitTimeMin) {
  const title = 'Du bist gleich dran!'
  const body = `Nur noch ca. ${waitTimeMin} Minute${waitTimeMin !== 1 ? 'n' : ''}. Mach dich auf den Weg!`

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.requestPermissions()
    await LocalNotifications.schedule({
      notifications: [{ title, body, id: 1, sound: 'default' }],
    })
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  }
}

export function useNotification({ waitTimeMin, customerToken, alertSent, providerLat, providerLng, onAlert }) {
  const { gpsState, lat, lng } = useGeoStore()
  const fired = useRef(alertSent)

  useEffect(() => {
    if (fired.current) return
    if (waitTimeMin == null || waitTimeMin <= 0) return

    let shouldAlert = false

    if (gpsState === GPS_STATE.PRECISE && lat != null && providerLat != null) {
      const travel = travelTimeMin(lat, lng, providerLat, providerLng)
      shouldAlert = travel >= waitTimeMin - ALERT_THRESHOLD_MIN
    } else {
      shouldAlert = waitTimeMin <= ALERT_THRESHOLD_MIN
    }

    if (shouldAlert) {
      fired.current = true
      markAlertSent(customerToken).catch(console.error)
      fireNotification(waitTimeMin).catch(console.error)
      onAlert?.()
    }
  }, [waitTimeMin, gpsState, lat, lng])
}

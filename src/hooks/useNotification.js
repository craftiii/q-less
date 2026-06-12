import { useEffect, useRef } from 'react'
import { useGeoStore } from '../store/geoStore.js'
import { travelTimeMin } from '../utils/distanceCalculator.js'
import { markAlertSent } from '../services/queueService.js'
import { GPS_STATE, ALERT_THRESHOLD_MIN } from '../config/constants.js'

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

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Du bist gleich dran!', {
          body: `Nur noch ca. ${waitTimeMin} Minuten. Mach dich auf den Weg!`,
          icon: '/icons/icon-192.png',
        })
      }

      onAlert?.()
    }
  }, [waitTimeMin, gpsState, lat, lng])
}

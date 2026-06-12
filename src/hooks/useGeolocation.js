import { useEffect, useRef } from 'react'
import { useGeoStore } from '../store/geoStore.js'
import { GPS_POLL_INTERVAL } from '../config/constants.js'

export function useGeolocation(enabled = true) {
  const { setPosition, setCoarse, setOff } = useGeoStore()
  const watchId = useRef(null)

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      setOff()
      return
    }

    const options = { enableHighAccuracy: true, timeout: 10_000, maximumAge: GPS_POLL_INTERVAL }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setOff()
        else setCoarse()
      },
      options,
    )

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      setOff()
    }
  }, [enabled])
}

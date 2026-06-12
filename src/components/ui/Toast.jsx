import { useEffect, useState } from 'react'

export function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300) }, 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  )
}

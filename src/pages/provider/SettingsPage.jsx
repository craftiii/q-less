import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useProviderStore } from '../../store/providerStore.js'
import { updateProvider } from '../../services/providerService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { BottomNav } from '../../components/layout/BottomNav.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function SettingsPage() {
  const { provider, setProvider } = useProviderStore()
  const [name, setName] = useState(provider?.name ?? '')
  const [address, setAddress] = useState(provider?.address ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const checkInUrl = provider ? `${window.location.origin}/check-in/${provider.qr_token}` : ''

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const updated = await updateProvider(provider.id, { name, address })
    setProvider(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <AppShell>
      <Header title="Einstellungen" />
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={address} onChange={e => setAddress(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Spinner size="sm" /> : saved ? 'Gespeichert ✓' : 'Speichern'}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-gray-700 self-start">QR-Code — Einreihen</p>
          {checkInUrl && (
            <div id="qr-canvas">
              <QRCodeSVG value={checkInUrl} size={180} />
            </div>
          )}
          <p className="text-xs text-gray-400 font-mono break-all text-center">{checkInUrl}</p>
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary" className="flex-1 text-sm"
              onClick={() => navigator.clipboard.writeText(checkInUrl)}
            >
              Link kopieren
            </Button>
            <Button
              variant="secondary" className="flex-1 text-sm"
              onClick={() => {
                const svg = document.querySelector('#qr-canvas svg')
                if (!svg) return
                const size = 512
                const clone = svg.cloneNode(true)
                clone.setAttribute('width', size)
                clone.setAttribute('height', size)
                const svgStr = new XMLSerializer().serializeToString(clone)
                const blob = new Blob([svgStr], { type: 'image/svg+xml' })
                const canvas = document.createElement('canvas')
                canvas.width = size; canvas.height = size
                const ctx = canvas.getContext('2d')
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, size, size)
                const img = new Image()
                img.onload = () => {
                  ctx.drawImage(img, 0, 0, size, size)
                  const a = document.createElement('a')
                  a.href = canvas.toDataURL('image/png')
                  a.download = 'q-less-qr.png'
                  a.click()
                  URL.revokeObjectURL(img.src)
                }
                img.src = URL.createObjectURL(blob)
              }}
            >
              PNG herunterladen
            </Button>
          </div>
        </Card>

        <a href={checkInUrl} target="_blank" rel="noreferrer" className="block">
          <Button className="w-full">Check-in Seite öffnen</Button>
        </a>

      </div>
      <BottomNav />
    </AppShell>
  )
}

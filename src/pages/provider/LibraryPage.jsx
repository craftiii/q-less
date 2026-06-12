import { useEffect, useState } from 'react'
import { useProviderStore } from '../../store/providerStore.js'
import { getTemplates, createService, getServices } from '../../services/catalogService.js'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Header } from '../../components/layout/Header.jsx'
import { BottomNav } from '../../components/layout/BottomNav.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'

export default function LibraryPage() {
  const { provider } = useProviderStore()
  const [templates, setTemplates] = useState([])
  const [existing, setExisting] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)
  const [importing, setImporting] = useState({})

  useEffect(() => {
    if (!provider) return
    Promise.all([getTemplates(), getServices(provider.id)])
      .then(([tpls, svcs]) => {
        setTemplates(tpls)
        setExisting(svcs.map(s => s.name.toLowerCase()))
        const first = [...new Set(tpls.map(t => t.category))][0]
        setActiveCategory(first)
      })
      .finally(() => setLoading(false))
  }, [provider])

  const categories = [...new Set(templates.map(t => t.category))]
  const filtered = templates.filter(t => t.category === activeCategory)

  async function handleImport(tpl) {
    setImporting(p => ({ ...p, [tpl.id]: true }))
    await createService({ providerId: provider.id, name: tpl.name, durationMin: tpl.duration_min, bufferMin: 0 })
    setExisting(prev => [...prev, tpl.name.toLowerCase()])
    setImporting(p => ({ ...p, [tpl.id]: false }))
  }

  return (
    <AppShell>
      <Header title="Leistungs-Bibliothek" />
      <div className="flex-1 flex flex-col pb-24">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0 border-b border-gray-100">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-3">
                Leistung übernehmen — Dauer kannst du danach in deinem Katalog anpassen.
              </p>
              {filtered.map(tpl => {
                const already = existing.includes(tpl.name.toLowerCase())
                return (
                  <Card key={tpl.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{tpl.name}</p>
                        <p className="text-xs text-gray-400">{tpl.duration_min} Min.</p>
                      </div>
                      {already ? (
                        <Badge color="green">Vorhanden</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          className="shrink-0 text-xs py-1.5 px-3"
                          disabled={importing[tpl.id]}
                          onClick={() => handleImport(tpl)}
                        >
                          {importing[tpl.id] ? <Spinner size="sm" /> : '+ Übernehmen'}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </AppShell>
  )
}

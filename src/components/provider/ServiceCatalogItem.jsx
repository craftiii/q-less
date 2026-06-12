import { Button } from '../ui/Button.jsx'

export function ServiceCatalogItem({ service, onDelete }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div>
        <p className="font-medium text-sm">{service.name}</p>
        <p className="text-xs text-gray-400">{service.duration_min} Min. + {service.buffer_min} Min. Pause</p>
      </div>
      <Button variant="ghost" className="text-red-400 text-xs" onClick={() => onDelete(service.id)}>
        Entfernen
      </Button>
    </div>
  )
}

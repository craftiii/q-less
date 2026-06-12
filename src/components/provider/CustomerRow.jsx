import { Badge } from '../ui/Badge.jsx'
import { QUEUE_STATUS } from '../../config/constants.js'

const statusColor = {
  [QUEUE_STATUS.WAITING]:    'gray',
  [QUEUE_STATUS.IN_SERVICE]: 'green',
  [QUEUE_STATUS.DONE]:       'blue',
  [QUEUE_STATUS.CANCELLED]:  'red',
}

const statusLabel = {
  [QUEUE_STATUS.WAITING]:    'Wartet',
  [QUEUE_STATUS.IN_SERVICE]: 'Dran',
  [QUEUE_STATUS.DONE]:       'Fertig',
  [QUEUE_STATUS.CANCELLED]:  'Abgebrochen',
}

export function CustomerRow({ entry }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-gray-300 w-6 text-center">{entry.position}</span>
        <div>
          <p className="text-sm font-medium">{entry.services?.name}</p>
          <p className="text-xs text-gray-400">{entry.services?.duration_min} Min.</p>
        </div>
      </div>
      <Badge color={statusColor[entry.status]}>{statusLabel[entry.status]}</Badge>
    </div>
  )
}

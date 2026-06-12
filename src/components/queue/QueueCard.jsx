import { Card } from '../ui/Card.jsx'
import { WaitTimeBadge } from './WaitTimeBadge.jsx'
import { QueuePosition } from './QueuePosition.jsx'

export function QueueCard({ position, waitMin, serviceName }) {
  return (
    <Card className="text-center space-y-2">
      <QueuePosition position={position} />
      <p className="text-sm text-gray-500">{serviceName}</p>
      <div className="flex justify-center">
        <WaitTimeBadge minutes={waitMin} />
      </div>
    </Card>
  )
}

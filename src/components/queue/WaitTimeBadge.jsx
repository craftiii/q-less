import { Badge } from '../ui/Badge.jsx'

export function WaitTimeBadge({ minutes }) {
  const color = minutes <= 5 ? 'green' : minutes <= 15 ? 'yellow' : 'blue'
  return (
    <Badge color={color} className="text-sm px-3 py-1">
      ca. {minutes} Min. Wartezeit
    </Badge>
  )
}

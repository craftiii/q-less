import { useParams, Link } from 'react-router-dom'
import { AppShell } from '../../components/layout/AppShell.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'

export default function NotificationPage() {
  const { customerToken } = useParams()
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-6xl">🔔</div>
        <h1 className="text-2xl font-bold text-center">Du bist gleich dran!</h1>
        <Card className="w-full text-center">
          <p className="text-gray-600">Bitte begib dich jetzt zum Schalter.</p>
        </Card>
        <Link to={`/status/${customerToken}`}>
          <Button variant="secondary">Zurück zur Wartemarke</Button>
        </Link>
      </div>
    </AppShell>
  )
}

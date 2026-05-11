import { PageIntro } from '../components/game/PageIntro'

export function ProPage() {
  return (
    <PageIntro
      eyebrow="Pro"
      title="Upgrade to Focus Pro"
      description="This prototype route frames premium themes, deeper analytics, and advanced coaching as a future monetization layer. No real payment flow is implemented yet."
      highlights={[
        'Premium visual themes can become the first paid upgrade for power users.',
        'This page is prototype-only for now, so there is no checkout or billing flow.',
        'The monetization story stays aligned with focus, learning, and habit-building.',
      ]}
    />
  )
}

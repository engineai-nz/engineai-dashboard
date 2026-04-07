import HUD from '@/features/cockpit/HUD'
import CockpitShell from '@/components/CockpitShell'
import { DIVISIONS, DivisionSlug } from '@/lib/data'
import { notFound } from 'next/navigation'

export default async function DivisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const division = DIVISIONS.find((d) => d.slug === slug)
  if (!division) {
    notFound()
  }

  return (
    <CockpitShell>
      <HUD activeDivision={slug as DivisionSlug} />
    </CockpitShell>
  )
}

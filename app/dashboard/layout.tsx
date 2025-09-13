import { UrlTokenPersister } from '@/app/hooks/useUrlTokens'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <UrlTokenPersister />
      {children}
    </div>
  )
}
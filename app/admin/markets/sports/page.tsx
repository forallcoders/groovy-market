import { Suspense } from "react"
import AdminMarketsPage from "../components/market-page"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminMarketsPage type="sports" />
    </Suspense>
  )
}

import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const restrictedRoutes = ["/admin", "/test-markets"]

  const isRestricted = restrictedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isRestricted) {
    const session = await getToken({ req })

    if (!session || !session.walletAddress) {
      console.log(
        `🔴 Unauthorized Access - No Wallet Address Found for ${pathname}`
      )
      return NextResponse.redirect(new URL("/markets", req.url))
    }

    const allowedAddresses = (process.env.ADMIN_ADDRESSES || "")
      .split(",")
      .map((addr) => addr.trim().toLowerCase())

    console.log({ allowedAddresses })

    console.log(`🟢 Checking Access for ${pathname}:`, session.walletAddress)

    if (
      !allowedAddresses.includes(
        (session.walletAddress as string).toLowerCase()
      )
    ) {
      console.log(
        `🔴 Access Denied for Wallet (${pathname} Restriction): ${session.walletAddress}`
      )
      return NextResponse.redirect(new URL("/markets", req.url))
    }

    console.log(`✅ Access Granted to ${pathname}:`, session.walletAddress)
  }

  return NextResponse.next()
}

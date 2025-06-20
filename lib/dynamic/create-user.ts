import { eq } from "drizzle-orm"
import { db } from "../userDB/client"
import { lower, usersTable } from "../userDB/schema"
import { dynamicClient } from "./client"

interface DynamicUser {
  id: string
  projectEnvironmentId: string
  verifiedCredentials: unknown[]
  alias: string | null
  country: string | null
  email: string
  firstName: string | null
  jobTitle: string | null
  lastName: string | null
  phoneNumber: string | null
  policiesConsent: unknown | null
  tShirtSize: string | null
  team: string | null
  username: string
  firstVisit: string
  lastVisit: string
  metadata: Record<string, unknown>
  mfaBackupCodeAcknowledgement: unknown | null
  btcWallet: string | null
  kdaWallet: string | null
  ltcWallet: string | null
  ckbWallet: string | null
  kasWallet: string | null
  dogeWallet: string | null
  emailNotification: boolean | null
  discordNotification: boolean | null
  newsletterNotification: boolean | null
  walletPublicKey: string
  wallet: string
  chain: string
  createdAt: string
  updatedAt: string
  sessions: unknown[]
  wallets: unknown[]
  chainalysisChecks: unknown[]
  oauthAccounts: unknown[]
  mfaDevices: unknown[]
}

export async function createUser(userId: string, referral: string | undefined) {
  const {
    data: { user },
  } = await dynamicClient.get<{ user: DynamicUser }>(
    `/environments/${process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID}/users/${userId}`
  )
  console.log("data", user)
  const referrerId = referral
    ? await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(lower(usersTable.referralCode), referral.toLowerCase()))
        .then((res) => res[0]?.id)
        .catch(() => null)
    : null
  // create a random referral code
  const referralCode =
    Math.random().toString(36).substring(2, 8) +
    Math.floor(Math.random() * 10000)
  await db.insert(usersTable).values({
    evmAddress: user.walletPublicKey,
    dynamicId: user.id,
    email: user.email,
    avatar: user.metadata?.avatar as string,
    bio: user.metadata?.bio as string,
    username: user.username,
    referrerId: referrerId,
    referralCode: referralCode,
  })

  return user
}

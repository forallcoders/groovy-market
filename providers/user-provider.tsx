"use client"

import { User } from "@/lib/userDB/schema"
import {
  getAuthToken,
  useDynamicContext,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core"
import axios from "axios"
import { Loader2 } from "lucide-react"
import {
  signIn,
  signOut,
  useSession as useNextAuthSession,
} from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"

interface UserContextProps {
  user: (User & { avatar: string | null; bio: string | null }) | null
  handleCloseModal: () => void
  logout: () => void
  isConnected: boolean
  isLoading: boolean
  error: string
  proxyAddress: string | null
  setUser: Dispatch<SetStateAction<User | null>>
  setProxyAddress: Dispatch<SetStateAction<string | null>>
}

const UserContext = createContext<UserContextProps>({
  user: null,
  error: "",
  isConnected: false,
  handleCloseModal: () => {},
  logout: async () => {},
  setProxyAddress: () => {},
  isLoading: false,
  proxyAddress: null,
  setUser: () => {},
})

interface UserResponse {
  user: User
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const {
    user: dynamicUser,
    handleLogOut,
    setShowAuthFlow,
  } = useDynamicContext()
  const isLoggedIn = useIsLoggedIn()
  const { status } = useNextAuthSession()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [proxyAddress, setProxyAddress] = useState<string | null>(null)
  const [error, setError] = useState<string>("")
  const pathname = usePathname()
  const router = useRouter()

  const updateLoginStatus = async () => {
    try {
      setIsLoading(true)
      setError("")

      if (status === "authenticated") {
        const { data } = await axios.get<UserResponse>("/api/session")
        const metadata = dynamicUser?.metadata as Record<string, string>
        setUser({
          ...data.user,
          email: dynamicUser?.email || metadata.email || null,
          username: dynamicUser?.username ?? null,
          bio: metadata.bio,
          avatar: metadata.avatar,
        })
        if (data.user.proxyWallet) {
          setProxyAddress(data.user.proxyWallet)
        }
        if (pathname === "/") {
          router.push("/markets")
        }
      } else {
        setUser(null)
      }
    } catch (e: any) {
      console.log("login status error", e)
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = async () => {
    updateLoginStatus()
  }

  const logout = async () => {
    signOut()
    handleLogOut()
    router.push("/")
  }

  useEffect(() => {
    if (status === "authenticated" && isLoggedIn) {
      updateLoginStatus()
    }
    if (status === "authenticated" && !isLoggedIn) {
      setShowAuthFlow(true)
    }
    if (status === "unauthenticated" && isLoggedIn) {
      const authToken = getAuthToken()
      signIn("credentials", {
        token: authToken,
        redirect: false,
      })
    }
  }, [status, isLoggedIn])

  return (
    <UserContext.Provider
      value={{
        user,
        error,
        handleCloseModal,
        isLoading,
        logout,
        proxyAddress,
        setUser,
        setProxyAddress,
        isConnected: status === "authenticated",
      }}
    >
      {isLoading && (
        <div className="fixed top-0 w-screen h-screen left-0 inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Loader2 className="animate-spin size-32" />
        </div>
      )}
      {children}
    </UserContext.Provider>
  )
}

export const useUserContext = () => {
  return useContext(UserContext)
}

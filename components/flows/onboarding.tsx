"use client"

import { useTokensState } from "@/hooks/use-tokens-state"
import { useUserContext } from "@/providers/user-provider"
import { useOnboardingModal } from "@/stores/onboarding"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

const Onboarding = () => {
  const { isConnected, user } = useUserContext()
  const { balance } = useTokensState({})
  const pathname = usePathname()
  const { CurrentModal, send, canClose, canSkip, handleSkip } =
    useOnboardingModal()

  useEffect(() => {
    if (
      isConnected &&
      user &&
      balance !== undefined &&
      typeof window !== "undefined"
    ) {
      send({ type: "UPDATE_USER", user })
      send({ type: "UPDATE_BALANCE", balance })
      if (Boolean(window.localStorage.getItem("groovy-onboarding-shown")))
        return

      send({ type: "START" })
      window.localStorage.setItem("groovy-onboarding-shown", "true")
    }
  }, [isConnected, user, balance, send, pathname])

  // Add keyboard event listener to prevent Escape key when blocking is enabled
  useEffect(() => {
    if (!canClose()) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      document.addEventListener("keydown", handleKeyDown, true)
      return () => document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [canClose])

  if (!CurrentModal) {
    return null
  }

  return (
    <CurrentModal
      preventClose={!canClose()}
      onSkip={canSkip() ? handleSkip : () => {}}
    />
  )
}

export default Onboarding

import { User } from "@/lib/userDB/schema"
import dynamic from "next/dynamic"
import { useCallback, useMemo } from "react"
import { create } from "zustand"

const TermsAndConditionsModal = dynamic(
  () => import("@/components/modals/terms-and-conditions-modal"),
  {
    ssr: false,
  }
)
const SourceModal = dynamic(() => import("@/components/modals/source-modal"), {
  ssr: false,
})

const TransferCryptoModal = dynamic(
  () => import("@/components/modals/transfer-crypto-modal"),
  {
    ssr: false,
  }
)
const KADOModal = dynamic(() => import("@/components/modals/kado-modal"), {
  ssr: false,
})
const EmailCaptureModal = dynamic(
  () => import("@/components/modals/email-capture-modal"),
  {
    ssr: false,
  }
)

const XSharingModal = dynamic(
  () => import("@/components/modals/x-sharing-modal"),
  {
    ssr: false,
  }
)

const AccountValidationModal = dynamic(
  () => import("@/components/modals/account-validation-modal"),
  {
    ssr: false,
  }
)

// Define all possible states
export type OnboardingState =
  | "INITIAL"
  | "ACCOUNT_VALIDATION"
  | "DEPOSIT_TERMS"
  | "TERMS_CONDITIONS"
  | "DEPOSIT_SOURCE"
  | "TRANSFER_CRYPTO"
  | "KADO"
  | "EMAIL_CAPTURE"
  | "X_SHARE"
  | "COMPLETE"
  | "ANY"

// Define all possible events
export type OnboardingEvent =
  | { type: "START" }
  | { type: "VALIDATE_ACCOUNT" }
  | { type: "ACCEPT_TERMS" }
  | { type: "SELECT_DEPOSIT_SOURCE"; source: "crypto" | "card" }
  | { type: "COMPLETE_DEPOSIT" }
  | { type: "CONFIRMATION" }
  | { type: "SUBMIT_EMAIL" }
  | { type: "SET_USERNAME" }
  | { type: "SHARE_X" }
  | { type: "SKIP" }
  | { type: "BACK" }
  | { type: "UPDATE_USER"; user: User }
  | { type: "UPDATE_BALANCE"; balance: number }
  | { type: "TERMS_CONDITIONS" }

export interface ModalProps {
  preventClose?: boolean // To handle blocking behavior
  onSkip?: () => void // To handle skip functionality
}

interface OnboardingMachineState {
  currentState: OnboardingState
  user: User | null
  depositAmount: number
  hasAcceptedTerms: boolean
  depositSource: "crypto" | "card" | null
}

interface OnboardingMachineStore extends OnboardingMachineState {
  send: (event: OnboardingEvent) => void
  reset: () => void
  canClose: () => boolean
  canSkip: () => boolean
  openModal: () => void
  closeModal: () => void
}

// Define which states can be skipped
const SKIPPABLE_STATES: OnboardingState[] = [
  "TRANSFER_CRYPTO",
  "KADO",
  "DEPOSIT_TERMS",
]

const getPreviousState = (
  currentState: OnboardingState,
  context: OnboardingMachineState
): OnboardingState => {
  switch (currentState) {
    case "DEPOSIT_TERMS":
      return "ACCOUNT_VALIDATION"
    case "DEPOSIT_SOURCE":
      return "DEPOSIT_TERMS"
    case "TERMS_CONDITIONS":
      return "DEPOSIT_TERMS"
    case "TRANSFER_CRYPTO":
    case "KADO":
      return "DEPOSIT_SOURCE"
    case "EMAIL_CAPTURE":
      return "DEPOSIT_TERMS"
    case "X_SHARE":
      return !context.user?.email ? "EMAIL_CAPTURE" : "DEPOSIT_SOURCE"
    default:
      return currentState
  }
}

const getNextState = (
  currentState: OnboardingState,
  event: OnboardingEvent,
  context: OnboardingMachineState
): OnboardingState => {
  if (event.type === "BACK") {
    return getPreviousState(currentState, context)
  }

  switch (currentState) {
    case "INITIAL":
      if (event.type === "START") {
        if (!context.user?.proxyWallet) {
          return "ACCOUNT_VALIDATION"
        }
        if (context.user.hasAcceptedTerms) {
          return "DEPOSIT_SOURCE"
        }
        return "DEPOSIT_TERMS"
      }
      break

    case "ACCOUNT_VALIDATION":
      if (event.type === "VALIDATE_ACCOUNT") {
        return "DEPOSIT_TERMS"
      }
      break

    case "DEPOSIT_TERMS":
      if (event.type === "TERMS_CONDITIONS") {
        return "TERMS_CONDITIONS"
      }
      if (event.type === "ACCEPT_TERMS") {
        return "DEPOSIT_SOURCE"
      }
      if (event.type === "SHARE_X") {
        return "X_SHARE"
      }
      if (event.type === "SUBMIT_EMAIL" || event.type === "SKIP") {
        return "EMAIL_CAPTURE"
      }
      break
    case "TERMS_CONDITIONS":
    case "ANY":
      return "DEPOSIT_TERMS"

    case "DEPOSIT_SOURCE":
      if (event.type === "SELECT_DEPOSIT_SOURCE") {
        return event.source === "crypto" ? "TRANSFER_CRYPTO" : "KADO"
      }
      break

    case "TRANSFER_CRYPTO":
    case "KADO":
      if (event.type === "COMPLETE_DEPOSIT" || event.type === "SKIP") {
        return context.user?.email ? "X_SHARE" : "EMAIL_CAPTURE"
      }
      break

    case "EMAIL_CAPTURE":
      if (event.type === "SUBMIT_EMAIL") {
        return "X_SHARE"
      }
      if (event.type === "SHARE_X") {
        return "X_SHARE"
      }
      break

    case "X_SHARE":
      if (event.type === "SHARE_X") {
        return "COMPLETE"
      }
      break
  }

  return currentState
}

export const useOnboardingMachine = create<OnboardingMachineStore>(
  (set, get) => {
    return {
      currentState: "INITIAL",
      user: null,
      depositAmount: 0,
      hasAcceptedTerms: false,
      depositSource: null,
      openModal: () => set({ currentState: "INITIAL" }),
      closeModal: () => {
        set({ currentState: "INITIAL" })
      },
      send: (event) =>
        set((state) => {
          const nextState = getNextState(state.currentState, event, state)
          // Update additional state based on events
          const updates: Partial<OnboardingMachineState> = {}

          if (event.type === "ACCEPT_TERMS") {
            updates.hasAcceptedTerms = true
          } else if (event.type === "SELECT_DEPOSIT_SOURCE") {
            updates.depositSource = event.source
          } else if (event.type === "UPDATE_USER") {
            updates.user = event.user
          } else if (event.type === "UPDATE_BALANCE") {
            updates.depositAmount = event.balance
          }

          return {
            ...state,
            ...updates,
            currentState: nextState,
          }
        }),

      reset: () =>
        set({
          currentState: "INITIAL",
          user: null,
          depositAmount: 0,
          hasAcceptedTerms: false,
          depositSource: null,
        }),

      canClose: () => {
        const isBlocked = process.env.NEXT_PUBLIC_BLOCK_ONBOARDING === "true"
        // const currentState = get().currentState;

        // If blocking is enabled and the current state is required, prevent closing
        if (isBlocked) {
          return false
        }

        return true
      },

      canSkip: () => {
        const currentState = get().currentState
        return SKIPPABLE_STATES.includes(currentState)
      },
    }
  }
)

// Hook to get the current modal component based on state
export const useOnboardingModal = () => {
  const { currentState, send, canClose, canSkip } = useOnboardingMachine()

  const handleSkip = () => {
    if (canSkip()) {
      send({ type: "SKIP" })
    }
  }

  const handleBack = useCallback(() => {
    send({ type: "BACK" })
  }, [send])

  const CurrentModal = useMemo(() => {
    switch (currentState) {
      case "ACCOUNT_VALIDATION":
        return AccountValidationModal
      case "DEPOSIT_TERMS":
      case "TERMS_CONDITIONS":
        return TermsAndConditionsModal
      case "DEPOSIT_SOURCE":
        return SourceModal
      case "TRANSFER_CRYPTO":
        return TransferCryptoModal
      case "KADO":
        return KADOModal
      case "EMAIL_CAPTURE":
        return EmailCaptureModal
      case "X_SHARE":
        return XSharingModal

      default:
        return null
    }
  }, [currentState])

  return {
    CurrentModal,
    send,
    currentState,
    canClose,
    canSkip,
    handleSkip,
    handleBack,
  }
}

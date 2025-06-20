import { useCallback } from "react"
import { useOnboardingMachine } from "@/stores/onboarding"
import { ActionButton } from "../ui/action-button"
import { Button } from "../ui/button"
import ResponsiveModal from "./responsive-modal"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  previousStep?: () => void
  children: React.ReactNode
  contentClassName?: string
  showTrigger?: boolean
  displayCloseButton?: boolean
  preventClose?: boolean
  onSkip?: () => void
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  previousStep,
  children,
  onSkip,
  open,
  onOpenChange,
  ...rest
}) => {
  const { closeModal } = useOnboardingMachine()

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (rest.preventClose && !newOpen) {
        return
      }
      if (!newOpen) {
        closeModal()
      }
      onOpenChange(newOpen)
    },
    [rest.preventClose, closeModal, onOpenChange]
  )

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange} {...rest}>
      {previousStep && (
        <ActionButton
          src="/icons/back.svg"
          alt="back"
          onClick={previousStep}
          className="top-3 left-3"
        />
      )}
      {children}
      {onSkip && (
        <Button
          variant="link"
          size="icon"
          className="flex ml-auto mr-4 text-white hover:no-underline"
          onClick={onSkip}
        >
          <p>Skip</p>
        </Button>
      )}
    </ResponsiveModal>
  )
}

export default OnboardingModal

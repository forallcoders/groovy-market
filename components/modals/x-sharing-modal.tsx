"use client"

import {
  ModalProps,
  useOnboardingMachine,
  useOnboardingModal,
} from "@/stores/onboarding"
import Image from "next/image"
import { Button } from "../ui/button"
import OnboardingModal from "./onboarding-modal"

export function XSharingModal({ preventClose }: ModalProps) {
  const { handleBack } = useOnboardingModal()
  const { send, currentState } = useOnboardingMachine()

  const handleShare = () => {
    window.open("https://x.com/GroovyMarket_", "_blank", "noopener,noreferrer")

    // Mark localStorage so next time we know it's done
    window.localStorage.setItem("shared-x", "true")

    // Then move on to the next step
    send({ type: "SHARE_X" })
  }

  return (
    <OnboardingModal
      open={currentState === "DEPOSIT_SOURCE"}
      onOpenChange={() => {}}
      previousStep={handleBack}
      preventClose={preventClose}
      contentClassName="max-w-[800px] md:w-[90vw] md:!rounded-3xl p-0 max-h-full overflow-y-auto"
    >
      <div className="relative z-10 py-5 text-center flex flex-col gap-[30px] items-center">
        <Image
          src={"/icons/x-twitter.svg"}
          alt={"Enable trading icon"}
          width={80}
          height={80}
          className="mx-auto"
          sizes="(max-width: 768px) 80px, (max-width: 1024px) 80px"
        />
        <h2 className="text-2xl text-center text-white font-medium">
          All done, spread the word
        </h2>
        <Button
          onClick={handleShare}
          className="py-5 text-sm bg-[#CC0066] hover:bg-[#CC0066]/80 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
        >
          Visit page
        </Button>
      </div>
    </OnboardingModal>
  )
}

export default XSharingModal

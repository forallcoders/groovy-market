import Image from "next/image"
import { ModalProps, useOnboardingMachine } from "@/stores/onboarding"
import { useState } from "react"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import OnboardingModal from "./onboarding-modal"
import { useUserContext } from "@/providers/user-provider"

function TermsAndConditionsModal({ preventClose, onSkip }: ModalProps) {
  const { send, user, currentState } = useOnboardingMachine()
  const { setUser } = useUserContext()
  const [accepted, setAccepted] = useState(false)

  const handleDepositClick = async () => {
    if (accepted && user?.id) {
      try {
        const response = await fetch("/api/user/accept-terms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })
        const data = await response.json()
        if (!data.success) {
          throw new Error("Failed to update terms acceptance")
        }
        setUser({ ...user, hasAcceptedTerms: true })
        send({ type: "ACCEPT_TERMS" })
      } catch (error) {
        console.error("Failed to update terms acceptance:", error)
      }
    }
  }

  return (
    <>
      <OnboardingModal
        open={currentState === "DEPOSIT_TERMS"}
        onOpenChange={() => {}}
        contentClassName="max-w-[800px] md:w-[90vw] md:!rounded-3xl p-0 max-h-full overflow-y-auto"
        displayCloseButton={Boolean(user?.email && user?.username)}
        preventClose={!Boolean(user?.email && user?.username) && preventClose}
      >
        <div className="max-h-[90dvh] overflow-y-auto flex flex-col relative pt-10 pb-10 z-10">
          <div className="flex flex-col gap-[30px] justify-center">
            <Image
              src={"/icons/deposit-dollar.svg"}
              alt={"Enable trading icon"}
              width={80}
              height={80}
              className="mx-auto"
              sizes="(max-width: 768px) 80px, (max-width: 1024px) 80px"
            />
            <h2 className="text-2xl text-center text-white font-medium">
              Fund your account
            </h2>
            <div className="flex justify-center gap-2 items-start p-4 border border-[#494B4E] rounded-[10px] max-w-[360px] mx-auto">
              <Checkbox
                id="terms"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
                className="border-[1.5] mt-0.5 rounded-[2px] w-[18px] h-[18px] data-[state=checked]:bg-transparent border-white"
              />
              <label htmlFor="terms" className="text-white text-xs">
                By trading, you agree to the{" "}
                <button
                  onClick={() => send({ type: "TERMS_CONDITIONS" })}
                  className="underline hover:text-[#CC0066]/80"
                >
                  Terms of Use
                </button>
                <span className="text-white">
                  {" "}
                  and attest you are not a US person, are not located in the US
                  and are not the resident of or located in a restrictred
                  jurisdiction.{" "}
                </span>
              </label>
            </div>
            <div className="flex flex-col gap-2 items-center justify-center">
              <Button
                onClick={handleDepositClick}
                className="py-5 text-sm bg-[#CC0066] hover:bg-[#CC0066]/80 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
                disabled={!accepted}
              >
                Deposit funds
              </Button>
              {Boolean(user?.email && user?.username) && (
                <Button
                  onClick={onSkip}
                  className="text-xs py-5 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
                >
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        </div>
      </OnboardingModal>

      <OnboardingModal
        open={currentState === "TERMS_CONDITIONS"}
        onOpenChange={() => {}}
        contentClassName="max-w-[800px] border-white border-8 !rounded-3xl p-5 max-h-full"
        displayCloseButton={false}
      >
        <div className="space-y-4 relative z-10 h-full">
          <div className="flex flex-col items-center gap-4 p-4">
            <h2 className="text-2xl text-white font-bold text-center">
              Terms & Conditions
            </h2>
            <div className="p-4 border border-[#494B4E] rounded-[10px] overflow-y-auto mx-auto max-h-[380px] text-white text-xs">
              <h4 className="text-base font-medium mb-3">General Terms</h4>
              <p className="mb-4">
                By accessing and placing an order with Termify, you confirm that
                you are in agreement with and bound by the terms of service
                outlined below. These terms apply to the entire website and any
                email or other type of communication between you and Termify.
              </p>
              <p className="mb-4">
                Under no circumstances shall Termify team be liable for any
                direct, indirect, special, incidental or consequential damages,
                including, but not limited to, loss of data or profit, arising
                out of the use, or the inability to use, the materials on this
                site, even if Termify team or an authorized representative has
                been advised of the possibility of such damages. If your use of
                materials from this site results in the need for servicing,
                repair or correction of equipment or data, you assume any costs
                thereof.
              </p>
              <p className="mb-4">
                Termify will not be responsible for any outcome that may occur
                during the course of usage of our resources. We reserve the
                rights to change prices and revise the resources usage policy in
                any moment.
              </p>
              <h4 className="text-base font-medium mt-[30px] mb-3">License</h4>
              <p>
                Termify grants you a revocable, non-exclusive, non-transferable,
                limited license to download, install and use the website
                strictly in accordance with the terms of this Agreement.
              </p>
            </div>
            <Button
              onClick={() => send({ type: "BACK" })}
              className="py-5 text-sm bg-[#CC0066] hover:bg-[#CC0066]/80 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
            >
              Got it
            </Button>
          </div>
        </div>
      </OnboardingModal>
    </>
  )
}

export default TermsAndConditionsModal

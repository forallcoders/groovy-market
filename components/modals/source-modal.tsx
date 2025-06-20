import { cn } from "@/lib/utils"
import {
  ModalProps,
  useOnboardingMachine,
  useOnboardingModal,
} from "@/stores/onboarding"
import Image from "next/image"

import OnboardingModal from "./onboarding-modal"
interface SourceData {
  title: string
  description: string
  icon: {
    src: string
    alt: string
    width: number
    height: number
  }
  descriptionClass: string
  imageClassName?: string
  option: "crypto" | "card"
  available?: boolean
}

function SourceModal({ preventClose }: ModalProps) {
  const { send, currentState, user } = useOnboardingMachine()
  const { handleBack } = useOnboardingModal()

  const sourceData: SourceData[] = [
    {
      title: "Transfer crypto",
      description: "Instant / No limit",
      icon: {
        src: "/icons/transfercrypto.svg",
        alt: "Transfer crypto",
        width: 50,
        height: 50,
      },
      descriptionClass: "mt-2",
      option: "crypto",
      available: process.env.NEXT_PUBLIC_WORK_ENVIRONMENT === "production",
    },
    {
      title: "Card Payments",
      description: "2 minutes, $10,000 limit",
      icon: {
        src: "/icons/cardpayments.svg",
        alt: "Card Payments",
        width: 110,
        height: 110,
      },
      descriptionClass: "mt-2",
      imageClassName: "max-sm:w-[80px]",
      option: "card",
      available: process.env.NEXT_PUBLIC_WORK_ENVIRONMENT === "production",
    },
  ]

  // if (process.env.NEXT_PUBLIC_WORK_ENVIRONMENT !== "production") {
  //   sourceData.push({
  //     title: "Faucet",
  //     description: "2 minutes, $10,000 limit",
  //     icon: {
  //       src: "/icons/cardpayments.svg",
  //       alt: "Faucet",
  //       width: 110,
  //       height: 110,
  //     },
  //     descriptionClass: "mt-2",
  //     imageClassName: "max-sm:w-[80px]",
  //     option: "faucet",
  //     available: true,
  //   })
  // }

  const handleSourceSelect = async (source: "crypto" | "card") => {
    send({ type: "SELECT_DEPOSIT_SOURCE", source })
  }

  return (
    <OnboardingModal
      open={currentState === "DEPOSIT_SOURCE"}
      onOpenChange={() => {}}
      contentClassName="max-w-[800px] md:w-[90vw] md:!rounded-3xl p-0 max-h-full overflow-y-auto"
      previousStep={user?.hasAcceptedTerms ? undefined : handleBack}
      preventClose={preventClose}
    >
      <div className="max-h-[80dvh] overflow-y-auto flex flex-col relative py-10 z-10 gap-[30px]">
        <Image
          src={"/icons/deposit-dollar.svg"}
          alt={"Enable trading icon"}
          width={80}
          height={80}
          className="mx-auto"
          sizes="(max-width: 768px) 80px, (max-width: 1024px) 80px"
        />
        <h2 className="text-2xl text-center text-white font-medium">
          Funding Source
        </h2>
        <div className="px-5 pt-1 mt-1">
          <div className="space-y-6 max-sm:space-y-3">
            {sourceData.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSourceSelect(item.option)}
                className={cn(
                  "w-full flex items-center justify-between p-4 bg-[#353739] rounded-[10px] hover:bg-[#353739]/80 transition-colors",
                  "disabled:opacity-50"
                )}
                disabled={!item.available}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="font-medium text-white text-left text-sm">
                      {item.title}
                    </h3>
                    <p
                      className={`text-sm text-[#A4A4AE] ${item.descriptionClass}`}
                    >
                      {item.description}
                    </p>
                  </div>
                  <Image
                    src={item.icon.src}
                    alt={item.icon.alt}
                    width={item.icon.width}
                    height={item.icon.height}
                    className={item.imageClassName}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingModal>
  )
}

export default SourceModal

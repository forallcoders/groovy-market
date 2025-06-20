import { toast } from "@/hooks/use-toast"
import {
  ModalProps,
  useOnboardingMachine,
  useOnboardingModal,
} from "@/stores/onboarding"
import { Copy, LogOut } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import OnboardingModal from "./onboarding-modal"
import { useUserContext } from "@/providers/user-provider"

interface BridgeProvider {
  name: string
  url: string
  logo: string
}
function TransferCryptoModal({ preventClose }: ModalProps) {
  const { handleBack, handleSkip } = useOnboardingModal()
  const { currentState } = useOnboardingMachine()
  const { proxyAddress } = useUserContext()

  const handleCopy = () => {
    navigator.clipboard.writeText(proxyAddress!)
    toast({
      title: "Address copied to clipboard",
      description: "You can now paste it anywhere",
    })
  }

  const bridgeProviders: BridgeProvider[] = [
    {
      name: "Symbiosis",
      url: "https://app.symbiosis.finance/swap",
      logo: "/icons/symbiosis.svg",
    },
    {
      name: "Skip",
      url: "https://go.skip.build/",
      logo: "/icons/skip.svg",
    },
    {
      name: "Squid",
      url: "https://app.squidrouter.com/",
      logo: "/icons/squid.svg",
    },
    {
      name: "Jumper",
      url: "https://jumper.exchange/",
      logo: "/icons/jumper.svg",
    },
  ]

  return (
    <OnboardingModal
      open={currentState === "TRANSFER_CRYPTO"}
      onOpenChange={() => {}}
      contentClassName="max-w-[800px] md:w-[90vw] md:!rounded-3xl p-0 max-h-[90dvh] md:max-h-[80dvh]"
      previousStep={handleBack}
      preventClose={preventClose}
    >
      <div className="relative z-10 text-center max-h-[90dvh] md:max-h-[75dvh] h-full overflow-y-auto mb-[30px]">
        <div className="flex justify-center flex-col items-center gap-[30px] max-w-[380px] mx-auto">
          <Image
            src={"/icons/deposit-dollar.svg"}
            alt={"Enable trading icon"}
            width={80}
            height={80}
            className="mx-auto"
            sizes="(max-width: 768px) 80px, (max-width: 1024px) 80px"
          />
          <h2 className="text-2xl text-center text-white font-medium">
            Transfer Crypto
          </h2>
          <div className="space-y-4 max-sm:space-y-2">
            <div className="flex flex-col justify-center gap-1 items-start p-2 border border-[#494B4E] rounded-[10px] mx-auto">
              <p className="text-white text-left text-xs">
                Your deposit address:
              </p>
              <div className="flex items-center justify-between gap-2 w-full">
                <p className="text-xs text-white font-semibold">
                  {proxyAddress}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-[#4E5458] hover:bg-[#4E5458] h-8 max-sm:h-6"
                  onClick={handleCopy}
                >
                  <span className="sr-only">Copy address</span>
                  <Copy className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl text-center text-white font-medium">
              Bridge Providers
            </h2>

            <div className="space-y-4 mt-5">
              <div className="space-y-3">
                {bridgeProviders.map((provider) => (
                  <Link
                    key={provider.name}
                    href={provider.url}
                    target="_blank"
                    onClick={() => handleSkip()}
                    className="flex items-center justify-between p-4 bg-[#353739] rounded-[10px] hover:bg-[#353739]/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={provider.logo || "/placeholder.svg"}
                        alt={provider.name}
                        width={40}
                        height={40}
                        className="rounded-md"
                      />
                      <div>
                        <h3 className="font-medium text-white text-left">
                          {provider.name}
                        </h3>
                        <p className="text-sm text-white/80 text-left truncate max-sm:max-w-[150px]">
                          {provider.url}
                        </p>
                      </div>
                    </div>
                    <LogOut className="h-6 w-6 text-[#CC0066]" />
                  </Link>
                ))}
              </div>

              <p className="text-white text-center text-xs">
                <span className="font-semibold">Disclaimer:</span>
                {" USDC on SEI - contract (losing money if it's different)"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingModal>
  )
}

export default TransferCryptoModal

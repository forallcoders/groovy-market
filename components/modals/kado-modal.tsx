import { ModalProps, useOnboardingMachine } from "@/stores/onboarding"
import { Loader2 } from "lucide-react"
import { useReadContract } from "wagmi"
import OnboardingModal from "./onboarding-modal"
import { useUserContext } from "@/providers/user-provider"
import { precompileContract } from "@/contracts/data/precompile"

function KadoModal({}: ModalProps) {
  const { proxyAddress } = useUserContext()
  const { currentState } = useOnboardingMachine()

  const { data, isLoading } = useReadContract({
    address: precompileContract.address,
    abi: precompileContract.abi,
    functionName: "getSeiAddr",
    args: [proxyAddress],
  })

  console.log({ data })

  // const { associateGasless, success } = useSeiAssociate();

  const isNotAssociated = !isLoading && !data

  // useEffect(() => {
  //   if (isNotAssociated && isConnected) {
  //     associateGasless();
  //   }
  // }, [isNotAssociated, isConnected]);

  if (isNotAssociated) {
    return (
      <div className="fixed top-0 w-screen h-screen left-0 inset-0 bg-black/50 z-50 flex items-center justify-center">
        <Loader2 className="animate-spin size-32" />
      </div>
    )
  }

  return (
    <OnboardingModal
      open={currentState === "KADO"}
      onOpenChange={() => {}}
      contentClassName=" max-h-full overflow-y-auto"
    >
      <div className="h-[80dvh] relative z-50 pt-5">
        <iframe
          src={`https://app.kado.money/?apiKey=291e1446-0fe3-4960-8107-2679eefe1992&onRevCurrency=USDC&network=SEI&onToAddress=${proxyAddress}&primaryColor=240,107,45&theme=light`}
          width="480"
          height="620"
          style={{ border: "0px" }}
          allow="clipboard-write; payment; accelerometer; gyroscope; camera; geolocation; autoplay; fullscreen;"
          className="z-50 w-full light h-full"
        />
      </div>
    </OnboardingModal>
  )
}

export default KadoModal

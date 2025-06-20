"use client"

import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { useUserContext } from "@/providers/user-provider"
import { ModalProps, useOnboardingMachine } from "@/stores/onboarding"
import axios from "axios"
import { useState } from "react"
import { Button } from "../ui/button"
import OnboardingModal from "./onboarding-modal"
import Image from "next/image"
import { useTokensState } from "@/hooks/use-tokens-state"

function AccountValidationModal({}: ModalProps) {
  const [loading, setLoading] = useState(false)
  const { send, currentState } = useOnboardingMachine()
  const { createWallet, executeTransaction } = useGaslessTransactions()
  const { user, setProxyAddress, setUser } = useUserContext()
  const { refetchBalance } = useTokensState({})
  const isProduction = process.env.NEXT_PUBLIC_WORK_ENVIRONMENT === "production"

  const setupProxyWallet = async () => {
    setLoading(true)
    try {
      if (user?.evmAddress) {
        const newWalletAddress = await createWallet()
        if (newWalletAddress) {
          await axios.post("/api/user/update-wallet", {
            proxyWallet: newWalletAddress,
          })
          setProxyAddress(newWalletAddress)
          setUser((prev) => {
            if (!prev) return null
            return {
              ...prev,
              proxyWallet: newWalletAddress,
            }
          })
          if (!isProduction) {
            const mintProxyResponse = await fetch("/api/user/mint-tokens", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ proxyWallet: newWalletAddress }),
            })

            if (!mintProxyResponse.ok)
              throw new Error("Failed to fetch mint transaction")

            const { request } = await mintProxyResponse.json()

            const mintProxyResult = await executeTransaction({
              targetContract: request.targetContract,
              amount: request.amount,
              data: request.data,
              newProxyAddress: newWalletAddress,
            })

            if (!mintProxyResult.success) {
              throw new Error("Failed to mint tokens on chain")
            }
            refetchBalance()
          }
          send({
            type: "UPDATE_USER",
            user: { ...user, proxyWallet: newWalletAddress },
          })
        }
      }
      send({ type: "VALIDATE_ACCOUNT" })
    } catch (error) {
      console.error("Error setting up proxy wallet:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingModal
      open={currentState === "ACCOUNT_VALIDATION"}
      onOpenChange={() => {}}
      preventClose={loading}
      contentClassName="max-w-[800px] md:w-[90vw] p-0 max-h-full overflow-y-auto"
    >
      <div className="relative z-10 py-5 text-center">
        <div className="flex-col justify-center items-end">
          <div className="bg-transparent my-10 p-5 justify-end max-sm:mt-5 max-sm:px-0 max-sm:py-4 w-[90%] mx-auto sm:max-w-lg">
            <div className="flex flex-col justify-center items-center gap-[30px]">
              <Image
                src={"/icons/enable-trading.svg"}
                alt={"Enable trading icon"}
                width={80}
                height={80}
                sizes="(max-width: 768px) 80px, (max-width: 1024px) 80px"
              />
              <h2 className={"text-2xl text-center text-white font-bold"}>
                Validate your account
              </h2>
              <div>
                <div className="flex justify-center gap-2">
                  <Button
                    className="py-5 text-sm bg-[#CC0066] hover:bg-[#CC0066]/80 text-white font-semibold w-full max-w-[200px] rounded-[5px]"
                    onClick={setupProxyWallet}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Enable Trading"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingModal>
  )
}

export default AccountValidationModal

/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwarderContract } from "@/contracts/data/forwarder"
import { proxyWalletContract } from "@/contracts/data/proxy-wallet"
import { walletFactoryContract } from "@/contracts/data/wallet-factory"
import { useUserContext } from "@/providers/user-provider"
import { useState } from "react"
import { encodeFunctionData } from "viem"
import { useAccount, usePublicClient, useSignTypedData } from "wagmi"
import { useToast } from "./use-toast"

export interface ForwardRequest {
  from: string
  to: string
  value: string
  gas: string
  nonce: string
  deadline: string
  data: string
}

// The request data as expected by the ERC2771Forwarder
export interface ForwardRequestData extends ForwardRequest {
  signature: string
}

// EIP-712 type definitions
const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
]

const ForwardRequestType = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint48" },
  { name: "data", type: "bytes" },
]

/**
 * Hook for gasless transactions using ERC2771Forwarder
 */
export function useGaslessTransactions() {
  const publicClient = usePublicClient()
  const { proxyAddress } = useUserContext()
  const { signTypedDataAsync } = useSignTypedData()
  const { toast } = useToast()
  const { address } = useAccount()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Prepare a proxy call to the user's wallet
   */
  const prepareProxyWalletCall = (params: {
    targetContract: string
    amount: string
    data: string
  }) => {
    const { targetContract, amount, data } = params
    // CallType.CALL = 1
    const callType = 1

    // Encode the proxy call
    return encodeFunctionData({
      abi: proxyWalletContract.abi,
      functionName: "proxy",
      args: [
        [
          {
            typeCode: callType,
            to: targetContract,
            value: BigInt(Number(amount)),
            data,
          },
        ],
      ],
    })
  }

  /**
   * Build a forward request with all the required fields
   */
  const buildRequest = async (input: {
    from: string
    to: string
    data: string
  }): Promise<ForwardRequest> => {
    if (!publicClient) throw new Error("Public client not available")

    // Get the nonce from the forwarder contract
    const nonce = await publicClient.readContract({
      address: forwarderContract.address,
      abi: forwarderContract.abi,
      functionName: "nonces",
      args: [input.from],
    })
    // Set deadline to 1 hour from now
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const oneHourInSeconds = 3600
    const deadline = currentTimestamp + oneHourInSeconds

    return {
      from: input.from,
      to: input.to,
      value: "0",
      gas: "1000000",
      nonce: (nonce as any).toString(),
      deadline: deadline.toString(),
      data: input.data,
    }
  }

  /**
   * Build the EIP-712 typed data structure
   */

  const buildTypedData = async (request: ForwardRequest) => {
    if (!publicClient) throw new Error("Public client not available")
    const chainId = await publicClient.getChainId()

    return {
      types: {
        EIP712Domain,
        ForwardRequest: ForwardRequestType,
      },
      domain: {
        name: "Groovy",
        version: "1",
        chainId,
        verifyingContract: forwarderContract.address,
      },
      primaryType: "ForwardRequest" as const,
      message: {
        from: request.from,
        to: request.to,
        value: request.value === "0" ? BigInt(0) : BigInt(request.value),
        gas: BigInt(request.gas),
        nonce: BigInt(request.nonce),
        deadline: BigInt(request.deadline),
        data: request.data.startsWith("0x")
          ? request.data
          : `0x${request.data}`,
      },
    }
  }

  /**
   * Create and sign a forward request
   */
  const createSignedRequest = async (params: {
    to: string
    data: string
  }): Promise<ForwardRequestData> => {
    if (!address) {
      throw new Error("Wallet not connected")
    }

    try {
      // Step 1: Build the request
      const request = await buildRequest({
        from: address,
        to: params.to,
        data: params.data,
      })
      // Step 2: Build the typed data
      const typedData = await buildTypedData(request)

      // Step 3: Sign the typed data
      try {
        const signature = await signTypedDataAsync(typedData as any)
        // Return the signed request
        return {
          ...request,
          signature,
        }
      } catch (error) {
        console.error("Error details:", error)

        throw error
      }
    } catch (error) {
      console.error("Error creating signed request:", error)
      throw error
    }
  }

  /**
   * Create a wallet through meta-transaction
   */
  const createWallet = async (): Promise<string | null> => {
    if (!address || !publicClient) {
      throw new Error("Wallet not connected")
    }

    try {
      setLoading(true)

      // Prepare wallet creation call data
      const createWalletData = encodeFunctionData({
        abi: walletFactoryContract.abi,
        functionName: "createWalletFor",
        args: [address],
      })

      // Create and sign the request
      const signedRequest = await createSignedRequest({
        to: walletFactoryContract.address,
        data: createWalletData,
      })

      // Send to backend
      const response = await fetch("/api/proxy/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: signedRequest,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create wallet")
      }
      const data = await response.json()

      // Update state
      setWalletAddress(data.walletAddress)

      toast({
        title: "Success",
        description: "Wallet created successfully",
      })

      return data.walletAddress
    } catch (error) {
      console.error("Error creating wallet:", error)
      toast({
        title: "Error",
        description: "Failed to create wallet",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Execute a gasless transaction
   */
  const executeTransaction = async (params: {
    targetContract: string
    amount: string
    data: string
    newProxyAddress?: string
  }): Promise<{ success: boolean; result?: any }> => {
    try {
      setLoading(true)
      const { targetContract, amount, data } = params
      // 1. Prepare the proxy wallet call
      const proxyCallData = prepareProxyWalletCall({
        targetContract,
        amount,
        data,
      })

      // 2. Create and sign the forward request
      const signedRequest = await createSignedRequest({
        to: proxyAddress || params.newProxyAddress || "",
        data: proxyCallData,
      })

      // 3. Send to backend for execution
      const response = await fetch("/api/proxy/transaction/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: signedRequest,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute transaction")
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: "Transaction executed successfully",
      })

      return { success: true, result }
    } catch (error) {
      console.error("Error executing transaction:", error)
      toast({
        title: "Error",
        description: "Failed to execute transaction",
        variant: "destructive",
      })
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    walletAddress,
    loading,
    createWallet,
    executeTransaction,
  }
}

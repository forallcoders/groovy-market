/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { ctfExchangeContract } from "@/contracts/data/ctf-exchange";
import { useOrderBook } from "@/hooks/market/use-order-book";
import { useConditionalTokenBalance } from "@/hooks/use-conditional-token-balance";
import { useGaslessTransactions } from "@/hooks/use-gasless-client";
import { toast } from "@/hooks/use-toast";
import { useTokensState } from "@/hooks/use-tokens-state";
import { useUserPositions } from "@/hooks/use-user-positions";
import { FEE_RATE_BPS } from "@/lib/config";
import { quoteMarketBuy } from "@/lib/order/quote-market";
import { cn } from "@/lib/utils";
import { useUserContext } from "@/providers/user-provider";
import { SignatureType, UnsignedOrder } from "@/types/Market";
import { ArrowLeft, X } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { zeroAddress } from "viem";
import { useAccount, useSignMessage } from "wagmi";
import {
  calculateMaxBuy,
  formatOrderForApi,
  generateOrderSalt,
} from "../../utils/order";

type MarketType = "team" | "team-with-draw" | "single";

export const BuyMarketWidget = ({
  selectedName,
  selectedToken,
  marketType = "team",
  team1Logo,
  team2Logo,
  assetImage,
  title,
  orders,
  isYesToken,
  isDraw,
  marketId,
  yesPrice,
  noPrice,
  setShowBuy,
  marketInfo,
}: {
  selectedName: string;
  selectedToken: string;
  marketType?: MarketType;
  team1Logo?: string;
  team2Logo?: string;
  assetImage?: string;
  title: string;
  orders: any;
  isYesToken: boolean;
  isDraw?: boolean;
  marketId: string;
  yesPrice: number;
  noPrice: number;
  marketInfo: any;
  setShowBuy: (show: boolean) => void;
}) => {
  const [amount, setAmount] = useState(0);
  const maxBuy = calculateMaxBuy(orders, isYesToken ? "YES" : "NO");
  const { hasERC20Allowance, balance, refetchBalance, refetchAll } =
    useTokensState({});
  const { executeTransaction } = useGaslessTransactions();
  const { refetchPositionsValue } = useUserPositions();
  const { refetchNoTokenBalance, refetchYesTokenBalance } =
    useConditionalTokenBalance();
  const { refetch: refetchOrderBook } = useOrderBook(marketId);
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasNoLimitOrders = maxBuy <= 0;
  const shares = amount / (isYesToken ? yesPrice : noPrice);
  const { proxyAddress } = useUserContext();
  const { address } = useAccount();
  console.log("marketInfo", marketInfo);
  const marketOrderAmount = useMemo(() => {
    if (!orders || !marketInfo) return null;

    const relevantAsks = isYesToken ? orders.yesAsks : orders.noAsks;

    if (!relevantAsks || relevantAsks.length === 0) return null;

    const sortedAsks = [...relevantAsks].sort((a, b) => a.price - b.price);

    const asks = sortedAsks.map((ask) => ({
      price: ask.price / 100,
      quantity: ask.shares * 10 ** 6,
    }));

    return quoteMarketBuy({
      asks,
      usdcAmount: amount,
    });
  }, [orders, marketInfo, amount, isYesToken]);

  const handleSubmit = async () => {
    if (hasNoLimitOrders) {
      toast({
        title: "No limit orders available",
        description:
          "There is no available orders for this market. Please place a limit order or split tokens instead.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (!proxyAddress || !address) {
        toast({
          title: "Please connect your wallet",
          description: "Please connect your wallet to continue",
        });
        return;
      }
      if (!hasERC20Allowance) {
        toast({
          title: "Insufficient allowance",
          description: "Please approve the token to continue",
        });
        return;
      }
      if (amount > balance) {
        toast({
          title: "Insufficient balance",
          description: "Please add more tokens to your wallet",
        });
        return;
      }
      if (amount > maxBuy) {
        toast({
          title: "Exceeds maximum buy limit",
          description: `The amount you entered exceeds the maximum buy limit of ${maxBuy}. Please adjust your amount. Or place a limit order.`,
        });
        return;
      }
      const { makerAmount, takerAmount, averagePrice } =
        marketOrderAmount ?? {};
      if (!makerAmount || !takerAmount) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount",
        });
        return;
      }
      const unsignedOrder: UnsignedOrder = {
        salt: generateOrderSalt(),
        maker: proxyAddress || "",
        signer: address || "",
        taker: zeroAddress,
        tokenId: selectedToken,
        makerAmount,
        takerAmount,
        expiration: 0,
        nonce: BigInt(0),
        feeRateBps: BigInt(FEE_RATE_BPS),
        side: 0,
        signatureType: SignatureType.EOA,
        signature: "0x" as `0x${string}`,
      };

      const hashResult = await fetch("/api/orders/hash-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchangeAddress: ctfExchangeContract.address,
          order: formatOrderForApi(unsignedOrder),
        }),
      });

      if (!hashResult.ok) {
        return false;
      }

      const { hash } = await hashResult.json();

      const signature = await signMessageAsync({
        message: { raw: hash as `0x${string}` },
      });

      const signedOrder = {
        ...unsignedOrder,
        signature,
      };

      const dbResult = await fetch("/api/orders/market-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: formatOrderForApi(unsignedOrder),
          signature,
          marketId: marketId,
          conditionId: marketInfo?.conditionId,
          price: averagePrice,
        }),
      });

      if (!dbResult.ok) {
        return false;
      }

      const { orderHash, pendingMatch } = await dbResult.json();

      const finalOrder = {
        ...signedOrder,
        orderHash,
        pendingMatch: Boolean(pendingMatch),
      };
      console.log({ finalOrder });
      toast({
        title: "Order submitted",
        description: "Your order has been submitted",
      });

      refetchBalance();
      refetchNoTokenBalance();
      refetchYesTokenBalance();
      refetchOrderBook();
      refetchAll();
      refetchPositionsValue();
      setAmount(0);
      setShowBuy(false);
    } catch (error) {
      console.error(error);
      setError("An error occurred while submitting the order");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (): Promise<void> => {
    if (hasNoLimitOrders) {
      toast({
        title: "No limit orders available",
        description:
          "There is no available orders for this market. Please place a limit order or split tokens instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        "/march-chadness/api/user/approve-tokens-markets",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spenderAddress: ctfExchangeContract.address,
            amount,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch approval transaction");
      const { request } = await response.json();

      const result = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      });

      if (!result.success) {
        throw new Error("Failed to approve account");
      }

      toast({
        title: "Account Approved",
        description: "Your account has been approved.",
      });
      refetchAll();
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve your account. Please try again.",
      });
    }
  };

  const getThemeColor = () => {
    if (marketInfo?._marketType === "sports") {
      if (isDraw) return "bg-[#415058] hover:bg-[#374046] transition";
      return isYesToken
        ? "bg-[#cc00668b] hover:bg-[#CC0066] transition"
        : "bg-[#9900cc78] hover:bg-[#9900CC] transition";
    }
    // Para cripto e outros
    return isYesToken
      ? "bg-[rgba(1,185,93,0.5)] hover:bg-[#01B95D] transition"
      : "bg-[rgba(203,66,4,0.35)] hover:bg-[#E1372D] transition";
  };

  const getSliderColor = () => {
    if (marketType === "team" || marketType === "team-with-draw") {
      if (isDraw) return "accent-[#415058]";
      return isYesToken ? "accent-[#CC0066]" : "accent-[#9900CC]";
    }
    return isYesToken ? "accent-[#CC0066]" : "accent-[#9900CC]";
  };

  const renderMarketHeader = () => {
    if (marketType === "team" || marketType === "team-with-draw") {
      return (
        <div className="flex items-center">
          {isDraw && marketType === "team-with-draw" ? (
            <div className="flex items-center">
              {isDraw && (
                <img
                  src={"/icons/circle-pause.svg"}
                  width={24}
                  height={24}
                  alt="Draw"
                  className="mr-2 w-7 h-7"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center mb-2 mt-2">
              {team1Logo ? (
                <img
                  src={team1Logo}
                  width={24}
                  height={24}
                  alt="Team 1"
                  className="mr-2 w-7 h-7"
                />
              ) : (
                <div className="w-7 h-7 bg-gray-200 rounded-full mr-2"></div>
              )}
              {team2Logo && (
                <img
                  src={team2Logo}
                  width={24}
                  height={24}
                  alt="Team 2"
                  className="w-7 h-7"
                />
              )}
            </div>
          )}
          <h2
            className={cn("text-[16px] font-semibold ml-[10px]", {
              "text-muted": !title,
            })}
          >
            {title}
          </h2>
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          {assetImage ? (
            <img
              src={assetImage}
              width={40}
              height={40}
              alt={title || "Market asset"}
              className="rounded-md"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
          )}
          <h2
            className={cn("text-[16px] font-semibold ml-[10px]", {
              "text-muted": !title,
            })}
          >
            {title || "Unknown Market"}
          </h2>
        </div>
      );
    }
  };

  const getBuyButtonText = () => {
    if (loading) return "Buying...";

    if (marketType === "team-with-draw" && isDraw) {
      return "Buy DRAW";
    }

    return `Buy ${selectedName}`;
  };

  const handleSliderInteraction = (e: React.MouseEvent | React.ChangeEvent) => {
    if (hasNoLimitOrders) {
      toast({
        title: "No limit orders available",
        description:
          "There is no available orders for this market. Please place a limit order or split tokens instead.",
        variant: "destructive",
      });
      e.preventDefault();
    } else {
      if ("target" in e && "value" in e.target) {
        setAmount(Number((e.target as HTMLInputElement).value));
      }
    }
  };

  const handleIncrementClick = (incrementAmount: number) => {
    if (hasNoLimitOrders) {
      toast({
        title: "No limit orders available",
        description:
          "There is no available orders for this market. Please place a limit order or split tokens instead.",
        variant: "destructive",
      });
    } else {
      setAmount(amount + incrementAmount);
    }
  };

  const handleMaxClick = () => {
    if (hasNoLimitOrders) {
      toast({
        title: "No limit orders available",
        description:
          "There is no available orders for this market. Please place a limit order or split tokens instead.",
        variant: "destructive",
      });
    } else {
      setAmount(maxBuy);
    }
  };

  const rangeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rangeRef.current) {
      const percent = ((amount - 0) / ((maxBuy || 100) - 0)) * 100;
      rangeRef.current.style.setProperty("--progress", `${percent}%`);
      const fillColor = getSliderColor()
        .replace("accent-", "#")
        .replace("bg-", "#");
      rangeRef.current.style.setProperty("--range-fill", fillColor);
    }
  }, [amount, maxBuy, isYesToken, isDraw, marketType]);

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="relative">
        {renderMarketHeader()}
        <button
          onClick={() => setShowBuy(false)}
          className="absolute top-0 right-0"
        >
          <X className="w-6 h-6 text-[#5e6367]" />
        </button>
      </div>

      <div className="flex flex-col gap-1 mt-1">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row justify-between items-center gap-2 text-[13px] border-2 bg-transparent border-[#81898E] rounded-[6px] px-2 py-1">
            <div className="flex flex-row items-center">
              <div className="text-[18px] font-semibold">$</div>
              <input
                ref={rangeRef}
                type="number"
                className="min-w-[48px] text-start max-w-[80px] text-xl font-semibold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={amount}
                onChange={
                  hasNoLimitOrders
                    ? handleSliderInteraction
                    : (e) => setAmount(Number(e.target.value))
                }
                max={maxBuy}
              />
            </div>
            <div className="flex flex-row items-center gap-1">
              <button
                onClick={() => handleIncrementClick(1)}
                className="h-5 px-1 bg-trasparent text-white border border-[#474B4E] flex items-center justify-center rounded-[4px]"
              >
                +1
              </button>
              <button
                onClick={() => handleIncrementClick(10)}
                className="h-5 px-1 bg-trasparent text-white border border-[#474B4E] flex items-center justify-center rounded-[4px]"
              >
                +10
              </button>
              <button
                onClick={handleMaxClick}
                className="h-5 px-1 bg-trasparent text-white border border-[#474B4E] flex items-center justify-center rounded-[4px]"
              >
                Max
              </button>
            </div>
          </div>
          <div className="w-full flex flex-col justify-between items-start ml-3 h-full pt-2">
            {!hasERC20Allowance && (
              <p className="text-right text-muted text-[12px] min-w-[120px] flex items-center">
                To get: ${shares ? shares.toFixed(2) : 0}
              </p>
            )}
            <input
              ref={rangeRef}
              type="range"
              min={0}
              max={maxBuy || 100}
              value={amount}
              className="custom-range w-full"
              onChange={handleSliderInteraction}
              onClick={hasNoLimitOrders ? handleSliderInteraction : undefined}
              style={{ marginTop: 0 }}
            />
          </div>
        </div>
      </div>

      {hasERC20Allowance ? (
        <Button
          disabled={loading}
          className={`w-full ${getThemeColor()}`}
          onClick={handleSubmit}
        >
          {getBuyButtonText()}
        </Button>
      ) : (
        <Button
          disabled={loading}
          className={`w-full mt-2 ${getThemeColor()}`}
          onClick={handleApprove}
        >
          Approve tokens
        </Button>
      )}
      {hasERC20Allowance && (
        <p className="text-center mt-1 text-muted text-[13px]">
          To win ${shares ? shares.toFixed(2) : 0}
        </p>
      )}

      {error && (
        <p className="text-center mt-1 text-muted text-[13px]">{error}</p>
      )}
    </div>
  );
};

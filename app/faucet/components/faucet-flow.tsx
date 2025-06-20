"use client";

import { useState } from "react";
import FaucetStage1 from "./faucet-stage-1";
import FaucetStage2 from "./faucet-stage-2";
import FaucetLayout from "./faucet-layout";

export default function FaucetFlow() {
  const [step, setStep] = useState(1);
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);

  let content = null;
  if (step === 1) {
    content = (
      <FaucetStage1
        onNext={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            setStep(2);
          }, 3000);
        }}
        wallet={wallet}
        setWallet={setWallet}
        loading={loading}
      />
    );
  } else if (step === 2) {
    content = <FaucetStage2 wallet={wallet} />;
  }

  return <FaucetLayout step={step} loading={loading}>{content}</FaucetLayout>;
}

"use client";

import { useState, useEffect } from "react";
import ListStage1 from "./list-stage-1";
import ListStage2 from "./list-stage-2";
import ListLayout from "./list-layout";
import { useUserContext } from "@/providers/user-provider";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function ListFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, isConnected } = useUserContext();
  const { showAuthFlow } = useDynamicContext();

  useEffect(() => {
    if (loading && isConnected) {
      setLoading(false);
      setStep(2);
    }
  }, [isConnected, loading]);

  useEffect(() => {
    if (!showAuthFlow && loading && !isConnected) {
      setLoading(false);
    }
  }, [showAuthFlow, loading, isConnected]);

  let content = null;
  if (step === 1) {
    content = (
      <ListStage1 onNext={() => {}} setLoading={setLoading} loading={loading} />
    );
  } else if (step === 2) {
    content = <ListStage2 user={user} />;
  }

  const videoStep = step === 1 && loading ? 2 : 1;

  return (
    <ListLayout step={videoStep} loading={loading}>
      {content}
    </ListLayout>
  );
}

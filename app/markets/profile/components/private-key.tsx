"use client";

import Image from "next/image";

import { Alert, AlertDescription } from "@/components/ui/Alert/alert";
import { Button } from "@/components/ui/Button/Button";
import { Text } from "@/components/ui/Text/text";
import {
  DynamicUserProfile,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";

const basicSteps = [
  "Click the button below to start the process",
  "Go to settings and click on the button to export your private key",
  "Close the modal",
];

export default function PrivateKey() {
  const { setShowDynamicUserProfile } = useDynamicContext();

  return (
    <div className="flex flex-col gap-5 max-w-[600px]">
      <div className="flex flex-col gap-3">
        <Text className="text-lg flex gap-2 items-center font-medium leading-none">
          Export Private key
        </Text>
        <Text className="text-sm font-light">
          Exporting your private key gives you direct control and security over
          your funds. This is applicable if you’ve signed up via email.
        </Text>
        <Alert className="w-full" variant="information">
          <Image
            alt="info icon"
            src="/icons/info.svg"
            width={20}
            height={20}
            className="h-5 w-5"
          />
          <AlertDescription className="text-xs">
            <span className="font-medium">Do Not </span>share your private key
            with anyone. We will never ask for your private key.
          </AlertDescription>
        </Alert>
      </div>
      {/* Basic Step Card */}
      <div className="border-1 w-full border-neutral-800 rounded-lg p-3.5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Text className="text-lg flex gap-2 items-center font-medium leading-none">
              Basic steps
            </Text>
            {basicSteps.map((step, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="px-2.5 py-1 rounded-full h-7.5 bg-white text-black font-semibold text-sm">
                  {index + 1}
                </span>
                <Text className="text-sm font-light leading-none">{step}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Button
        onClick={() => setShowDynamicUserProfile(true)}
        className="w-36 text-[13px]"
        size="sm"
        variant="berry"
      >
        Start export
      </Button>
      <DynamicUserProfile variant="modal" />
    </div>
  );
}

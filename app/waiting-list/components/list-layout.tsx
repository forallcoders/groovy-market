import { useUserContext } from "@/providers/user-provider";
import Image from "next/image";
import { ReactNode, useState, useEffect } from "react";

export default function ListLayout({
  children,
  step,
  loading,
}: {
  children: ReactNode;
  step: number;
  loading: boolean;
}) {
  const [stepState, setStepState] = useState(1);
  const { user, isConnected, error } = useUserContext();

  useEffect(() => {
    if (!loading && isConnected) {
      setStepState(2);
    }
  }, [isConnected, loading]);

  const getOpacity = (video: number) => {
    if (stepState === 1 && !loading && video === 1) return "opacity-100";
    if (stepState === 1 && loading && video === 2) return "opacity-100";
    if (stepState === 2 && video === 1) return "opacity-100";
    return "opacity-0 pointer-events-none";
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#CC99FF]">
      <div className="flex justify-end p-6">
        <Image
          src="/logo/gmlogo.svg"
          alt="Groovy Market Logo"
          width={120}
          height={40}
        />
      </div>
      <div className="md:flex-1 flex flex-col md:flex-row gap-6 items-stretch justify-center w-full">
        <div className="flex flex-col justify-center items-start flex-1 md:min-w-[620px] md:-mt-33 ml-12">
          {children}
        </div>
        <div className="flex flex-col flex-[2] justify-center items-center md:-mt-33 w-full relative min-h-[400px]">
          <video
            src="/video/waiting-list/unicorn-1.webm"
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-auto drop-shadow-xl rounded-xl bg-transparent absolute md:top-[20vh] right-0 transition-opacity duration-500 ${getOpacity(
              1
            )}`}
          />
          <video
            src="/video/waiting-list/unicorn-2.webm"
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-auto drop-shadow-xl rounded-xl bg-transparent absolute md:top-[20vh] right-0 transition-opacity duration-500 ${getOpacity(
              2
            )}`}
          />
        </div>
      </div>
      <footer className="w-full text-center text-xs text-black/60 py-4 mt-auto">
        © 2023 Groovy Market. All rights reserved |{" "}
        <a href="/terms" className="underline font-bold">
          Terms of Service
        </a>{" "}
        |{" "}
        <a href="/privacy" className="underline font-bold">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}

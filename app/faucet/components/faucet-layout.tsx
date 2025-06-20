import Image from "next/image";
import { ReactNode } from "react";

export default function FaucetLayout({
  children,
  step,
  loading,
}: {
  children: ReactNode;
  step: number;
  loading: boolean;
}) {
  // Controle de visibilidade dos vídeos
  const getOpacity = (video: number) => {
    if (step === 1 && !loading && video === 1) return 'opacity-100';
    if (step === 1 && loading && video === 2) return 'opacity-100';
    if (step === 2 && video === 3) return 'opacity-100';
    return 'opacity-0 pointer-events-none';
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
        <div className="flex flex-col justify-center items-start flex-1 md:-mt-33 md:ml-[100px] ml-12">
          {step !== 2 && (
            <div className="mb-2">
              <h1 className="text-5xl flex flex-col md:text-6xl font-bold text-[#333333] mb-6 leading-tight">
                Fund your
                <div className="inline-block align-middle -ml-[75px] md:-ml-[100px] -my-1 md:-my-2">
                  <Image
                    src="/images/playground-image.png"
                    alt="PLAYGROUND"
                    width={520}
                    height={70}
                    className="inline-block align-middle w-[420] h-[60px] md:w-[520px] md:h-[70px] object-cover"
                    quality={100}
                  />
                </div>
                Wallet.
              </h1>
            </div>
          )}
          {children}
        </div>
        {/* Coluna direita: todos os vídeos renderizados, só um visível */}
        <div className="flex flex-col flex-[2] justify-center items-center md:-mt-33 w-full relative min-h-[400px]">
          <video
            src="/video/faucet/unicorn-1.webm"
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-auto drop-shadow-xl rounded-xl bg-transparent absolute md:top-[20vh] right-0 transition-opacity duration-500 ${getOpacity(1)}`}
          />
          <video
            src="/video/faucet/unicorn-2.webm"
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-auto drop-shadow-xl rounded-xl bg-transparent absolute md:top-[20vh] right-0 transition-opacity duration-500 ${getOpacity(2)}`}
          />
          <video
            src="/video/faucet/unicorn-3.webm"
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-auto drop-shadow-xl rounded-xl bg-transparent absolute md:top-[20vh] right-0 transition-opacity duration-500 ${getOpacity(3)}`}
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

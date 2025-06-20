"use client"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { GradientButton } from "./components/chadness-button"
import { CircularMarchChadness } from "./components/circular-march-chadness"
import { CircularMarketComingSoon } from "./components/circular-market-coming-soon"

export default function Home() {
  // const router = useRouter();
  const [showFullscreen] = useState(false)
  const [fullscreenImage] = useState("")
  const [startPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const { setShowAuthFlow } = useDynamicContext();

  // useEffect(() => {
  //   if (showFullscreen) {
  //     const timer = setTimeout(() => {
  //       router.replace(process.env.NEXT_PUBLIC_MARCH_CHADNESS_URL!);
  //       // setShowFullscreen(false);
  //     }, 800);
  //     return () => clearTimeout(timer);
  //   }
  // }, [showFullscreen]);

  // const openFullscreen = (imageSrc: string, event: React.MouseEvent<HTMLImageElement>) => {
  //   const rect = event.currentTarget.getBoundingClientRect();
  //   setStartPosition({
  //     x: rect.left,
  //     y: rect.top,
  //     width: rect.width,
  //     height: rect.height,
  //   });
  //   setFullscreenImage(imageSrc);
  //   setShowFullscreen(true);
  // };

  return (
    <div className="flex flex-col gap-18 sm:gap-6 my-12">
      <div className="flex flex-col gap-4 sm:hidden">
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/logo/logo-beta.png"
            alt="gmlogo"
            layout="responsive"
            width={550}
            height={335}
            className="!w-[214px]"
          />
        </div>
        <div className="w-full bg-[#FF79C1] flex items-center justify-center">
          <h2 className="text-[18px] text-[#333] text-center font-bold py-3">
            A On-chain Social Prediction Market
          </h2>
        </div>
      </div>

      <div className="flex lg:gap-[90px] md:gap-[40px] gap-[40px] self-center">
        <div className="flex flex-col-reverse sm:flex-col items-center justify-between sm:justify-normal text-white gap-5">
          <div className="flex flex-col items-center sm:gap-2">
            <p className="text-md sm:text-[25px] font-semibold leading-none">
              Will return in
            </p>
            <span className="text-[24px] sm:text-[38px] font-extrabold leading-none">
              2026
            </span>
          </div>
          <CircularMarchChadness />
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center">
          <Image
            src="/logo/logo-beta.png"
            alt="gmlogo"
            layout="responsive"
            width={550}
            height={335}
            className="!w-[490px]"
          />
        </div>
        <div className="flex font-bold flex-col-reverse sm:flex-col items-center text-white gap-5">
          <div className="flex flex-col items-center gap-2">
            <p className="text-md sm:text-[25px] leading-none">Become a</p>
            <Link href={"/become-market-creator"}>
              <GradientButton
                variant="tertiary"
                className="w-[95px] sm:w-[129px] h-8 sm:h-10 text-black py-0 !leading-3 sm:!leading-4 !text-wrap text-sm sm:text-[18px]"
              >
                MARKET CREATOR
              </GradientButton>
            </Link>
          </div>
          <CircularMarketComingSoon />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="hidden sm:flex w-full bg-[#FF79C1] items-center justify-center">
          <h2 className="text-[39px] text-[#333] text-center font-bold tracking-wider">
            A On-chain Social Prediction Market
          </h2>
        </div>

        <div className="w-full py-2 flex items-center justify-center bg-[#78FFC2]">
          <h2 className="px-8 sm:px-0 text-[15px] sm:text-[31px] text-[#333] font-medium text-center">
            <strong className="font-bold">CREATE</strong> your own markets,{" "}
            <strong className="font-bold">STACK</strong> parlays and you{" "}
            <strong className="font-bold">BECOME THE HOUSE!</strong>
          </h2>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center mx-auto gap-6 sm:gap-8 mt-0 sm:mt-4">
        <GradientButton
          variant="secondary"
          className="w-[95px] sm:w-[129px] h-8 sm:h-10 text-[15px] sm:text-[18px]"
          onClick={() => setShowAuthFlow(true)}
        >
          SIGN UP
        </GradientButton>
        <GradientButton className="w-[95px] sm:w-[129px] h-8 sm:h-10 text-[15px] sm:text-[18px]" onClick={() => setShowAuthFlow(true)}>
          LOG IN
        </GradientButton>
      </div>

      {showFullscreen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center transition-opacity duration-1000">
          <div
            className="flex items-center justify-center"
            style={{
              animation: "zoomIntoImage 1s ease-out forwards",
              position: "absolute",
              top: startPosition.y,
              left: startPosition.x,
              width: startPosition.width,
              height: startPosition.height,
            }}
          >
            <style jsx global>{`
              @keyframes zoomIntoImage {
                0% {
                  top: 50%;
                  left: 50%;
                  width: 100vw;
                  height: 100vh;
                  transform: translate(-50%, -50%) scale(1);
                  opacity: 1;
                }
                20% {
                  top: 50%;
                  left: 50%;
                  width: 125vw;
                  height: 125vh;
                  transform: translate(-50%, -50%) scale(1.4);
                  opacity: 1;
                }
                40% {
                  top: 50%;
                  left: 50%;
                  width: 150vw;
                  height: 150vh;
                  transform: translate(-50%, -50%) scale(1.8);
                  opacity: 1;
                }
                60% {
                  top: 50%;
                  left: 50%;
                  width: 175vw;
                  height: 175vh;
                  transform: translate(-50%, -50%) scale(2.2);
                  opacity: 1;
                }
                80% {
                  top: 50%;
                  left: 50%;
                  width: 200vw;
                  height: 200vh;
                  transform: translate(-50%, -50%) scale(2.6);
                  opacity: 1;
                }
                100% {
                  top: 50%;
                  left: 50%;
                  width: 250vw;
                  height: 250vh;
                  transform: translate(-50%, -50%) scale(3);
                  opacity: 1;
                }
              }
            `}</style>
            <Image
              src={fullscreenImage}
              alt="Fullscreen image"
              width={1600}
              height={1600}
              className="object-contain"
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "100vw",
                maxHeight: "100vh",
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

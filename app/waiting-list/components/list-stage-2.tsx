import Image from "next/image";

interface Props {
  user: any;
}

export default function ListStage2({ user }: Props) {
  const username = user?.username ?? "";
  const referral = user?.referralCode ?? "";

  const handleShare = () => {
    const text = `My username ${username} has been reserved on Groovy Market! Referral: ${referral}`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full rounded-xl">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
        <div className="flex-1 flex flex-col items-start justify-center max-w-[420px] ">
          <h1 className="text-3xl md:text-[66px] font-extrabold text-[#333] mb-2 w-full">
            {username}
            <span className="block font-bold md:text-[44px] w-full">
              has been reserved!
            </span>
          </h1>
          <p className="text-2xl text-[#333] md:mb-44 mb-24">
            You&apos;ll be notified when our <b>PLAYGROUND</b> is live!
          </p>
          <div className="text-2xl font-bold text-[#333] md:mb-4 mb-2">
            Referral Code:{" "}
            <span className="ml-2 font-mono text-2xl ">{referral}</span>
          </div>

          <Image
            onClick={handleShare}
            src="/images/share-x.png"
            alt="X logo"
            width={424}
            height={70}
            quality={100}
            className="md:w-[424px] w-[260px] h-auto cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

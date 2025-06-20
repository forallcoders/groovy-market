import Image from "next/image";
import Link from "next/link";

interface Props {
  wallet: string;
}

export default function FaucetStage2({ wallet }: Props) {
  return (
    <>
      <div className="h-full flex flex-col justify-center items-start gap-33">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 text-black/80">
          Funds <br /> delivered!
        </h1>
        <div className="text-xl font-bold text-[#333333] mb-6 flex flex-col items-start gap-1">
          You&apos;re ready to

          <Link href="/" className="inline-block align-middle">
            <Image
              src="/images/play-button.png"
              alt="PLAY"
              height={45}
              width={240}
              className="inline-block align-middle h-[45px] w-auto"
            />
          </Link>
        </div>
      </div>
    </>
  );
}

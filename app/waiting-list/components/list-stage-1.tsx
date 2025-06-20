import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import Image from "next/image";

interface Props {
  onNext: () => void;
  setLoading: (v: boolean) => void;
  loading: boolean;
}

export default function ListStage1({
  onNext,
  setLoading,
  loading,
}: Props) {
  const { setShowAuthFlow } = useDynamicContext();

  const handleClaim = () => {
    setLoading(true); // ativa animação 2
    setShowAuthFlow(true); // abre modal de login
  };

  return (
    <div className="w-full max-w-[460px] pr-12 md:pr-0 mt-10 md:mt-0">
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
      <label className="block text-3xl md:text-2xl font-bold text-[#222] mb-2">
        Claim your username:
      </label>
      <button
        className={`w-full rounded-lg py-3 bg-[#FFE066] text-black text-lg font-extrabold tracking-wide mt-1 disabled:opacity-50 transition-all shadow-md ${
          loading ? "cursor-wait" : ""
        }`}
        onClick={handleClaim}
      >
        CLAIM USERNAME
      </button>
    </div>
  );
}

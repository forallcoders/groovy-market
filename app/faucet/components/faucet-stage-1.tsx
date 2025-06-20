import Image from "next/image";

interface Props {
  onNext: () => void;
  wallet: string;
  setWallet: (v: string) => void;
  loading: boolean;
}

export default function FaucetStage1({ onNext, wallet, setWallet, loading }: Props) {
  return (
    <div className="w-full max-w-[460px] pr-12 md:pr-0 mt-10 md:mt-0">
      <label className="block text-3xl md:text-2xl font-bold text-[#222] mb-2">
        Wallet Address:
      </label>
      <input
        className="w-full rounded-lg px-4 py-3 mb-3 bg-[#33FF99] text-black text-lg font-semibold border-none outline-none placeholder:text-[#444] shadow-md"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        placeholder="0x..."
        style={{ letterSpacing: '0.5px' }}
        disabled={loading}
      />
      <button
        className={`w-full rounded-lg py-3 bg-[#FF3399] text-black text-lg font-extrabold tracking-wide mt-1 disabled:opacity-50 transition-all shadow-md ${loading ? 'cursor-wait' : ''}`}
        disabled={!wallet || loading}
        onClick={onNext}
      >
        COLLECT
      </button>
    </div>
  );
}

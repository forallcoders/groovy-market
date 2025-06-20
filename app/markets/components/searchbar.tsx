/* eslint-disable @next/next/no-img-element */
import { useRecentSearch } from "@/hooks/search/use-recent-search";
import { useSearch } from "@/hooks/search/use-search";
import { UserSearchHistory } from "@/lib/db/schema";
import axios from "axios";
import { Search, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
interface SearchBarProps {
  placeholder?: string
  className?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function SearchBar({
  className = "",
  placeholder = "",
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { data: session } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const onClickSearch = async () => {
    setIsOpen(false);
    if (session?.user) {
      await axios.post("/api/user/recent-search?query=" + searchValue);
    }
    setSearchValue("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 peer-focus:text-[#7272FF]" />
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder}
        className="peer bg-[#353539] rounded-full pl-10 pr-4 py-[6px] text-sm w-full text-white focus:outline-none focus:ring-1 focus:ring-[#7272FF] placeholder:text-gray-400 placeholder:text-[13px] placeholder:font-light"
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="absolute w-[90vw] max-w-[500px] bg-[#29292C] mt-12 rounded-lg shadow-lg z-50 py-2 border border-[#55595D] pt-4">
          {!searchValue ? (
            <>
              {/* Recent Searches */}
              <OpenSearchBar setSearchValue={setSearchValue} />
            </>
          ) : null}

          {searchValue && (
            <SearchResults
              searchValue={searchValue}
              handleSearch={onClickSearch}
            />
          )}
        </div>
      )}
    </div>
  );
}

const OpenSearchBar = ({ setSearchValue }: { setSearchValue: (value: string) => void }) => {
  const { data: recentSearches, isLoading, error, refetch } = useRecentSearch();
  const [searchHistory, setSearchHistory] = useState<UserSearchHistory[]>(recentSearches || []);
  if (isLoading) return <div className="px-4">Loading...</div>;
  if (error) return <div className="px-4">Error: {error.message}</div>;
  if (!recentSearches || recentSearches.length === 0)
    return <div className="px-4">No recent searches</div>;
  const removeSearch = (index: number) => {
    axios.delete(`/api/user/recent-search?query=${recentSearches[index].searchQuery}`);
    setSearchHistory(searchHistory.filter((_, i) => i !== index));
    refetch();
  };
  return (
    <>
      <div className="mb-4 px-4">
        <h3 className="text-white text-sm mb-2 font-semibold">Recent</h3>
        {searchHistory.map((search, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-[#353739] hover:bg-[#4B4E50] pl-3 mb-2 rounded transition-colors"
          >
            <button onClick={() => setSearchValue(search.searchQuery)} className="text-white text-[13px] font-semibold w-full h-full text-left cursor-pointer">
              {search.searchQuery}
            </button>
            <button
              onClick={() => removeSearch(index)}
              className="hover:bg-[#4A4A4E] p-1 rounded-full cursor-pointer"
            >
              <X className="h-6 w-6 text-[#A4A4AE]" />
            </button>
          </div>
        ))}
      </div>

      {/* <div className="border-t border-[#494B4E] mb-2"></div> */}
    </>
  );
};

const SearchResults = ({
  searchValue,
  handleSearch,
}: {
  searchValue: string;
  handleSearch: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "ended">("active");
  const { data, isLoading, error } = useSearch(searchValue);
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  console.log(data);
  if (data?.activeMarkets.length === 0 && data?.resolvedMarkets.length === 0) {
    return <div className="px-3">No results found</div>;
  }

  return (
    <div className="px-4 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`text-[16px] font-semibold ${
              activeTab === "active" ? "text-white" : "text-gray-400"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("ended")}
            className={`text-[16px] font-semibold ${
              activeTab === "ended" ? "text-white" : "text-gray-400"
            }`}
          >
            Ended
          </button>
        </div>

        {/* <Link
      className="text-[#7272FF] text-[13px] font-semibold text-right"
      href="/markets"
    >
      See all
    </Link> */}
      </div>

      <div className="space-y-2">
        {(activeTab === "active"
          ? data?.activeMarkets || []
          : data?.resolvedMarkets || []
        ).map((market: any, index: number) => {
          return (
            <Link
              key={index}
              className="flex items-center justify-between border border-[#494B4E] p-2 rounded-md transition-colors"
              href={`/markets/${market.id}/details`}
              onClick={handleSearch}
            >
              <div className="flex items-center gap-3">
                <img
                  src={market.image}
                  alt={market.title}
                  className="w-[30px] h-[30px] rounded-full"
                />
                <span className="text-white text-[13px] font-semibold">
                  {market.title}
                </span>
              </div>
              {market.status === "created" ? (
                <span className="text-white text-[13px] font-semibold">
                  {market.volume || "0"}
                </span>
              ) : (
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[13px] font-semibold ${
                      market.result === "Yes"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {market.result}
                  </span>
                  {market.hasMore && (
                    <span className="text-[11px] text-gray-400">+10 more</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

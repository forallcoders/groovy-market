/* eslint-disable @next/next/no-img-element */
import { useMarketContext } from "@/providers/market-provider"

export default function GameCard({
  gameData,
  onSelectLeg,
}: {
  gameData: any
  onSelectLeg?: (legId: string) => void
}) {
  const {
    volume,
    time,
    team1,
    team2,
    odds,
    draw,
    grouped,
    homeMarketId,
    drawMarketId,
    awayMarketId,
  } = gameData

  const {
    setSelectedMarketId,
    setSelectedTeam,
    setSelectedTokenOption,
    marketPanelVariant,
  } = useMarketContext()

  const handleTeamSelect = (game: any, team: any, legId?: string) => {
    setSelectedMarketId(legId ?? game.id)
    setSelectedTeam({
      name: team.name,
      shortName: team.shortName,
      logo: team.logo,
    })
    if (marketPanelVariant === "teamAbbreviations") {
      if (team.shortName === game.team1.shortName) {
        setSelectedTokenOption("YES")
      } else if (team.shortName === game.team2.shortName) {
        setSelectedTokenOption("NO")
      }
    }
    if (onSelectLeg && legId) {
      onSelectLeg(legId)
      return
    }
  }

  return (
    <div className="text-base border-2 border-[#353739] justify-around rounded-[10px] w-full flex p-5">
      {/* Home Team */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          {team1.logo ? (
            <img
              width={60}
              height={60}
              src={team1.logo}
              alt={`${team1.name} logo`}
              className="w-15 h-15 rounded-[5px]"
            />
          ) : (
            <span className="w-12 h-12 rounded-[5px] bg-[#582614]/20" />
          )}
          <p className="mt-[10px]">{team1.name}</p>
        </div>
        <button
          onClick={() =>
            handleTeamSelect(
              gameData,
              team1,
              grouped ? homeMarketId : undefined
            )
          }
          className={`w-[20vw] max-w-38 py-2 bg-[#CC0066] flex gap-2 justify-center cursor-pointer rounded-[5px] font-semibold text-[13px]`}
        >
          <span className="opacity-70">{team1.shortName.slice(0,3)}</span>
          <span>{odds.team1}</span>
        </button>
      </div>

      {/* Center/Match Info */}
      <div className="flex flex-col items-center">
        <div className="flex flex-col grow items-center">
          <div className="bg-[#353739] leading-none flex text-white items-center text-xs font-light p-1.5 rounded-[3px] tracking-[0.5px] -translate-y-4">
            {time}
          </div>
          <div className="flex gap-2 items-center mt-5">
            <span className="text-xs font-medium">{team1.prob}%</span>
            <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
              <div
                className="bg-[#CC0066] rounded-[5px] h-full"
                style={{ width: `${team1.prob}%` }}
              ></div>
              {draw && (
                <div
                  className="bg-[#415058] rounded-[5px] h-full"
                  style={{ width: `${draw.prob}%` }}
                ></div>
              )}
              <div
                className="bg-[#9900CC] rounded-[5px] h-full"
                style={{ width: `${team2.prob}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium">{team2.prob}%</span>
          </div>
          <p className="text-xs text-[#81898E] leading-none">{volume}</p>
        </div>

        {/* Draw Option - Only shown when available */}
        {odds.draw && (
          <button
            onClick={() =>
              handleTeamSelect(
                gameData,
                draw,
                grouped ? drawMarketId : undefined
              )
            }
            className={`w-[20vw] max-w-38 py-2 bg-[#415058] flex gap-2 justify-center cursor-pointer rounded-[5px] font-semibold text-[13px]`}
          >
            <span className="opacity-70">DRAW</span>
            <span>{odds.draw}</span>
          </button>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          {team2.logo ? (
            <img
              width={60}
              height={60}
              src={team2.logo}
              alt={`${team2.name} logo`}
              className="w-15 h-15 rounded-[5px]"
            />
          ) : (
            <span className="w-12 h-12 rounded-[5px] bg-[#582614]/20" />
          )}
          <p className="mt-[10px]">{team2.name}</p>
        </div>
        <button
          onClick={() =>
            handleTeamSelect(
              gameData,
              team2,
              grouped ? awayMarketId : undefined
            )
          }
          className={`w-[20vw] max-w-38 py-2 bg-[#9900CC] flex gap-2 justify-center cursor-pointer rounded-[5px] font-semibold text-[13px]`}
        >
          <span className="opacity-70">{team2.shortName.slice(0,3)}</span>
          <span>{odds.team2}</span>
        </button>
      </div>
    </div>
  )
}

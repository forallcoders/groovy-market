import { LeagueWithGameData } from "@/types/Sports"

export const leagueData: LeagueWithGameData = {
  NBA: {
    logo: "/images/nba-logo.jpg",
    games: [
      {
        id: "1",
        time: "7:30 PM",
        volume: "$2.5k Vol.",
        team1: {
          name: "Los Angeles Lakers",
          shortName: "LAL",
          logo: "/images/lakers-logo.png",
          record: "45-37",
        },
        team2: {
          name: "Golden State Warriors",
          shortName: "GSW",
          logo: "/images/gsw-logo.png",
          record: "44-38",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
      {
        id: "2",
        time: "8:00 PM",
        volume: "$1.8k Vol.",
        team1: {
          name: "Boston Celtics",
          shortName: "BOS",
          logo: "/images/bos-logo.png",
          record: "57-25",
        },
        team2: {
          name: "Miami Heat",
          shortName: "MIA",
          logo: "/images/mia-logo.png",
          record: "44-38",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
    ],
  },
  EPL: {
    logo: "/images/premier-logo.jpg",
    games: [
      {
        id: "3",
        time: "2:30 PM",
        volume: "$1.47k Vol.",
        team1: {
          name: "Everton",
          shortName: "EVE",
          logo: "/images/eve-logo.png",
          record: "6-8-9",
        },
        team2: {
          name: "Arsenal",
          shortName: "ARS",
          logo: "/images/arsenal-logo.svg",
          record: "14-8-2",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
      {
        id: "4",
        time: "3:00 PM",
        volume: "$1.2k Vol.",
        team1: {
          name: "Manchester City",
          shortName: "MCI",
          logo: "/images/mci-logo.png",
          record: "15-5-3",
        },
        team2: {
          name: "Liverpool",
          shortName: "LIV",
          logo: "/images/liv-logo.png",
          record: "13-7-3",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
    ],
  },
  NHL: {
    logo: "/images/nhl-logo.jpg",
    games: [
      {
        id: "5",
        time: "7:00 PM",
        volume: "$980 Vol.",
        team1: {
          name: "Toronto Maple Leafs",
          shortName: "TOR",
          logo: "/images/tor-logo.png",
          record: "35-15-8",
        },
        team2: {
          name: "Montreal Canadiens",
          shortName: "MTL",
          logo: "/images/mon-logo.png",
          record: "25-25-8",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
      {
        id: "6",
        time: "8:30 PM",
        volume: "$850 Vol.",
        team1: {
          name: "Chicago Blackhawks",
          shortName: "CHI",
          logo: "/images/chi-logo.png",
          record: "28-22-8",
        },
        team2: {
          name: "Detroit Red Wings",
          shortName: "DET",
          logo: "/images/det-logo.png",
          record: "30-20-8",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
    ],
  },
  UCL: {
    logo: "/images/ucl-logo.png",
    games: [
      {
        id: "7",
        time: "3:00 PM",
        volume: "$3.2k Vol.",
        team1: {
          name: "Real Madrid",
          shortName: "RMA",
          logo: "/images/rma-logo.png",
          record: "QF",
        },
        team2: {
          name: "Manchester City",
          shortName: "MCI",
          logo: "/images/mci-logo.png",
          record: "QF",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
      {
        id: "8",
        time: "3:00 PM",
        volume: "$2.8k Vol.",
        team1: {
          name: "Bayern Munich",
          shortName: "BAY",
          logo: "/images/bay-logo.png",
          record: "QF",
        },
        team2: {
          name: "Paris Saint-Germain",
          shortName: "PSG",
          logo: "/images/psg-logo.png",
          record: "QF",
        },
        odds: { team1: "99¢", draw: "99¢", team2: "99¢" },
      },
    ],
  },
}

export const orderBookProps = {
  tabs: ["Trade Teamname1", "Trade Teamname2"],

  asksData: {
    "Trade Teamname1": [
      { price: 89, shares: 250, total: 89 * 250 },
      { price: 85, shares: 33333, total: 85 * 33333 },
      { price: 80, shares: 15, total: 80 * 15 },
      { price: 77, shares: 400, total: 77 * 400 },
      { price: 76, shares: 500, total: 76 * 500 },
      { price: 75, shares: 500, total: 75 * 500 },
    ],
    "Trade Teamname2": [{ price: 80, shares: 100, total: 80000 }],
  },

  bidsData: {
    "Trade Teamname1": [
      { price: 49, shares: 14.62, total: 49 * 14.62 },
      { price: 46, shares: 1500, total: 46 * 1500 },
      { price: 43, shares: 700, total: 43 * 700 },
      { price: 41, shares: 250, total: 41 * 250 },
      { price: 39, shares: 1000, total: 39 * 1000 },
      { price: 35, shares: 800, total: 35 * 800 },
    ],
    "Trade Teamname2": [{ price: 45, shares: 1000, total: 45000 }],
  },
}

export const rawData = [
  {
    timestamp: 1740009600000,
    yes: 54.54,
    no: 45.46,
  },
  {
    timestamp: 1740031200000,
    yes: 52.01,
    no: 47.99,
  },
  {
    timestamp: 1740052800000,
    yes: 54.85,
    no: 45.15,
  },
  {
    timestamp: 1740074400000,
    yes: 53.41,
    no: 46.59,
  },
  {
    timestamp: 1740096000000,
    yes: 55.09,
    no: 44.91,
  },
  {
    timestamp: 1740117600000,
    yes: 57.87,
    no: 42.13,
  },
  {
    timestamp: 1740139200000,
    yes: 57.94,
    no: 42.06,
  },
  {
    timestamp: 1740160800000,
    yes: 59.03,
    no: 40.97,
  },
  {
    timestamp: 1740182400000,
    yes: 61.85,
    no: 38.15,
  },
  {
    timestamp: 1740204000000,
    yes: 61.86,
    no: 38.14,
  },
  {
    timestamp: 1740225600000,
    yes: 59.45,
    no: 40.55,
  },
  {
    timestamp: 1740247200000,
    yes: 59.81,
    no: 40.19,
  },
  {
    timestamp: 1740268800000,
    yes: 60.53,
    no: 39.47,
  },
  {
    timestamp: 1740290400000,
    yes: 60.27,
    no: 39.73,
  },
  {
    timestamp: 1740312000000,
    yes: 59.62,
    no: 40.38,
  },
  {
    timestamp: 1740333600000,
    yes: 60.47,
    no: 39.53,
  },
  {
    timestamp: 1740355200000,
    yes: 60.76,
    no: 39.24,
  },
  {
    timestamp: 1740376800000,
    yes: 60.62,
    no: 39.38,
  },
  {
    timestamp: 1740398400000,
    yes: 62.75,
    no: 37.25,
  },
  {
    timestamp: 1740420000000,
    yes: 61.43,
    no: 38.57,
  },
  {
    timestamp: 1740441600000,
    yes: 61.17,
    no: 38.83,
  },
  {
    timestamp: 1740463200000,
    yes: 63.77,
    no: 36.23,
  },
  {
    timestamp: 1740484800000,
    yes: 62.27,
    no: 37.73,
  },
  {
    timestamp: 1740506400000,
    yes: 64.69,
    no: 35.31,
  },
  {
    timestamp: 1740528000000,
    yes: 65.25,
    no: 34.75,
  },
  {
    timestamp: 1740549600000,
    yes: 66.56,
    no: 33.44,
  },
  {
    timestamp: 1740571200000,
    yes: 66.62,
    no: 33.38,
  },
  {
    timestamp: 1740592800000,
    yes: 66.7,
    no: 33.3,
  },
  {
    timestamp: 1740614400000,
    yes: 67.04,
    no: 32.96,
  },
  {
    timestamp: 1740636000000,
    yes: 68.2,
    no: 31.8,
  },
  {
    timestamp: 1740657600000,
    yes: 68.52,
    no: 31.48,
  },
  {
    timestamp: 1740679200000,
    yes: 66.22,
    no: 33.78,
  },
  {
    timestamp: 1740700800000,
    yes: 67.93,
    no: 32.07,
  },
  {
    timestamp: 1740722400000,
    yes: 69.99,
    no: 30.01,
  },
  {
    timestamp: 1740744000000,
    yes: 67.84,
    no: 32.16,
  },
  {
    timestamp: 1740765600000,
    yes: 66.16,
    no: 33.84,
  },
  {
    timestamp: 1740787200000,
    yes: 66.41,
    no: 33.59,
  },
  {
    timestamp: 1740808800000,
    yes: 66.94,
    no: 33.06,
  },
  {
    timestamp: 1740830400000,
    yes: 69.33,
    no: 30.67,
  },
  {
    timestamp: 1740852000000,
    yes: 67.23,
    no: 32.77,
  },
  {
    timestamp: 1740873600000,
    yes: 69.87,
    no: 30.13,
  },
  {
    timestamp: 1740895200000,
    yes: 70.5,
    no: 30,
  },
  {
    timestamp: 1740916800000,
    yes: 72.1,
    no: 30,
  },
  {
    timestamp: 1740938400000,
    yes: 69.29,
    no: 30.71,
  },
  {
    timestamp: 1740960000000,
    yes: 66.54,
    no: 33.46,
  },
  {
    timestamp: 1740981600000,
    yes: 69.41,
    no: 30.59,
  },
  {
    timestamp: 1741003200000,
    yes: 69.09,
    no: 30.91,
  },
  {
    timestamp: 1741024800000,
    yes: 70.71,
    no: 30,
  },
  {
    timestamp: 1741046400000,
    yes: 68.45,
    no: 31.55,
  },
  {
    timestamp: 1741068000000,
    yes: 68.47,
    no: 31.53,
  },
  {
    timestamp: 1741089600000,
    yes: 71.04,
    no: 30,
  },
  {
    timestamp: 1741111200000,
    yes: 69.83,
    no: 30.17,
  },
  {
    timestamp: 1741132800000,
    yes: 69.91,
    no: 30.09,
  },
  {
    timestamp: 1741154400000,
    yes: 70.65,
    no: 30,
  },
  {
    timestamp: 1741176000000,
    yes: 68.88,
    no: 31.12,
  },
  {
    timestamp: 1741197600000,
    yes: 68.6,
    no: 31.4,
  },
  {
    timestamp: 1741219200000,
    yes: 68.88,
    no: 31.12,
  },
  {
    timestamp: 1741240800000,
    yes: 71.34,
    no: 30,
  },
  {
    timestamp: 1741262400000,
    yes: 70.22,
    no: 30,
  },
  {
    timestamp: 1741284000000,
    yes: 71.5,
    no: 30,
  },
  {
    timestamp: 1741305600000,
    yes: 73.64,
    no: 30,
  },
  {
    timestamp: 1741327200000,
    yes: 74.48,
    no: 30,
  },
  {
    timestamp: 1741348800000,
    yes: 76.85,
    no: 30,
  },
  {
    timestamp: 1741370400000,
    yes: 77.22,
    no: 30,
  },
  {
    timestamp: 1741392000000,
    yes: 79.86,
    no: 30,
  },
  {
    timestamp: 1741413600000,
    yes: 78.54,
    no: 30,
  },
  {
    timestamp: 1741435200000,
    yes: 80,
    no: 30,
  },
  {
    timestamp: 1741456800000,
    yes: 78.89,
    no: 30,
  },
  {
    timestamp: 1741478400000,
    yes: 76.58,
    no: 30,
  },
  {
    timestamp: 1741500000000,
    yes: 74.46,
    no: 30,
  },
  {
    timestamp: 1741521600000,
    yes: 76.97,
    no: 30,
  },
  {
    timestamp: 1741543200000,
    yes: 79.2,
    no: 30,
  },
  {
    timestamp: 1741564800000,
    yes: 79.47,
    no: 30,
  },
  {
    timestamp: 1741586400000,
    yes: 78.41,
    no: 30,
  },
  {
    timestamp: 1741608000000,
    yes: 80,
    no: 30,
  },
  {
    timestamp: 1741629600000,
    yes: 78.96,
    no: 30,
  },
  {
    timestamp: 1741651200000,
    yes: 78.13,
    no: 30,
  },
  {
    timestamp: 1741672800000,
    yes: 79.37,
    no: 30,
  },
  {
    timestamp: 1741694400000,
    yes: 80,
    no: 30,
  },
  {
    timestamp: 1741716000000,
    yes: 79.72,
    no: 30,
  },
]

export const comments = [
  {
    id: 1,
    username: "Shekel",
    avatar: "/images/shekel-avatar.png",
    vote: "5.1k Everton",
    voteOutcome: true,
    timeAgo: "21 hour ago",
    content: "Let's go Everton! 💙🔥 Time to make history",
    likes: 1,
    replies: [
      {
        id: 2,
        username: "Tommy.Vercetti",
        avatar: "/images/tommy-avatar.png",
        vote: "1.2k Arsenal",
        voteOutcome: false,
        timeAgo: "21 hour ago",
        content: "@Shekel Yea I bet in 10 Schmeckles you would like that",
        likes: 0,
      },
    ],
  },
  {
    id: 3,
    username: "Knure",
    avatar: "/images/knure-avatar.png",
    timeAgo: "21 hour ago",
    content: "I'm backing Arsenal, Everton has no chance!!",
    likes: 1,
  },
]

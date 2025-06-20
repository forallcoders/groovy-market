export const positionsData = [
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 12,
      shares: 391,
    },
    latest: 100,
    position: 39.10,
    current: {
      value: 391.00,
      percentage: 900,
    },
    toGet: 391.00,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: false,
      price: 10,
      shares: 391,
    },
    latest: 110,
    position: 39.10,
    current: {
      value: -391.00,
      percentage: -123,
    },
    toGet: 0,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 10,
      shares: 391,
    },
    latest: 100,
    position: 69.10,
    current: {
      value: 291.00,
      percentage: 900,
    },
    toGet: 391.00,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: false,
      price: 10,
      shares: 391,
    },
    latest: 120,
    position: 38.10,
    current: {
      value: 291.00,
      percentage: 900,
    },
    toGet: 391.00,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 10,
      shares: 391,
    },
    latest: 100,
    position: 49.10,
    current: {
      value: -391.00,
      percentage: -123,
    },
    toGet: 0,
  },
];

export const openOrdersData = [
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 12,
      shares: 391,
    },
    latest: 100,
    position: 39.10,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: false,
      price: 10,
      shares: 391,
    },
    latest: 110,
    position: 39.10,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 10,
      shares: 391,
    },
    latest: 100,
    position: 69.10,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: false,
      price: 10,
      shares: 391,
    },
    latest: 120,
    position: 38.10,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 10,
      shares: 391,
    },
    latest: 100,
    position: 49.10,
  },
];

export const activityData = [
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 12,
      shares: 391,
    },
    latest: 100,
    position: 39.10,
    current: {
      value: 391.00,
      percentage: 900,
    },
    toGet: 391.00,
    claim: 'link-to-claim.fake',
    share: 'link-to-share.fake'
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: false,
      price: 10,
      shares: 391,
    },
    latest: 110,
    position: 39.10,
    current: {
      value: -391.00,
      percentage: -123,
    },
    toGet: 0,
    share: 'link-to-share.fake'
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 10,
      shares: 391,
    },
    latest: 100,
    position: 69.10,
    current: {
      value: 291.00,
      percentage: 900,
    },
    toGet: 391.00,
    claim: 'link-to-claim.fake',
    share: 'link-to-share.fake'
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: false,
      price: 10,
      shares: 391,
    },
    latest: 120,
    position: 38.10,
    current: {
      value: 291.00,
      percentage: 900,
    },
    toGet: 391.00,
  },
  {
    market: {
      description: "BTC Price $1,000,000 by 2026",
      image: "/images/btc.png",
    },
    positionDetails: {
      value: true,
      price: 10,
      shares: 391,
    },
    latest: 100,
    position: 49.10,
    current: {
      value: -391.00,
      percentage: -123,
    },
    toGet: 0,
  },
];

export const histoyData = [
  {
    type: 'deposit',
    amount: {
      logo: '/icons/dolar-avatar.svg',
      value: '250 USDC',
      type: 'Ethereum network',
      hash: '0x91500ceaf22b0bd202a7cd53da0ac79dcfe0e6190613739669cafb1d69831f65'
    },
    date: new Date(),
    status: 'completed'
  },
  {
    type: 'withdraw',
    amount: {
      logo: '/icons/dolar-avatar.svg',
      value: '250 USDC',
      type: 'Ethereum network',
      hash: '0x91500ceaf22b0bd202a7cd53da0ac79dcfe0e6190613739669cafb1d69831f65'
    },
    date: new Date(),
    status: 'error'
  },
  {
    type: 'deposit',
    amount: {
      logo: '/icons/dolar-avatar.svg',
      value: '250 USDC',
      type: 'Ethereum network',
      hash: '0x91500ceaf22b0bd202a7cd53da0ac79dcfe0e6190613739669cafb1d69831f65'
    },
    date: new Date(),
    status: 'completed'
  },
  {
    type: 'withdraw',
    amount: {
      logo: '/icons/dolar-avatar.svg',
      value: '250 USDC',
      type: 'Ethereum network',
      hash: '0x91500ceaf22b0bd202a7cd53da0ac79dcfe0e6190613739669cafb1d69831f65'
    },
    date: new Date(),
    status: 'pending'
  },

];
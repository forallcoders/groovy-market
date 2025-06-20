"use client"

import DynamicMarketsList from "../components/dynamic-list"

const categories = ["All", "Sports", "Crypto", "Latest", "Trending"]

export default function HomePage() {
  return (<DynamicMarketsList category="all" displayMode="grid" />)
}

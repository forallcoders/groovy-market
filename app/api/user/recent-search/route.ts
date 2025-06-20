import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { userSearchHistoryTable } from "@/lib/db/schema";
import { db as userDB } from "@/lib/userDB/client";
import { usersTable } from "@/lib/userDB/schema";
import { and, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query");
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    console.log({ session });
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "No results saved" });
    }
    const [user] = await userDB
      .select()
      .from(usersTable)
      .where(eq(usersTable.dynamicId, session.user.id));
    console.log({ user });
    if (!user || !user.proxyWallet) {
      return NextResponse.json({ message: "No results saved" });
    }
    await db.insert(userSearchHistoryTable).values({
      userAddress: user.proxyWallet,
      searchQuery: query,
    });
    return NextResponse.json(
      { message: "Search history updated" },
      { status: 200 }
    );
  } catch (error) {
    console.log({ error });
    return NextResponse.json({ message: "No results saved" });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ recentSearches: [] });
    }
    const [user] = await userDB
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email));
    if (!user || !user.proxyWallet) {
      return NextResponse.json({ recentSearches: [] });
    }
    const recentSearches = await db
      .select()
      .from(userSearchHistoryTable)
      .where(eq(userSearchHistoryTable.userAddress, user.proxyWallet))
      .orderBy(desc(userSearchHistoryTable.createdAt))
      .limit(3);
    return NextResponse.json({ recentSearches });
  } catch (err) {
    return NextResponse.json({ recentSearches: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const [user] = await userDB
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email));
    if (!user || !user.proxyWallet) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await db
      .delete(userSearchHistoryTable)
      .where(
        and(
          eq(userSearchHistoryTable.userAddress, user.proxyWallet),
          eq(userSearchHistoryTable.searchQuery, query)
        )
      );
    return NextResponse.json(
      { message: "Search history deleted" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

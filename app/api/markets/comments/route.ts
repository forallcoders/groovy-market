import { getAuthenticatedUser } from "@/lib/auth/auth-utils";
import { db } from "@/lib/userDB/client";
import { commentsTable, usersTable } from "@/lib/userDB/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { comment, marketId } = await req.json();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }
  await db.insert(commentsTable).values({
    userId: user.id,
    comment,
    marketId,
  });
  return NextResponse.json({ success: true, message: "Comment added" });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get("marketId");
    if (!marketId) {
      return NextResponse.json(
        { success: false, message: "Market ID is required" },
        { status: 400 }
      );
    }
    const comments = await db
      .select()
      .from(commentsTable)
      .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.marketId, marketId))
      .orderBy(desc(commentsTable.createdAt));

    if (comments.length === 0) {
      return NextResponse.json([]);
    }

    const mappedComments = comments.map((commentWithUser) => {
      return {
        id: commentWithUser.comments.id,
        comment: commentWithUser.comments.comment,
        createdAt: commentWithUser.comments.createdAt,
        userId: commentWithUser.users_table?.id,
        username: commentWithUser.users_table?.username,
        avatar: commentWithUser.users_table?.avatar,
      };
    });

    return NextResponse.json(mappedComments);
  } catch (error) {
    console.log({ error });
    return NextResponse.json([]);
  }
}

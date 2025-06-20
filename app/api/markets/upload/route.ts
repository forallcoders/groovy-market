import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { uploadMarketImagesToS3 } from "@/lib/aws/upload-to-s3"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }
  const formData = await req.formData()
  const file = formData.get("file") as File
  const userId = formData.get("userId") as string
  const marketName = formData.get("marketName") as string

  if (!file || !userId) {
    return NextResponse.json(
      { error: "Missing file or userId" },
      { status: 400 }
    )
  }

  try {
    const url = await uploadMarketImagesToS3(
      file,
      userId,
      marketName,
      file.name
    )
    return NextResponse.json({ success: true, url })
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

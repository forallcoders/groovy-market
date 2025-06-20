import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { uploadAvatarImagesToS3 } from "@/lib/aws/upload-to-s3"

import { dynamicClient } from "@/lib/dynamic/client"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    )
  }

  const { data } = await dynamicClient.get(
    `/environments/${process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID}/users/${user.dynamicId}`
  )

  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const fileName = `avatar-${Date.now()}-${file.name}`
  const avatarUrl = await uploadAvatarImagesToS3(
    file,
    user.dynamicId!,
    fileName
  )

  return NextResponse.json({ url: avatarUrl }, { status: 200 })
}

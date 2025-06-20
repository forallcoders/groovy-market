import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3Client = new S3Client([
  {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  },
])

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function uploadMarketImagesToS3(
  file: File,
  userId: string,
  marketName: string,
  fileName: string
): Promise<string> {
  try {
    const safeMarketName = slugify(marketName)
    const key = `${userId}/${safeMarketName}/${fileName}`

    const fileBuffer = await file.arrayBuffer()

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_MARKETS_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    })

    const res = await s3Client.send(command)
    console.log("Uploaded profile image to S3:", res)

    return `https://${process.env.AWS_MARKETS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  } catch (error) {
    console.error("Error uploading profile image to S3:", error)
    throw new Error("Failed to upload profile image to S3")
  }
}
export async function uploadAvatarImagesToS3(
  file: File,
  userId: string,
  fileName: string
): Promise<string> {
  try {
    const key = `${userId}/${fileName}`

    const fileBuffer = await file.arrayBuffer()

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_USERS_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    })

    const res = await s3Client.send(command)
    console.log("Uploaded profile image to S3:", res)

    return `https://${process.env.AWS_USERS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  } catch (error) {
    console.error("Error uploading profile image to S3:", error)
    throw new Error("Failed to upload profile image to S3")
  }
}

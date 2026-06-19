import { S3Client } from "@aws-sdk/client-s3"

// Cloudflare R2 is S3-compatible. We talk to it through the AWS S3 SDK pointed
// at the R2 endpoint. See https://developers.cloudflare.com/r2/api/s3/api/
const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

export const R2_BUCKET = process.env.R2_BUCKET || ""

// Public base URL used to build the returned asset URL, e.g.
// https://pub-<hash>.r2.dev  or a custom domain like https://cdn.example.com
export const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "")

export function isR2Configured() {
  return Boolean(accountId && accessKeyId && secretAccessKey && R2_BUCKET && R2_PUBLIC_BASE_URL)
}

const r2 = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials:
    accessKeyId && secretAccessKey
      ? { accessKeyId, secretAccessKey }
      : undefined,
})

export default r2

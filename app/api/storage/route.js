// app/api/storage/route.js
import { s3Client } from "@/lib/s3";
import { 
  ListObjectsV2Command, 
  DeleteObjectCommand, 
  PutObjectCommand, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const BUCKET = process.env.S3_BUCKET;

// 1. GET: List Files & Folders
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") || "";

  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: "/",
    });

    const data = await s3Client.send(command);

    // Extract Folders
    const folders = (data.CommonPrefixes || []).map((p) => ({
      name: p.Prefix,
      displayName: p.Prefix.replace(prefix, "").replace("/", ""),
    }));

    // Extract Files
    const files = await Promise.all(
      (data.Contents || [])
        .filter((f) => f.Key !== prefix)
        .map(async (f) => {
          // Generate thumbnail/preview URL
          const getCmd = new GetObjectCommand({ Bucket: BUCKET, Key: f.Key });
          const url = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });

          return {
            key: f.Key,
            name: f.Key.replace(prefix, ""),
            size: f.Size,
            lastModified: f.LastModified, // Passed as ISO string automatically by AWS SDK
            url: url,
            type: f.Key.split('.').pop().toLowerCase()
          };
        })
    );

    return NextResponse.json({ folders, files });
  } catch (error) {
    console.error("❌ R2 CONNECTION ERROR:", error); 
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Generate Presigned URL for Upload
export async function POST(request) {
  const { filename, contentType } = await request.json();

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Remove a file
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


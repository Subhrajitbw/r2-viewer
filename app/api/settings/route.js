import { s3Client } from "@/lib/s3";
import { 
  GetBucketCorsCommand, 
  PutBucketCorsCommand 
} from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const BUCKET = process.env.S3_BUCKET;

// GET: Fetch current CORS rules
export async function GET() {
  try {
    const command = new GetBucketCorsCommand({ Bucket: BUCKET });
    const data = await s3Client.send(command);
    return NextResponse.json({ rules: data.CORSRules || [] });
  } catch (error) {
    // If no CORS is set, AWS throws a specific error. We return empty array.
    if (error.name === "NoSuchCORSConfiguration") {
      return NextResponse.json({ rules: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update CORS rules
export async function POST(request) {
  const { rules } = await request.json();

  try {
    const command = new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: rules
      }
    });

    await s3Client.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
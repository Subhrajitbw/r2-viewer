// lib/s3.js
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  // THESE TWO LINES ARE CRITICAL FOR R2:
  forcePathStyle: true, // Prevents using bucket.endpoint structure
  checksumComputationMode: "OFF", // Skips checksums which R2 sometimes handles differently
});
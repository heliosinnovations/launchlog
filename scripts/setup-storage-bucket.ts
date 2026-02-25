/**
 * Setup script for creating the project-screenshots storage bucket in Supabase.
 *
 * This script creates a storage bucket with:
 * - Public read access (anyone can view screenshots)
 * - Authenticated write access (only logged-in users can upload)
 *
 * Run with: npx ts-node scripts/setup-storage-bucket.ts
 * Or: npx tsx scripts/setup-storage-bucket.ts
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "project-screenshots";

async function setupStorageBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing required environment variables:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL");
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Setting up storage bucket: ${BUCKET_NAME}`);

  // Check if bucket already exists
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError.message);
    process.exit(1);
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (bucketExists) {
    console.log(`Bucket "${BUCKET_NAME}" already exists.`);
  } else {
    // Create the bucket with public access
    const { data, error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true, // Public read access
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
        ],
        fileSizeLimit: 5 * 1024 * 1024, // 5MB max file size
      },
    );

    if (createError) {
      console.error("Error creating bucket:", createError.message);
      process.exit(1);
    }

    console.log(`Bucket "${BUCKET_NAME}" created successfully!`);
  }

  // Note: RLS policies for storage need to be created via SQL
  // The SQL policy is included in the migration file
  console.log("");
  console.log(
    "IMPORTANT: Storage RLS policies must be configured in Supabase Dashboard:",
  );
  console.log("");
  console.log("1. Go to Storage > Policies in Supabase Dashboard");
  console.log(
    '2. Create the following policies for the "project-screenshots" bucket:',
  );
  console.log("");
  console.log("Policy 1: Public Read Access");
  console.log('  - Name: "Public read access"');
  console.log("  - Allowed operation: SELECT");
  console.log("  - Target roles: (leave empty for all)");
  console.log("  - Policy definition: true");
  console.log("");
  console.log("Policy 2: Authenticated Write Access");
  console.log('  - Name: "Authenticated users can upload"');
  console.log("  - Allowed operation: INSERT");
  console.log("  - Target roles: authenticated");
  console.log("  - Policy definition: true");
  console.log("");
  console.log("Policy 3: Authenticated Update Access");
  console.log('  - Name: "Authenticated users can update"');
  console.log("  - Allowed operation: UPDATE");
  console.log("  - Target roles: authenticated");
  console.log("  - Policy definition: true");
  console.log("");
  console.log("Policy 4: Authenticated Delete Access");
  console.log('  - Name: "Authenticated users can delete"');
  console.log("  - Allowed operation: DELETE");
  console.log("  - Target roles: authenticated");
  console.log("  - Policy definition: true");
  console.log("");
  console.log("Done!");
}

setupStorageBucket().catch(console.error);

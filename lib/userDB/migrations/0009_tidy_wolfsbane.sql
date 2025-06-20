-- Step 1: Drop the default value if it exists (optional, but recommended)
ALTER TABLE "pregen_wallets" ALTER COLUMN "id" DROP DEFAULT;

-- Step 2: Convert the column to UUID using the USING clause
ALTER TABLE "pregen_wallets" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;

-- Step 3: Set the default value to gen_random_uuid()
ALTER TABLE "pregen_wallets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Step 4: Drop the email column
ALTER TABLE "pregen_wallets" DROP COLUMN "email";
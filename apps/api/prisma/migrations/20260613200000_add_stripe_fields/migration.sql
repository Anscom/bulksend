-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "stripe_customer_id" TEXT,
ADD COLUMN "stripe_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripe_customer_id_key" ON "workspaces"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripe_subscription_id_key" ON "workspaces"("stripe_subscription_id");

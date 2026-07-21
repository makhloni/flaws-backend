-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierBookedAt" TIMESTAMP(3),
ADD COLUMN     "courierStatus" TEXT,
ADD COLUMN     "courierWaybillId" TEXT;

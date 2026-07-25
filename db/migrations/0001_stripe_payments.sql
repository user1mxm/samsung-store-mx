ALTER TABLE `orders`
  ADD COLUMN `paymentStatus` enum('unpaid','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  ADD COLUMN `stripeCheckoutSessionId` varchar(255) NULL,
  ADD COLUMN `stripePaymentIntentId` varchar(255) NULL,
  ADD UNIQUE INDEX `orders_stripeCheckoutSessionId_unique` (`stripeCheckoutSessionId`);

-- Apply before deploying the orders service, after backup and schema review.
-- Historical orders did not reserve stock; leave them at 0.
ALTER TABLE orders ADD COLUMN inventoryReserved INT NOT NULL DEFAULT 0;

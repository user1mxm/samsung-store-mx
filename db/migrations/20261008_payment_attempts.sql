CREATE TABLE paymentAttempts (
  id VARCHAR(36) PRIMARY KEY,
  userId BIGINT UNSIGNED NOT NULL,
  requestKey VARCHAR(36) NOT NULL,
  inputHash VARCHAR(64) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  orderId BIGINT UNSIGNED NULL,
  snapshot JSON NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'creating',
  sessionId VARCHAR(255) NULL,
  checkoutUrl TEXT NULL,
  settlementId VARCHAR(255) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_request (userId, requestKey),
  UNIQUE KEY provider_settlement (provider, settlementId),
  UNIQUE KEY attempt_order (orderId)
) ENGINE=InnoDB;
CREATE TABLE paymentEvents (
  provider VARCHAR(20) NOT NULL,
  eventId VARCHAR(255) NOT NULL,
  attemptId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, eventId)
) ENGINE=InnoDB;

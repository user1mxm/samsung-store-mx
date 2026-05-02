import mysql from 'mysql2/promise';

async function createTables() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const conn = await mysql.createConnection(url);
  
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      referrerId BIGINT UNSIGNED,
      referralCode VARCHAR(20) NOT NULL UNIQUE,
      level INT DEFAULT 1 NOT NULL,
      totalEarnings DECIMAL(12,2) DEFAULT '0.00',
      totalNetworkSales DECIMAL(12,2) DEFAULT '0.00',
      networkSize INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY referrals_userId_unique (userId)
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS commissions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      fromUserId BIGINT UNSIGNED NOT NULL,
      orderId BIGINT UNSIGNED NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      level INT NOT NULL,
      percentage DECIMAL(5,2) NOT NULL,
      status ENUM('pending','paid','cancelled') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      userId BIGINT UNSIGNED NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      method VARCHAR(50) NOT NULL,
      accountInfo TEXT,
      status ENUM('pending','processing','completed','rejected') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processedAt TIMESTAMP NULL
    )
  `);

  console.log('Tables referrals, commissions, withdrawals created successfully!');
  await conn.end();
}

createTables().catch(console.error);

import { db } from './db';
import { MemStorage } from './storage';
import { 
  users, 
  sajuAnalyses, 
  servicePrices, 
  reviews, 
  dailyFortunes,
  adminUsers,
  coinTransactions 
} from '@shared/schema';

async function migrateData() {
  console.log('Starting data migration from MemStorage to PostgreSQL...');
  
  const memStorage = new MemStorage();
  
  try {
    // Migrate users
    console.log('Migrating users...');
    const allUsers = await memStorage.getAllUsers();
    for (const user of allUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }
    console.log(`Migrated ${allUsers.length} users`);

    // Migrate saju analyses
    console.log('Migrating saju analyses...');
    const allAnalyses = await memStorage.getAllAnalyses();
    for (const analysis of allAnalyses) {
      await db.insert(sajuAnalyses).values(analysis).onConflictDoNothing();
    }
    console.log(`Migrated ${allAnalyses.length} saju analyses`);

    // Migrate service prices
    console.log('Migrating service prices...');
    const allServicePrices = await memStorage.getServicePrices();
    for (const price of allServicePrices) {
      await db.insert(servicePrices).values(price).onConflictDoNothing();
    }
    console.log(`Migrated ${allServicePrices.length} service prices`);

    // Migrate reviews
    console.log('Migrating reviews...');
    const allReviews = await memStorage.getReviews();
    for (const review of allReviews) {
      await db.insert(reviews).values(review).onConflictDoNothing();
    }
    console.log(`Migrated ${allReviews.length} reviews`);

    // Migrate coin transactions
    console.log('Migrating coin transactions...');
    const allTransactions = await memStorage.getCoinTransactions(1); // Pass demo user ID
    for (const transaction of allTransactions) {
      await db.insert(coinTransactions).values(transaction).onConflictDoNothing();
    }
    console.log(`Migrated ${allTransactions.length} coin transactions`);

    // Migrate daily fortunes
    console.log('Migrating daily fortunes...');
    const allFortunes = await memStorage.getAllDailyFortunes();
    for (const fortune of allFortunes) {
      await db.insert(dailyFortunes).values(fortune).onConflictDoNothing();
    }
    console.log(`Migrated ${allFortunes.length} daily fortunes`);

    console.log('Data migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  migrateData()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateData };
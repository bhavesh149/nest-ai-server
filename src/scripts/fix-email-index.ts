import { MongoClient } from 'mongodb';
import { databaseConfig } from '../config/configuration';

async function fixEmailIndex() {
  const config = databaseConfig();
  const client = new MongoClient(config.database.uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('ai-chat-platform');
    const usersCollection = db.collection('users');

    // Check existing indexes
    const indexes = await usersCollection.indexes();
    console.log('Existing indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the problematic email index if it exists
    try {
      await usersCollection.dropIndex('email_1');
      console.log('✅ Dropped existing email_1 index');
    } catch (error) {
      console.log('ℹ️ email_1 index does not exist or already dropped');
    }

    // Create new sparse index for email
    try {
      await usersCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          sparse: true, 
          name: 'email_1_sparse' 
        }
      );
      console.log('✅ Created new sparse email index');
    } catch (error) {
      console.log('⚠️ Error creating email index:', error.message);
    }

    // Ensure mobile number index exists
    try {
      await usersCollection.createIndex(
        { mobileNumber: 1 }, 
        { 
          unique: true, 
          name: 'mobileNumber_1' 
        }
      );
      console.log('✅ Ensured mobile number index exists');
    } catch (error) {
      console.log('ℹ️ Mobile number index already exists');
    }

    // Clean up any duplicate null email entries
    const duplicateNullEmails = await usersCollection.find({ email: null }).toArray();
    if (duplicateNullEmails.length > 1) {
      console.log(`Found ${duplicateNullEmails.length} users with null email`);
      
      // Keep the first one, update others to undefined
      for (let i = 1; i < duplicateNullEmails.length; i++) {
        await usersCollection.updateOne(
          { _id: duplicateNullEmails[i]._id },
          { $unset: { email: 1 } }
        );
      }
      console.log('✅ Cleaned up duplicate null email entries');
    }

    console.log('✅ Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  fixEmailIndex()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { fixEmailIndex };

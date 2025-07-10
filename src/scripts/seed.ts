import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../database/seed.service';

async function runSeeder() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    const command = process.argv[2];
    
    switch (command) {
      case 'seed':
        await seedService.seedDatabase();
        break;
      case 'clear':
        await seedService.clearDatabase();
        break;
      default:
        console.log('Available commands:');
        console.log('  npm run seed:db -- seed   # Seed the database with sample data');
        console.log('  npm run seed:db -- clear  # Clear all data from the database');
        break;
    }
  } catch (error) {
    console.error('Seeder error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeeder();

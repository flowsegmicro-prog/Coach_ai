import 'dotenv/config';
import { prisma } from '../src/db/client.js';
import { seedDemo, SEED_EMAIL, SEED_PASSWORD } from '../src/services/seed.service.js';

async function main() {
  // eslint-disable-next-line no-console
  console.log('[seed] resetting demo user...');
  const result = await seedDemo();
  // eslint-disable-next-line no-console
  console.log(
    `[seed] created ${result.sessionsCreated} sessions for ${SEED_EMAIL} (password: ${SEED_PASSWORD})`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

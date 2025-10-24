import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: [
    './src/lib/db/schema.ts',
    './src/lib/db/contract-schema.ts',
    './src/lib/db/contacts-schema.ts',
    './src/lib/db/email-schema.ts',
    './src/lib/db/payment-schema.ts',
    './src/lib/db/project-folders-schema.ts',
    './src/lib/db/project-team-schema.ts',
    './src/lib/db/schedule-schema.ts',
    './src/lib/db/task-schema.ts',
    './src/lib/db/xrp-schema.ts',
    './src/lib/db/saved-filters-schema.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

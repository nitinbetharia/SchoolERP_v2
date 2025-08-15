import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

let server: any;

beforeAll(async () => {
  process.env.PORT = process.env.PORT || '3000';
  const mod = await import('../src/server');
  server = mod.default;
});

afterAll(async () => {
  if (server && server.close) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

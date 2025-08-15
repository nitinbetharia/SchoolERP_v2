import dotenv from 'dotenv';
import path from 'path';
import { app } from './app';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const PORT = Number(process.env.PORT || 3000);

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default server;

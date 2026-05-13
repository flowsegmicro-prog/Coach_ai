import 'dotenv/config';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[coach-ai] backend listening on http://localhost:${PORT}`);
});

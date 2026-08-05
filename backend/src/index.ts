import { createApp } from './app';
import { env } from './config/env';
import connectDB from './config/db';

const app = createApp();

connectDB().then(() => {
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
});

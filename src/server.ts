import app from './app';
import { env } from './config/env';
import { connectDatabase } from './database';

const start = async () => {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void start();

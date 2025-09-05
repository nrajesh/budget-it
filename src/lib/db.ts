import postgres from 'postgres';

// Ensure VITE_DATABASE_URL is set in your environment variables
// For local development, you can add it to a .env file (e.g., VITE_DATABASE_URL="postgres://user:password@host:port/database")
// For deployment, set it in your hosting provider's environment settings.
const databaseUrl = import.meta.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('VITE_DATABASE_URL is not set. Please provide your Neon database connection string.');
}

// Initialize the PostgreSQL client
const sql = postgres(databaseUrl, {
  ssl: 'require', // Neon requires SSL
});

export default sql;
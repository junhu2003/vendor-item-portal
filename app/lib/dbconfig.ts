
export const dbconfig = {
    user: process.env.DB_USER,      // SQL Server username
    password: process.env.DB_PASS,  // SQL Server password
    server: process.env.DB_HOST,    // SQL Server hostname or IP
    database: process.env.DB_NAME,  // Database name
    options: {
      encrypt: true,   // Use encryption (recommended for Azure)
      trustServerCertificate: true, // Use this if you're on a local dev machine
    },
  };
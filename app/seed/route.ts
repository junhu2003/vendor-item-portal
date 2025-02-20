import bcryptjs from 'bcryptjs';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const config = {
  user: process.env.DB_USER,      // SQL Server username
  password: process.env.DB_PASS,  // SQL Server password
  server: process.env.DB_HOST,    // SQL Server hostname or IP
  database: process.env.DB_NAME,  // Database name
  options: {
    encrypt: true,   // Use encryption (recommended for Azure)
    trustServerCertificate: true, // Use this if you're on a local dev machine
  },
};

const sql = require('mssql');
await sql.connect(config);

async function seedUsers() {
  
  await sql.query`
    CREATE TABLE dbo.users (
      id UNIQUEIDENTIFIER PRIMARY KEY default NEWID(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcryptjs.hash(user.password, 10);
      return sql.query`
        INSERT INTO dbo.users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword});
      `;
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {  

  await sql.query`
    CREATE TABLE dbo.invoices (
      id UNIQUEIDENTIFIER PRIMARY KEY default NEWID(),
      customer_id UNIQUEIDENTIFIER NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql.query`
        INSERT INTO dbo.invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date});
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  

  await sql.query`
    CREATE TABLE dbo.customers (
      id UNIQUEIDENTIFIER PRIMARY KEY default NEWID(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql.query`
        INSERT INTO dbo.customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url});
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await sql.query`
    CREATE TABLE dbo.revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql.query`
        INSERT INTO dbo.revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue});
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();
    

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}

'use server';
import { any, z } from 'zod';
import sql from 'mssql';
import bcryptjs from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { dbconfig } from '@/app/lib/dbconfig';
import { User, UserLevel, UserType } from './admin-definitions';

await sql.connect(dbconfig);

export async function getUsers(): Promise<User[]> {
    try {
        const result = await sql.query`SELECT * FROM users`;
        // convert user_type_id, user_level_id to string
        let users: User[] = result.recordset.map((user: any) => {
            return (
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    userTypeId: user.user_type_id.toString(),
                    userLevelId: user.user_level_id.toString(),
                    vendorId: user.vendor_id ? user.vendor_id.toString() : '',
                    storeId: user.store_id ? user.store_id.toString() : '',
                    firstLogin: user.first_login
                }
            );
        })

        return users;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export async function updateUser(user: User): Promise<number> {
    try {
        const result = await sql.query`
            UPDATE users
            SET  name = ${user.name}
                ,email = ${user.email}
                ,password = ${user.password}
                ,user_type_id = ${Number(user.userTypeId)}
                ,user_level_id = ${Number(user.userLevelId)}
                ,vendor_id = ${user.vendorId ? Number(user.vendorId) : null}
                ,store_id = ${user.storeId ? Number(user.storeId) : null}
                ,first_login = ${user.firstLogin}
            WHERE id = ${user.id}
        `;
        return result.rowsAffected[0];
    } catch (error) {
        console.error('Failed to update user level:', error);
        throw new Error('Failed to update user level.');
    }
}

export async function deleteUser(userId: string): Promise<number> {
    try {
        const result = await sql.query`
            DELETE users            
            WHERE id = ${userId}
        `;
        return result.rowsAffected[0];
    } catch (error) {
        console.error('Failed to update user level:', error);
        throw new Error('Failed to update user level.');
    }
}

export async function createUser(user: User): Promise<number> {
    try {
        // new user default password: '123456'
        const hashedPassword = await bcryptjs.hash('123456', 10); 
        const result = await sql.query`
            INSERT INTO users
                (name
                ,email
                ,password
                ,user_type_id
                ,user_level_id
                ,vendor_id
                ,store_id
                ,first_login)
            VALUES
                (${user.name}
                ,${user.email}
                ,${hashedPassword}
                ,${Number(user.userTypeId)}
                ,${Number(user.userLevelId)}
                ,${user.vendorId ? Number(user.vendorId) : null}
                ,${user.storeId ? Number(user.storeId) : null}
                ,${true})
        `;
        return result.rowsAffected[0];
    } catch (error) {
        console.error('Failed to update user level:', error);
        throw new Error('Failed to update user level.');
    }
}

export async function getUserLevels(): Promise<UserLevel[]> {
    try {
        const result = await sql.query`SELECT * FROM user_level`;
        return result.recordset;
    } catch (error) {
        console.error('Failed to fetch user level:', error);
        throw new Error('Failed to fetch user level.');
    }
}

export async function getUserTypes(): Promise<UserType[]> {
    try {
        const result = await sql.query`SELECT * FROM user_type`;
        return result.recordset;
    } catch (error) {
        console.error('Failed to fetch user type:', error);
        throw new Error('Failed to fetch user type.');
    }
}

/*
export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });

      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Missing Fields. Failed to Create Invoice.',
        };
      }

      const { customerId, amount, status } = validatedFields.data;
      const amountInCents = amount * 100;
      const date = new Date().toISOString().split('T')[0];
     
      try {
        await sql.query`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
      } catch(error) {
        console.log(error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
          };
      }
      

      revalidatePath('/dashboard/invoices');
      redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    });

    if (!validatedFields.success) {
    return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Update Invoice.',
    };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
   
    try {
        await sql.query`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
            `;
    } catch (error) {
        console.log(error);
    }    
   
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {

    try {
        await sql.query`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        console.log(error);
    }
    
    revalidatePath('/dashboard/invoices');
  }
*/
'use server'
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User, WebEmployeeJson } from '@/app/lib/definitions';
import { postGetEmployee, postVerifyEmployeePwd } from '@/app/lib/applicationApi';

 
async function getEmployee(userId: string): Promise<WebEmployeeJson | undefined> {
  let webEmp = undefined;  
  await postGetEmployee('563449A5511C45FBAD060D310088AD2E', userId)
    .then((empJson: WebEmployeeJson) => {         
      webEmp = empJson;          
    }).catch((err) => {
      console.error('Failed to fetch user:', err);
      throw new Error('Failed to fetch user.');
    })
  return webEmp;
}
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({
    
    async authorize(credentials) {
      const parsedCredentials = z
        .object({ userid: z.string(), password: z.string() })
        .safeParse(credentials);

        let result = null;
        if (parsedCredentials.success) {      
            const { userid, password } = parsedCredentials.data;
            const webEmp = await getEmployee(userid);
            
            if (!webEmp || !webEmp.employee) {
              result = null;
            } else if (!webEmp.isPwdRequired) {
              const user: User = {
                id: webEmp.employee.employeeID.toString(),
                name: webEmp.employee.displayName,
                email: webEmp.employee.eMail,
                password: '',
              };

              result = user;
            } else {
              await postVerifyEmployeePwd('563449A5511C45FBAD060D310088AD2E', webEmp.employee.employeeID.toString(), password)
                .then((isMatch: boolean) => {
                    if (isMatch) {
                      const user: User = {
                        id: webEmp.employee.employeeID.toString(),
                        name: webEmp.employee.displayName,
                        email: webEmp.employee.eMail,
                        password: password,
                      };
        
                      result = user;
                    }                    
                }).catch((err) => {
                  console.error('Failed to fetch user:', err);
                  throw new Error('Failed to fetch user.');
                })
            }
          }
          return result;
    },
  }),],
});
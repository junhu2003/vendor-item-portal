'use server';
import { any, map, z } from 'zod';
import sql from 'mssql';
import bcryptjs from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { dbconfig } from '@/app/lib/dbconfig';
import { Department, Category, DeptCategories, Item, TaxCode, Brand } from './item-definitions';
import { getDepartments, getALLCategories, getCategoriesByDept, getTaxCodes, getBrands } from './applicationApi';

// temporary set it to make localhost API working
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

await sql.connect(dbconfig);

export async function getItems(): Promise<Item[] | undefined> {   
    
    try {
        const result = await sql.query`SELECT * FROM eItem`;
        if (result.recordset.length > 0) {
            let categories: Category[] = await getALLCategories('563449A5511C45FBAD060D310088AD2E');
            
            // convert user_type_id, user_level_id to string        
            let items: Item[] = result.recordset.map((item: any) => {
                const category = categories.find(x => x.categoryID === item.CategoryID);
                const departmentID = category ? category.departmentID.toString() : '';

                return (
                    {
                        itemID: item.ItemID,
                        departmentID: departmentID,
                        categoryID: item.CategoryID.toString(),
                        primaryUpc: item.PrimaryUpc,
                        itemName: item.ItemName,
                        itemDesc: item.ItemDesc,
                        unitPrice: item.UnitPrice,
                        unitCost: item.UnitCost,
                        taxCodeID: item.TaxCodeID.toString(),
                        itemType: item.ItemType,
                        sts: item.STS,
                        brandID: item.BrandID.toString()
                    }
                );
            });

            return items;
        }

    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }    
}

export async function updateItem(item: Item): Promise<number> {
    try {
        const result = await sql.query`
            UPDATE eItem
            SET  CategoryID = ${item.categoryID}
                ,PrimaryUpc = ${item.primaryUpc}
                ,ItemName = ${item.itemName}
                ,ItemDesc = ${item.itemDesc}
                ,UnitPrice = ${item.unitPrice}
                ,UnitCost = ${item.unitCost}
                ,TaxCodeID = ${item.taxCodeID}
                ,ItemType = ${item.itemType}
                ,STS = ${item.sts}
                ,BrandID = ${item.brandID}
            WHERE ItemID = ${item.itemID}
        `;
        return result.rowsAffected[0];
    } catch (error) {
        console.error('Failed to update user level:', error);
        throw new Error('Failed to update user level.');
    }
}

export async function deleteItem(itemID: number): Promise<number> {
    try {
        const result = await sql.query`
            DELETE eitem
            WHERE ItemID = ${itemID}
        `;
        return result.rowsAffected[0];
    } catch (error) {
        console.error('Failed to update user level:', error);
        throw new Error('Failed to update user level.');
    }
}

export async function createItem(item: Item): Promise<number> {
    try {
        // new user default password: '123456'
        const hashedPassword = await bcryptjs.hash('123456', 10); 
        const result = await sql.query`
            INSERT INTO eitem
                (CategoryID
                ,PrimaryUpc
                ,ItemName
                ,ItemDesc
                ,UnitPrice
                ,UnitCost
                ,TaxCodeID
                ,ItemType
                ,STS
                ,BrandID)
            VALUES
                (${Number(item.categoryID)}
                ,${item.primaryUpc}
                ,${item.itemName}
                ,${item.itemDesc}
                ,${item.unitPrice}
                ,${item.unitCost}
                ,${Number(item.taxCodeID)}
                ,${item.itemType}
                ,${item.sts}
                ,${Number(item.brandID)}
                )
        `;
        return result.rowsAffected[0];
    } catch (error) {
        console.error('Failed to update user level:', error);
        throw new Error('Failed to update user level.');
    }
}

export async function getDeptLabels(publicToken: string): Promise<{label: string, value: string}[]> {
    return new Promise<{label: string, value: string}[]>(async (resolve) => {
        const departments: Department[] = await getDepartments(publicToken);        
        const uniqueList = Array.from(
            new Map(departments.map(dept => [dept.departmentName, {
                label: dept.departmentName,
                value: dept.departmentID.toString()
            }])).values()
        );
        resolve(uniqueList);
    });
}

export async function getCategoryLabels(publicToken: string): Promise<DeptCategories[]> {
    return new Promise<DeptCategories[]>(async (resolve) => {
        const categories: Category[] = await getALLCategories(publicToken);
        const uniqueDeptIds = [...new Set(categories.map(item => item.departmentID))];

        let deptCategories : DeptCategories[] = [];
        uniqueDeptIds.forEach((deptID) => {
            const categoryByDept = categories.filter(x => x.departmentID === deptID);
            const uniqueList = Array.from(
                new Map(categoryByDept.map(category => [category.categoryName, {
                    label: category.categoryName,
                    value: category.categoryID.toString()
                }])).values()
            );

            deptCategories.push({
                departmentID: deptID.toString(),
                categories: uniqueList
            });
        });

        resolve(deptCategories);
    });
}

export async function getTaxCodeLabels(publicToken: string): Promise<{label: string, value: string}[]> {
    return new Promise<{label: string, value: string}[]>(async (resolve) => {
        const taxCodes: TaxCode[] = await getTaxCodes(publicToken);
        const uniqueList = Array.from(
            new Map(taxCodes.map(code => [code.taxCodeName, {
                label: code.taxCodeName,
                value: code.taxCodeID.toString()
            }])).values()
        );
        resolve(uniqueList);
    });
}

export async function getBrandLabels(publicToken: string): Promise<{label: string, value: string}[]> {
    return new Promise<{label: string, value: string}[]>(async (resolve) => {
        const brands: Brand[] = await getBrands(publicToken);
        const uniqueList = Array.from(
            new Map(brands.map(brand => [brand.brandName, {
                label: brand.brandName,
                value: brand.brandID.toString()
            }])).values()
        );
        resolve(uniqueList);
    });
}
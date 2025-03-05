'use server'

import { Department, Category, TaxCode, Brand } from "./item-definitions";

const baseUrl = 'https://localhost:7252'; // 'https://test-sd-api.azurewebsites.net'; // 
const token = '563449A5511C45FBAD060D310088AD2E';



    
export async function postGetEmployee(publicToken: string, userId: string) {
    var reqUrl = baseUrl + '/api/SdWeb/v1/GetEmployee';
    const response = await fetch(reqUrl, { 
        method: 'POST', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }, 
        body: JSON.stringify({
            publicToken: publicToken,
            userId: userId
        })});
    return response.json();
}

export async function postVerifyEmployeePwd(publicToken: string, employeeId: string, password: string) {    
    var reqUrl = baseUrl + '/api/SdWeb/v1/VerifyEmployeePwd';
    const response = await fetch(reqUrl, { 
        method: 'POST', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }, 
        body: JSON.stringify({
            publicToken: publicToken,
            employeeId: employeeId,
            password: password
        })});
    return response.json();
}

export async function getDepartments(publicToken: string): Promise<Department[]> {
    var reqUrl = baseUrl + '/api/SdItem/v1/GetDepartments?publicToken=' + token; // hard coding token for now
    //var reqUrl = baseUrl + '/api/SdItem/v1/GetDepartments?publicToken=' + publicToken;
    const response = await fetch(reqUrl, { 
        method: 'GET', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }});
    return response.json();
}

export async function getALLCategories(publicToken: string): Promise<Category[]> {    
    var reqUrl = baseUrl + '/api/SdItem/v1/GetAllCategories?publicToken=' + token; // hard coding token for now
    //var reqUrl = baseUrl + '/api/SdItem/v1/GetAllCategories?publicToken=' + publicToken;
    const response = await fetch(reqUrl, { 
        method: 'GET', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }});
    return response.json();
}

export async function getCategoriesByDept(publicToken: string, departmentID: string): Promise<Category[]> {    
    var reqUrl = baseUrl + '/api/SdItem/v1/GetCategoriesByDept?publicToken=' + token + '&departmentID=' + departmentID; // hard coding token for now
    //var reqUrl = baseUrl + '/api/SdItem/v1/GetAllCategories?publicToken=' + publicToken + '&departmentID=' + departmentID;
    const response = await fetch(reqUrl, { 
        method: 'GET', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }});
    return response.json();
}

export async function getTaxCodes(publicToken: string): Promise<TaxCode[]> {    
    var reqUrl = baseUrl + '/api/SdItem/v1/GetTaxCodes?publicToken=' + token; // hard coding token for now
    //var reqUrl = baseUrl + '/api/SdItem/v1/GetTaxCodes?publicToken=' + publicToken;
    const response = await fetch(reqUrl, { 
        method: 'GET', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }});
    return response.json();
}

export async function getBrands(publicToken: string): Promise<Brand[]> {    
    var reqUrl = baseUrl + '/api/SdItem/v1/GetBrands?publicToken=' + token; // hard coding token for now
    //var reqUrl = baseUrl + '/api/SdItem/v1/GetBrands?publicToken=' + publicToken;
    const response = await fetch(reqUrl, { 
        method: 'GET', 
        credentials: 'include', 
        mode: 'cors', 
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        }});
    return response.json();
}
'use server'
const baseUrl = 'https://test-sd-api.azurewebsites.net'; // 'https://localhost:7252'; // 
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

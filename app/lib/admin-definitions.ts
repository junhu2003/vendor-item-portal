export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    userTypeId: number;
    userLevelId: number;
    vendorId: number;
    storeId: number;
    firstLogin: boolean;
};

export type UserLevel = {
    id: number;
    name: string;
};

export type UserType = {
    id: number;
    name: string;
};

export type StoreName = {
    id: number;
    storeName: string;
    headOfficeName: string;
    storeToken: string;
    headOfficeToken: string;
}

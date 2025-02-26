export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    userTypeId: string;
    userLevelId: string;
    vendorId: string;
    storeId: string;
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
};

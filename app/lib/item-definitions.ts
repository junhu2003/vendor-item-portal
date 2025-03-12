export type Department = {
    departmentID: number;
    departmentName: string;
    departmentDesc: string;
    departmentCode: string;
    sortLine: number;
    uid: number;
    altDeptIdentifier: string;
    deptSyncCode: string;
};

export type Category = {
    categoryID: number;
    departmentID: number;
    categoryCode: string;
    categoryName: string;
    categoryDesc: string;
    modifierID: number;
    profitMargin: number;
    sortLine: number;
    matrixID: number;
    uid: number;
    isModifier: true;
    expiryAlert: number;
    isRestricted: true;
    altCatIdentifier: string;
    includeInItemSalesOnClosingSlip: true;
    catSyncCode: string;
};

export type TaxCode = {
    taxCodeID: number,
    taxCodeName: string,
    taxCodeDesc: string,
    indicator: string,
    uid: number,
    aiIdentifier: string,
    isRestricted: boolean,
    taxCodeSyncCode: string
}

export type Brand = {
    brandID: number,
    brandName: string,
    brandDesc: string
}

export type ReportCode = {
	reportCodeID: number,
	reportCodeName: string,
	reportCodeDesc: string,
	uid: number,
	reportSyncCode: string
}

export type DeptCategories = {
    departmentID: string,
    categories: { label: string, value: string }[]
}

export type Item = {
    itemID: number;
    departmentID: number;
    categoryID: number;    
    itemName: string;
    itemDesc: string;    
    taxCodeID: number;    
    unitPrice: number;
    unitCost: number;
    sts: string;
    itemType: string;    
    brandID: number;
    barcode: string;
	reportCode: string;
	imageFileName: string;
	imageFileData: string;
};

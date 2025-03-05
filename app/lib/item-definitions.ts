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

export type DeptCategories = {
    departmentID: string,
    categories: { label: string, value: string }[]
}

export type Item = {
    itemID: number;
    departmentID: number;
    categoryID: number;
    parentID: number;
    itemNumber: string;
    itemName: string;
    itemDesc: string;
    uom: string;
    packSize: number;
    inventory: boolean;
    discountable: boolean;
    manualPrice: boolean;
    fractionalQty: boolean;
    accumulatePoints: boolean;
    identifiable: boolean;
    memberOnly: boolean;
    taxCodeID: number;
    alterTaxCodeID: number;
    unitPrice: number;
    unitCost: number;
    sts: string;
    itemType: string;
    tare: number;
    taxExemptCount: number;
    displayMessage: string;
    modifierID: number;
    shelfLife: number;
    receiptNotes: string;
    orderPrinters: string;
    followOrderPrinters: string;
    orderDisplays: string;
    btlDeposit: number;
    ecoFeeID: number;
    uid: number;
    sortLine: number;
    elementID: number;
    minStock: number;
    maxStock: number;
    comboPriceMethod: string;
    printSpec: boolean;
    importedFrom: string;
    aiIdentifier: string;
    aisle: string;
    bin: string;
    availableOnWeb: boolean;
    elementID2: number;
    elementID3: number;
    btlDepositInPrice: boolean;
    btlDepositInCost: boolean;
    ecoFeeInPrice: boolean;
    ecoFeeInCost: boolean;
    itemLabelID: number;
    shelfLabelID: number;
    pointsPromo: number;
    sendToDeliScale: boolean;
    deliScaleLabelNumber: number;
    deliScaleExtraTextNumber: number;
    deliScaleNutritionFactNumber: number;
    facts: string;
    packItemID: number;
    isManualDescription: boolean;
    brandID: number;
    shipSize: number;
    returnTime: number;
    restockingFee: number;
    omniPriceLevelID: number;
    isGCReload: boolean;
    sendToQds: boolean;
    nonPrep: boolean;
    manualTareWeight: boolean;
    shoppingBagItem: boolean;
    forceThreeDecimal: boolean;
    enterQty: boolean;
    unitWeight: number;
    createdDate: Date;
    primaryUpc: string;
    supplierProductCode: string;
    conversionFactor: number;
    scoMessage: string;
    labelDesc: string;
    altIdentifier: string;
    isESL: boolean;
    ageVerification: boolean;
    altDepositID: string;
    isFoodstamp: boolean;
    isWIC: boolean;
    scoSkipBagging: boolean;
    isPrescription: boolean;
    odooListPrice: number;
    itemSyncCode: string;
    scoAllowedVariance: number
};

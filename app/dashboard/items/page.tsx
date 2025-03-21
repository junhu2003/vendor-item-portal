'use client'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)
import { useEffect, useMemo, useState, useRef } from 'react';
import {  
  MantineReactTable,
  // createRow,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_Cell,
  type MRT_TableOptions,
  useMantineReactTable,
} from 'mantine-react-table';
import { ActionIcon, Button, Text, Tooltip, FileInput, MultiSelect, Switch } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconTrash, IconSend, IconFileImport } from '@tabler/icons-react';
import {  
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { DeptCategories, ExtItems, Item, ExtItemResponse, SendItemHistory } from '@/app/lib/item-definitions'; 
import { 
  getItems, 
  getDeptLabels, 
  getCategoryLabels, 
  getTaxCodeLabels, 
  getBrandLabels,
  getReportCodeLabels,
  getItemTypeLabels,
  getItemStatusLabels,
  createNewItem,
  updateItem,
  deleteItem,
  postItemsToSD,
  createSendItemHistory, 
  updateItemByResponse,
  checkBarcodeDuplication,
  checkItemNumberDuplication
} from '@/app/lib/item-data';

export default function Page() {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

  const queryClient = useQueryClient();

  //keep track of rows that have been edited  
  const [editedItems, setEditedItems] = useState<Record<string, Item>>({});  

  const [depts, setDepts] = useState<{ label: string, value: string }[]>([]);
  const [deptCategories, setDeptCategories] = useState<DeptCategories[]>([]);
  const [taxCodes, setTaxCodes] = useState<{ label: string, value: string }[]>([]);
  const [brands, setBrands] = useState<{ label: string, value: string }[]>([]); 
  const [rptCodes, setRptCodes] = useState<{ label: string, value: string }[]>([]); 
  const [itemTypes, setItemTypes] = useState<{ label: string, value: string }[]>([]);
  const [itemStatuses, setItemStatuses] = useState<{ label: string, value: string }[]>([]);

  // manage item temporary switch state
  const [switchtates, setSwitchtates] = useState<{ 
    manualPrice: Boolean, 
    discountable: Boolean, 
    inventory: Boolean,
    availableOnWeb: Boolean,
    btlDepositInPrice: Boolean,
    btlDepositInCost: Boolean,
    ecoFeeInPrice: Boolean,
    ecoFeeInCost: Boolean    
   }[]>([]);
  
  const isSwitched = (cell: MRT_Cell<Item, unknown>, key: string, row: MRT_Row<Item>): Boolean => {
    return switchtates[row.original.itemID] && Object.hasOwn(switchtates[row.original.itemID], key) 
              ? switchtates[row.original.itemID][key] : cell.getValue();
  } 

  const fileInputRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Read file as Base64
      reader.onload = () => resolve(reader.result as string); // Get Base64 string
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleFileChange = async (file: File | null, row: MRT_Row<Item>) => {    
    if (file) {
      const imgStr = await fileToBase64(file);

      setEditedItems({
        ...editedItems,
        [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), 
            imageFileName: file.name, imageFileData: imgStr },
      });
    }    
  };

  const openFileExplorer = (rowId: string) => {    
    fileInputRefs.current[rowId]?.click();
  };

  useEffect(() => {
    
    const fetchData = async () => {
      // retrieve departments
      const deptLabels = await getDeptLabels('token');
      setDepts(deptLabels);

      // retrieve categories
      const cateLabels = await getCategoryLabels('token');
      setDeptCategories(cateLabels);

      // retrieve tax codes
      const codeLabels = await getTaxCodeLabels('token');
      setTaxCodes(codeLabels);

      // retrieve brands
      const brandLabels = await getBrandLabels('token');
      setBrands(brandLabels);

      // retrieve report codes
      const rptCodeLabels = await getReportCodeLabels('token');
      setRptCodes(rptCodeLabels);

      // retrieve item types
      const itemTypeLabels = await getItemTypeLabels();      
      setItemTypes(itemTypeLabels);

      // retrieve item statuses
      const itemStatusLabels = await getItemStatusLabels();
      setItemStatuses(itemStatusLabels);
      
    }
    fetchData();

  }, []);

  //call CREATE hook
  const { mutateAsync: createItem, isPending: isCreatingItem } =
    useCreateItem();
  //call READ hook
  const {
    data: fetchedItems = [],
    isError: isLoadingItemsError,
    isFetching: isFetchingItems,
    isLoading: isLoadingItems,
  } = useGetItems();
  //call UPDATE hook
  const { mutateAsync: updateItems, isPending: isUpdatingItem } =
    useUpdateItems();
  //call DELETE hook
  const { mutateAsync: deleteItem, isPending: isDeletingItem } =
    useDeleteItem();

  //CREATE action
  const handleCreateItem: MRT_TableOptions<Item>['onCreatingRowSave'] = async ({
    row,
    values,
    exitCreatingMode,
  }) => {
    const newValidationErrors = validateItem(values);
    if (Object.values(newValidationErrors).some((error) => !!error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await createItem(editedItems[row.id]);
    exitCreatingMode();
  };

  //UPDATE action
  const handleSaveItems = async () => {
    if (Object.values(validationErrors).some((error) => !!error)) return;
    await updateItems(Object.values(editedItems));
    setEditedItems({});
  };

  //DELETE action
  const openDeleteConfirmModal = (row: MRT_Row<Item>) =>
    modals.openConfirmModal({
      title: 'DELETE ITEM',
      children: (
        <Text>
          Are you sure you want to delete {row.original.itemName}{' '}?
           This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteItem(row.original.itemID.toString()),
    });

//SEND to SD action
const openSendToSDConfirmModal = (row: MRT_Row<Item>) =>
  modals.openConfirmModal({
    title: 'SEND ITEM TO SD',
    children: (
      <Text>
        Are you sure you want to send {row.original.itemName} to SD?        
      </Text>
    ),
    labels: { confirm: 'Send', cancel: 'Cancel' },
    confirmProps: { color: 'green' },
    onConfirm: () => sendItemToSD(row.original),
  });

  const sendItemToSD = async (extItem: Item) => {

    extItem.lastSendDate = extItem.lastSendDate ? new Date(extItem.lastSendDate) : undefined;
    const extItems: ExtItems = {
      publicKey: '563449A5511C45FBAD060D310088AD2E',
      extItems: [extItem]
    };
    const responses: ExtItemResponse[] = await postItemsToSD(extItems);

    responses.forEach((res: ExtItemResponse) => {
      new Promise(async (resolve) => {
        
        const result1 = await updateItemByResponse(res);

        const history: SendItemHistory = {
            id: 0,
            extItemID: res.extItemID,
            action: res.action,
            status: res.status,
            responseMsg: res.message,
            sendUserID: '410544B2-4001-4271-9855-FEC4B6A6442A',
            sendDate: res.sendDate,
        };
        
        const result2 = await createSendItemHistory(history);
        resolve({result1, result2});
      });
    });

    await queryClient.invalidateQueries(['items'])
  }

  const columns = useMemo<MRT_ColumnDef<Item>[]>(    
    () => [      
      {
        accessorKey: 'barcode',
        header: 'Barcode',
        size: 180,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: async (event) => {
            const currentValue = event.currentTarget.value;
            const validationError = await validateBarcodeDuplication(currentValue) 
                ? 'Duplicate Barcodes' 
                : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), barcode: currentValue},
            });
          },
        }),
      },
      {
        accessorKey: 'itemNumber',
        header: 'Item Number',
        size: 180,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: async (event) => {
            const currentValue = event.currentTarget.value;
            const validationError = await validateItemNumberDuplication(currentValue) 
                ? 'Duplicate Barcodes' 
                : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), itemNumber: currentValue},
            });
          },
        }),
      },      
      {
        accessorKey: 'itemName',
        header: 'Name',
        size: 280,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), itemName: event.currentTarget.value },
            });
          },
        }),
      },
      {
        accessorKey: 'itemDesc',
        header: 'Description',
        size: 350,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), itemDesc: event.currentTarget.value },
            });
          },
        }),
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        size: 100,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'number',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), unitPrice: Number(event.currentTarget.value) },
            });
          },
        }),
      },      
      {
        accessorKey: 'unitCost',
        header: 'Unit Cost',
        size: 100,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'number',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), unitCost: Number(event.currentTarget.value) },
            });
          },
        }),
      },
      {
        accessorKey: 'departmentID',
        header: 'Department',
        size: 300,        
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: depts,
          //store edited item in state to be saved later
          onChange: (value: any) =>
            setEditedItems({
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), departmentID: value },
            }),
        }),          
      },      
      {
        accessorKey: 'categoryID',
        header: 'Category',
        size: 600,        
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: deptCategories.find(x => x.departmentID === (editedItems[row.id] ? editedItems[row.id].departmentID : row.original.departmentID.toString()))?.categories,
          //store edited item in state to be saved later
          onChange: (value: any) =>
            setEditedItems({
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), categoryID: value },
            }),
        }),          
      },
      {
        accessorKey: 'taxCodeID',
        header: 'Tax Code',
        size: 100,        
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: taxCodes,          
          //store edited item in state to be saved later
          onChange: (value: any) =>
            setEditedItems({
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), taxCodeID: value },
            }),
        }),          
      },
      {
        accessorKey: 'itemType',
        header: 'Item Type',        
        size: 200,
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: itemTypes,
          //store edited item in state to be saved later
          onChange: (value: any) =>
            setEditedItems({
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), itemType: value },
            }),
        }),
      },
      {
        accessorKey: 'sts',
        header: 'STS',
        size: 180,
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: itemStatuses,
          //store edited item in state to be saved later
          onChange: (value: any) =>
            setEditedItems({
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), sts: value },
            }),
        }),
      },
      {
        accessorKey: 'brandID',
        header: 'Brand',
        size: 250,        
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: brands,
          //store edited Item in state to be saved later
          onChange: (value: any) =>
            setEditedItems({
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), brandID: value },
            }),
        }),          
      },
      {
        accessorKey: "reportCode",
        header: "Report Codes",
        size: 500, 
        enableEditing: false,
        Cell: ({ row }) => {
          const curItem = editedItems[row.id] ? editedItems[row.id] : row.original;
          return (            
            <MultiSelect
              data={rptCodes}
              value={curItem.reportCode ? curItem.reportCode.split(',') : []}
              onChange={(value: any) => {
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(curItem), reportCode: value.join(',')},
                });                
              }}
              placeholder="Select options"
              searchable
              clearable              
            />            
          );
        },        
      },
      {
        accessorKey: "imageFileName",
        header: "File",
        size: 80,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ row }) => {              
          return (
            <>
              <Tooltip label="Select image file">
                <ActionIcon style={{background: 'transparent'}} onClick={() => openFileExplorer(row.id)}>
                  <IconFileImport color='blue' />
                </ActionIcon>
              </Tooltip>
              <FileInput                    
                ref={(el) => (fileInputRefs.current[row.id] = el)}
                placeholder="Select image file"   
                accept="image/png,image/jpeg"               
                onChange={(file) => handleFileChange(file, row)}
                style={{display: 'none'}}
              />
            </>
          );
        },
      },
      {
        accessorKey: 'manualPrice',
        header: 'Manual Price',
        size: 60,        
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'manualPrice', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], manualPrice: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), manualPrice: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'discountable',
        header: 'Discountable',
        size: 60,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'discountable', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], discountable: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), discountable: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'inventory',
        header: 'Track Inventory',
        size: 60,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'inventory', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], inventory: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), inventory: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'availableOnWeb',
        header: 'Available On Web',
        size: 60,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'availableOnWeb', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], availableOnWeb: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), availableOnWeb: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'btlDepositInPrice',
        header: 'Bottle Deposit Included In Price',
        size: 200,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'btlDepositInPrice', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], btlDepositInPrice: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), btlDepositInPrice: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'btlDepositInCost',
        header: 'Bottle Deposit Included In Cost',
        size: 200,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'btlDepositInCost', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], btlDepositInCost: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), btlDepositInCost: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'ecoFeeInPrice',
        header: 'Eco Fee Included In Price',
        size: 200,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'ecoFeeInPrice', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], ecoFeeInPrice: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), ecoFeeInPrice: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'ecoFeeInCost',
        header: 'Eco Fee Included In Cost',
        size: 200,
        enableEditing: false, // Prevent editing for file column
        Cell: ({ cell, row }) => {          
          return (            
            <Switch
              checked={isSwitched(cell, 'ecoFeeInCost', row)}
              onChange={(event: any) => {
                const status = event.currentTarget.checked;
                setSwitchtates({ 
                  ...switchtates, 
                  [row.original.itemID]: {...switchtates[row.original.itemID], ecoFeeInCost: status}
                });                
                setEditedItems({
                  ...editedItems,
                  [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), ecoFeeInCost: status },
                });
              }}
            />
          );
        },        
      },
      {
        accessorKey: 'sdItemID',
        header: 'SD Item ID',
        enableEditing: false,
        size: 100,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',          
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), sdItemID: Number(event.currentTarget.value) },
            });
          },
        }),
      },
      {
        accessorKey: 'lastAction',
        header: 'Action',
        enableEditing: false,
        size: 100,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',          
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), lastAction: event.currentTarget.value },
            });
          },
        }),
      },
      {
        accessorKey: 'lastStatus',
        header: 'Status',
        enableEditing: false,
        size: 100,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',          
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), lastStatus: event.currentTarget.value },
            });
          },
        }),
      },
      {
        accessorKey: 'lastSendDate',
        header: 'Send Date',
        enableEditing: false,
        size: 200,
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'Date',          
          error: validationErrors?.[cell.id],
          //store edited item in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedItems({ 
              ...editedItems,
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), lastSendDate: new Date(event.currentTarget.value) },
            });
          },
        }),
      },
    ],
    [editedItems, validationErrors, depts, deptCategories, taxCodes, brands, rptCodes, itemTypes, itemStatuses],
  );

  const table = useMantineReactTable({
    columns,
    data: fetchedItems,
    createDisplayMode: 'row', // ('modal', and 'custom' are also available)
    editDisplayMode: 'table', // ('modal', 'row', 'cell', and 'custom' are also available)
    enableEditing: true,
    enableRowActions: true,    
    positionActionsColumn: 'last',
    getRowId: (row) => row.itemID ? row.itemID.toString() : undefined,
    mantineToolbarAlertBannerProps: isLoadingItemsError
      ? {
          color: 'red',
          children: 'Error loading data',
        }
      : undefined,
    mantineTableContainerProps: {
      sx: {
        minHeight: '500px',
      },
    },
    onCreatingRowCancel: () => setValidationErrors({}),
    onCreatingRowSave: handleCreateItem,
    renderRowActions: ({ row }) => (
      <div className='flex items-centers space-x-2'>
        <Tooltip label="Delete">
          <ActionIcon style={{background: 'transparent'}} onClick={() => openDeleteConfirmModal(row)}>
            <IconTrash color='red' />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Send to SD">
          <ActionIcon style={{background: 'transparent'}} onClick={() => openSendToSDConfirmModal(row)}>
            <IconSend color='green' />
          </ActionIcon>
        </Tooltip>
      </div>
    ),    
    renderBottomToolbarCustomActions: () => (
      <Button
        color="blue"
        onClick={handleSaveItems}
        disabled={
          Object.keys(editedItems).length === 0 ||
          Object.values(validationErrors).some((error) => !!error)
        }
        loading={isUpdatingItem}
      >
        Save
      </Button>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        onClick={() => {
          table.setCreatingRow(true); //simplest way to open the create row modal with no default values
          //or you can pass in a row object to set default values with the `createRow` helper function
          // table.setCreatingRow(
          //   createRow(table, {
          //     //optionally pass in default values for the new row, useful for nested data or other complex scenarios
          //   }),
          // );
        }}
      >
        Create New Item
      </Button>
    ),
    state: {
      isLoading: isLoadingItems,
      isSaving: isCreatingItem || isUpdatingItem || isDeletingItem,
      showAlertBanner: isLoadingItemsError,
      showProgressBars: isFetchingItems,
    },
  });

  return <MantineReactTable table={table} />;
};

//CREATE hook (post new Item to api)
function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Item) => {
      //send api CREATE request here      
      return await new Promise(async (resolve) => {
        item.createUserID = '410544B2-4001-4271-9855-FEC4B6A6442A';        
        const result = await createNewItem(item);
        resolve(result);          
      });      
    },
    //client side optimistic update
    onMutate: (newItemInfo: Item) => {
      queryClient.setQueryData(
        ['items'],
        (prevItems: any) =>
          [
            ...prevItems,
            {
              ...newItemInfo,
              id: (Math.random() + 1).toString(36).substring(7),
            },
          ] as Item[],
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] }), //refetch Items after mutation, disabled for demo
  });
}

//READ hook (get items from api)
function useGetItems() {
  return useQuery<Item[] | undefined>({
    queryKey: ['items'],
    queryFn: async () => {
      //send api request here      
      return await new Promise(async (resolve, reject) => {
        const items = await getItems();
        resolve(items);
        reject('Fail to fetch all items');
      });
    },
    refetchOnWindowFocus: false,
  });
}

//UPDATE hook (put Items in api)
function useUpdateItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (Items: Item[]) => {
      //send api update request here      
      return await new Promise((resolve) => {
        Items.forEach(async (item) => {
          const result = await updateItem(item);
          resolve(result);  
        });
      });
      
    },
    //client side optimistic update
    onMutate: (newItems: Item[]) => {
      queryClient.setQueryData(
        ['items'],
        (prevItems: any) =>
          prevItems?.map((item: Item) => {
            const newItem = newItems.find((u) => u.itemID === item.itemID);
            return newItem ? newItem : item;
          }),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] }), //refetch Items after mutation, disabled for demo
  });
}

//DELETE hook (delete Item in api)
function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      //send api delete request here      
      return await new Promise(async (resolve) => {        
        const result = await deleteItem(Number(itemId));
        resolve(result);          
      });    
    },
    //client side optimistic update
    onMutate: (itemId: string) => {
      queryClient.setQueryData(
        ['items'],
        (prevItems: any) =>
          prevItems?.filter((item: Item) => item.itemID !== item.itemID),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['items'] }), //refetch Items after mutation, disabled for demo
  });
}

const validateRequired = (value: string) => !!value?.length;
const validateBarcodeDuplication = async (barcode: string) => await checkBarcodeDuplication('token', barcode);
const validateItemNumberDuplication = async (barcode: string) => await checkItemNumberDuplication('token', barcode);
const validateEmail = (email: string) =>
  !!email.length &&
  email
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );

function validateItem(item: Item) {
  return {
    name: !validateRequired(item.itemName)
      ? 'Name is Required'
      : '',    
    //email: !validateEmail(item.email) ? 'Incorrect Email Format' : '',
  };
}
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
  type MRT_TableOptions,
  useMantineReactTable,
} from 'mantine-react-table';
import { ActionIcon, Button, Text, Tooltip, FileInput } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconTrash, IconFile, IconSend } from '@tabler/icons-react';
import {  
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { DeptCategories, Item } from '@/app/lib/item-definitions'; 
import { 
  getItems, 
  getDeptLabels, 
  getCategoryLabels, 
  getTaxCodeLabels, 
  getBrandLabels,
  createItem,
  updateItem,
  deleteItem 
} from '@/app/lib/item-data';

export default function Page() {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  //keep track of rows that have been edited  
  const [editedItems, setEditedItems] = useState<Record<string, Item>>({});

  const [depts, setDepts] = useState<{ label: string, value: string }[]>([]);
  const [deptCategories, setDeptCategories] = useState<DeptCategories[]>([]);
  const [taxCodes, setTaxCodes] = useState<{ label: string, value: string }[]>([]);
  const [brands, setBrands] = useState<{ label: string, value: string }[]>([]); 
  
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
    values,
    exitCreatingMode,
  }) => {
    const newValidationErrors = validateItem(values);
    if (Object.values(newValidationErrors).some((error) => !!error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await createItem(values);
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
    //onConfirm: () => deleteItem(row.original.itemID.toString()),
  });    

  const columns = useMemo<MRT_ColumnDef<Item>[]>(    
    () => [
      {
        accessorKey: 'departmentID',
        header: 'Department',
        size: 300,
        editable: true,
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
        editable: true,
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
        accessorKey: 'barcode',
        header: 'Barcode',
        size: 150,
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
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), barcode: event.currentTarget.value },
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
        size: 100,
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
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), itemType: event.currentTarget.value },
            });
          },
        }),
      },
      {
        accessorKey: 'sts',
        header: 'STS',
        size: 100,
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
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), sts: event.currentTarget.value },
            });
          },
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
        accessorKey: 'reportCode',
        header: 'Report Code',
        size: 100,
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
              [row.id]: { ...(editedItems[row.id] ? editedItems[row.id] : row.original), reportCode: event.currentTarget.value },
            });
          },
        }),
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
                      <IconFile color='blue' />
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
    ],
    [editedItems, validationErrors, depts, deptCategories, taxCodes, brands],
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
        const result = await createItem(item);
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
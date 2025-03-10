'use client'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)
import { useEffect, useMemo, useState } from 'react';
import {
  MantineReactTable,
  // createRow,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
  useMantineReactTable,
} from 'mantine-react-table';
import { ActionIcon, Button, Text, Tooltip, Select, ComboboxItem } from '@mantine/core';
import { ModalsProvider, modals } from '@mantine/modals';
import { IconTrash } from '@tabler/icons-react';
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { type User, type UserType, type UserLevel } from '@/app/lib/admin-definitions'; 
import { getUsers, updateUser, createUser, deleteUser, getUserTypes, getUserLevels } from '@/app/lib/admin-data';
import { number, ZodNumber } from 'zod';

export default function Page() {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  //keep track of rows that have been edited
  const [editedUsers, setEditedUsers] = useState<Record<string, User>>({});

  const [userTypes, setUserTypes] = useState<{ label: string, value: string }[]>([]);
  const [userLevels, setUserLevels] = useState<{ label: string, value: string }[]>([]);

  const retrieveUserTypes = async () => {
    return new Promise<UserType[]>((resolve) => {
      const userTypeList = getUserTypes();
      resolve(userTypeList);
    });
  }

  const retrieveUserLevels = async () => {
    return new Promise<UserType[]>((resolve) => {
      const userLevelList = getUserLevels();
      resolve(userLevelList);
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      // retrieve user types
      const userTypeData = await retrieveUserTypes();      
      let userTypeList: { label: string, value: string }[] = userTypeData.map((c) => {
        return {
          value: c.id.toString(),
          label: c.name,            
        };
      });
      setUserTypes(userTypeList);      

      // retrieve user levels
      const userLevelData = await retrieveUserLevels();
      let userLevelList: { label: string, value: string }[] = userLevelData.map((c) => {
        return {
          value: c.id.toString(),
          label: c.name,            
        };
      });
      setUserLevels(userLevelList);      
    };

    fetchData();
  }, []);

  //call CREATE hook
  const { mutateAsync: createUser, isPending: isCreatingUser } =
    useCreateUser();
  //call READ hook
  const {
    data: fetchedUsers = [],
    isError: isLoadingUsersError,
    isFetching: isFetchingUsers,
    isLoading: isLoadingUsers,
  } = useGetUsers();
  //call UPDATE hook
  const { mutateAsync: updateUsers, isPending: isUpdatingUser } =
    useUpdateUsers();
  //call DELETE hook
  const { mutateAsync: deleteUser, isPending: isDeletingUser } =
    useDeleteUser();

  //CREATE action
  const handleCreateUser: MRT_TableOptions<User>['onCreatingRowSave'] = async ({
    values,
    exitCreatingMode,
  }) => {
    const newValidationErrors = validateUser(values);
    if (Object.values(newValidationErrors).some((error) => !!error)) {
      setValidationErrors(newValidationErrors);
      return;
    }
    setValidationErrors({});
    await createUser(values);
    exitCreatingMode();
  };

  //UPDATE action
  const handleSaveUsers = async () => {
    if (Object.values(validationErrors).some((error) => !!error)) return;
    await updateUsers(Object.values(editedUsers));
    setEditedUsers({});
  };

  //DELETE action
  const openDeleteConfirmModal = (row: MRT_Row<User>) =>
    modals.openConfirmModal({
      title: 'Are you sure you want to delete this user?',
      children: (
        <Text>
          Are you sure you want to delete {row.original.name}{' '}?
           This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteUser(row.original.id),
    });

  const columns = useMemo<MRT_ColumnDef<User>[]>(    
    () => [      
      {
        accessorKey: 'name',
        header: 'Name',
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'text',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited user in state to be saved later
          onBlur: (event) => {            
            const validationError = !validateRequired(event.currentTarget.value)
              ? 'Required'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedUsers({ 
              ...editedUsers,
              [row.id]: { ...(editedUsers[row.id] ? editedUsers[row.id] : row.original), name: event.currentTarget.value },
            });
          },
        }),
      },      
      {
        accessorKey: 'email',
        header: 'Email',
        mantineEditTextInputProps: ({ cell, row }) => ({
          type: 'email',
          required: true,
          error: validationErrors?.[cell.id],
          //store edited user in state to be saved later
          onBlur: (event) => {
            const validationError = !validateEmail(event.currentTarget.value)
              ? 'Invalid Email'
              : undefined;
            setValidationErrors({
              ...validationErrors,
              [cell.id]: validationError,
            });
            setEditedUsers({ 
              ...editedUsers, 
              [row.id]: { ...(editedUsers[row.id] ? editedUsers[row.id] : row.original), email: event.currentTarget.value },
            });
          },
        }),
      },            
      {
        accessorKey: 'userTypeId',
        header: 'User Type',
        editable: true,
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: userTypes,          
          //store edited user in state to be saved later
          onChange: (value: any) =>
            setEditedUsers({
              ...editedUsers,
              [row.id]: { ...(editedUsers[row.id] ? editedUsers[row.id] : row.original), userTypeId: value },
            }),
        }),          
      },      
      {
        accessorKey: 'userLevelId',
        header: 'User Level',
        editable: true,
        editVariant: 'select',
        mantineEditSelectProps: ({ row }) => ({
          data: userLevels,
          //store edited user in state to be saved later
          onChange: (value: any) =>
            setEditedUsers({
              ...editedUsers,
              [row.id]: { ...(editedUsers[row.id] ? editedUsers[row.id] : row.original), userLevelId: value },
            }),
        }),
      },      
    ],
    [editedUsers, validationErrors, userTypes, userLevels],
  );

  const table = useMantineReactTable({
    columns,
    data: fetchedUsers,
    createDisplayMode: 'row', // ('modal', and 'custom' are also available)
    editDisplayMode: 'table', // ('modal', 'row', 'cell', and 'custom' are also available)
    enableEditing: true,
    enableRowActions: true,
    positionActionsColumn: 'last',
    getRowId: (row) => row.id,
    mantineToolbarAlertBannerProps: isLoadingUsersError
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
    onCreatingRowSave: handleCreateUser,
    renderRowActions: ({ row }) => (
      <Tooltip label="Delete">
        <ActionIcon style={{background: 'transparent'}} onClick={() => openDeleteConfirmModal(row)}>
          <IconTrash color='red' />
        </ActionIcon>
      </Tooltip>
    ),
    renderBottomToolbarCustomActions: () => (
      <Button
        color="blue"
        onClick={handleSaveUsers}
        disabled={
          Object.keys(editedUsers).length === 0 ||
          Object.values(validationErrors).some((error) => !!error)
        }
        loading={isUpdatingUser}
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
        Create New User
      </Button>
    ),
    state: {
      isLoading: isLoadingUsers,
      isSaving: isCreatingUser || isUpdatingUser || isDeletingUser,
      showAlertBanner: isLoadingUsersError,
      showProgressBars: isFetchingUsers,
    },
  });

  return <MantineReactTable table={table} />;
};

//CREATE hook (post new user to api)
function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: User) => {
      //send api update request here
      return await new Promise(async (resolve) => {        
        const result = await createUser(user);
        resolve(result);          
      });  
    },
    //client side optimistic update
    onMutate: (newUserInfo: User) => {
      queryClient.setQueryData(
        ['users'],
        (prevUsers: any) =>
          [
            ...prevUsers,
            {
              ...newUserInfo,
              id: (Math.random() + 1).toString(36).substring(7),
            },
          ] as User[],
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }), //refetch users after mutation, disabled for demo
  });
}

//READ hook (get users from api)
function useGetUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      //send api request here      
      return await new Promise(async (resolve, reject) => {
        const users = await getUsers();
        resolve(users);
        reject('Fail to fetch all users');
      });
    },
    refetchOnWindowFocus: false,
  });
}

//UPDATE hook (put users in api)
function useUpdateUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (users: User[]) => {
      //send api update request here
      return await new Promise((resolve) => {
        users.forEach(async (user) => {
          const result = await updateUser(user);
          resolve(result);  
        });
      });      
    },
    //client side optimistic update
    onMutate: (newUsers: User[]) => {
      queryClient.setQueryData(
        ['users'],
        (prevUsers: any) =>
          prevUsers?.map((user: User) => {
            const newUser = newUsers.find((u) => u.id === user.id);
            return newUser ? newUser : user;
          }),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }), //refetch users after mutation, disabled for demo
  });
}

//DELETE hook (delete user in api)
function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      //send api update request here
      return await new Promise(async (resolve) => {        
        const result = await deleteUser(userId);
        resolve(result);          
      });  
    },
    //client side optimistic update
    onMutate: (userId: string) => {
      queryClient.setQueryData(
        ['users'],
        (prevUsers: any) =>
          prevUsers?.filter((user: User) => user.id !== userId),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }), //refetch users after mutation, disabled for demo
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

function validateUser(user: User) {
  return {
    name: !validateRequired(user.name)
      ? 'Name is Required'
      : '',    
    email: !validateEmail(user.email) ? 'Incorrect Email Format' : '',
  };
}
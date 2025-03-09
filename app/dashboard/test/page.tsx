'use client'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css'; //if using mantine date picker features
import 'mantine-react-table/styles.css'; //make sure MRT styles were imported in your app root (once)
import React, { useState } from "react";
import { MantineReactTable, MRT_ColumnDef } from "mantine-react-table";
import { FileInput, Button, Group } from "@mantine/core";

type DataType = {
  id: number;
  name: string;
  file: File | null;
};

const ExampleTable = () => {
  const [data, setData] = useState<DataType[]>([
    { id: 1, name: "Item 1", file: null },
    { id: 2, name: "Item 2", file: null },
  ]);

  const handleFileChange = (file: File | null, rowIndex: number) => {
    const newData = [...data];
    newData[rowIndex].file = file;
    setData(newData);
  };

  const openFileExplorer = (rowIndex: number) => {
    document.getElementById(`file-input-${rowIndex}`)?.click();
  };

  const columns: MRT_ColumnDef<DataType>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableEditing: true, // Editable column
    },
    {
      accessorKey: "file",
      header: "File",
      enableEditing: false, // Prevent editing for file column
      Cell: ({ row }) => {
        const rowIndex = row.index;
        return (
          <FileInput
            placeholder="Select file"
            value={row.original.file}
            onChange={(file) => handleFileChange(file, rowIndex)}
          />
        );
      },
    },
  ];

  return (
    <MantineReactTable
      columns={columns}
      data={data}
      createDisplayMode={'row'}  // ('modal', and 'custom' are also available)
      editDisplayMode={'table'} // ('modal', 'row', 'cell', and 'custom' are also available)
      enableEditing={true}
      renderRowActions={({ row }) => {
        const rowIndex = row.index;
        return (
          <Group>
            <Button size="xs" onClick={() => openFileExplorer(rowIndex)}>
              Select File
            </Button>
            {/* Hidden File Input */}
            <FileInput
              id={`file-input-${rowIndex}`}
              style={{ display: "none" }}
              onChange={(file) => handleFileChange(file, rowIndex)}
            />
          </Group>
        );
      }}
    />
  );
};

export default ExampleTable;

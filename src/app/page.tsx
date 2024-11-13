"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  DataTable,
  DataTablePageParams,
  DataTableRowEvent,
} from "primereact/datatable";
import {
  Column,
  ColumnBodyOptions,
  ColumnEditorOptions,
} from "primereact/column";
import { SelectButton } from "primereact/selectbutton";
import axios from "axios";
import { Tooltip } from 'primereact/tooltip';

import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./TodosTable.css";
import { InputText } from "primereact/inputtext";
import {
  InputNumber,
  InputNumberValueChangeEvent,
} from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { MultiSelect, MultiSelectChangeEvent } from "primereact/multiselect";
import { Toast } from "primereact/toast";

interface Todo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
interface DataTableRowEditCompleteEvent extends DataTableRowEvent {
  /**
   * Editing rows data.
   */
  newData: DataTableValue;
  /**
   * Column field.
   */
  field: string;
  /**
   * Current editing row data index.
   */
  index: number;
}
interface ColumnMeta {
  field: string;
  header: string;
}
const TodosTable: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [sizeOptions] = useState([
    { label: "Small", value: "small" },
    { label: "Normal", value: "normal" },
    { label: "Large", value: "large" },
  ]);
  const [selectedCells, setSelectedCells] = useState(null);
  const [size, setSize] = useState(sizeOptions[1].value);
  const [selectedTodos, setSelectedTodos] = useState<Todo[]>([]);
  const [lockedTodos, setLockedTodos] = useState<Todo[]>([]);
  const [statuses] = useState<string[]>(["True", "False"]);
  const columns: ColumnMeta[] = [
    { field: "todo", header: "Todo" },
    { field: "completed", header: "Completed" },
  ];
  const [visibleColumns, setVisibleColumns] = useState<ColumnMeta[]>(columns);

  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [lazyLoading, setLazyLoading] = useState<boolean>(false);
  const [rowClick, setRowClick] = useState<boolean>(true);
  const toast = useRef(null);

  useEffect(() => {
    // Lazy load data
    fetchData({ first, rows });
  }, [first, rows]);
  // Fetch data for lazy loading
  const fetchData = (pagination: { first: number; rows: number }) => {
    setLazyLoading(true);
    axios
      .get<Todo[]>("https://jsonplaceholder.typicode.com/todos", {
        params: {
          _start: pagination.first,
          _limit: pagination.rows,
        },
      })
      .then((response) => {
        setTodos(response.data);
        setTotalRecords(200); // Assuming total records are 200 (this can be updated from the API if available)
        setLazyLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLazyLoading(false);
      });
  };
  // useEffect(() => {
  //   axios
  //     .get<Todo[]>("https://jsonplaceholder.typicode.com/todos")
  //     .then((response) => {
  //       setTodos(response.data);
  //       setLoading(false);
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching data:", error);
  //       setLoading(false);
  //     });
  // }, []);

  const getSeverity = (value: boolean) => {
    switch (value) {
      case true:
        return "success";

      case true:
        return "danger";

      default:
        return null;
    }
  };
  const statusEditor = (options: ColumnEditorOptions) => {
    return (
      <Dropdown
        value={options.value}
        options={statuses}
        onChange={(e: DropdownChangeEvent) => options.editorCallback!(e.value)}
        placeholder="Select a Status"
        itemTemplate={(option) => {
          return <Tag value={option} severity={getSeverity(option)}></Tag>;
        }}
      />
    );
  };
  const onPage = (event: DataTablePageParams) => {
    setFirst(event.first);
    setRows(event.rows);
    fetchData({ first: event.first, rows: event.rows }); // Force data fetch with new pagination values
  };

  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    const _todos = [...todos];
    const { newData, index } = e;

    _todos[index] = newData as Todo;

    setTodos(_todos);
  };
  const textEditor = (options: ColumnEditorOptions) => {
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          options.editorCallback!(e.target.value)
        }
      />
    );
  };
  const statusBodyTemplate = (rowData: Todo) => {
    return (
      <Tag
        value={rowData.completed === true ? "True" : "False"}
        severity={getSeverity(rowData.completed)}
      ></Tag>
    );
  };
  const allowEdit = (rowData: Todo) => {
    return rowData.name !== "Blue Band";
  };
  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumns = event.value;
    const orderedSelectedColumns = columns.filter((col) =>
      selectedColumns.some((sCol) => sCol.field === col.field)
    );

    setVisibleColumns(orderedSelectedColumns);
  };
  const exportCSV = (selectionOnly) => {
    dt.current.exportCSV({ selectionOnly });
  };

  const exportPdf = () => {
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then(() => {
        const doc = new jsPDF.default(0, 0);

        doc.autoTable(exportColumns, Todos);
        doc.save("Todos.pdf");
      });
    });
  };

  const exportExcel = () => {
    import("xlsx").then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(todos);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "Todos");
    });
  };
  const header = (
    <div className="table-header">
      <span>Todo List</span>
      {/* <MultiSelect value={visibleColumns} options={columns} optionLabel="header" onChange={onColumnToggle} className="w-full sm:w-20rem" display="chip" />; */}
      <div className="flex align-items-center justify-content-end gap-2">
            <Button type="button" icon="pi pi-file" rounded onClick={() => exportCSV(false)} data-pr-tooltip="CSV" />
            <Button type="button" icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="XLS" />
            <Button type="button" icon="pi pi-file-pdf" severity="warning" rounded onClick={exportPdf} data-pr-tooltip="PDF" />
        </div>
      <SelectButton
        value={size}
        onChange={(e) => setSize(e.value)}
        options={sizeOptions}
        className="size-selector"
      />
    </div>
  );
  const lockTemplate = (rowData: Todo, options: ColumnBodyOptions) => {
    const icon = options.frozenRow ? "pi pi-lock" : "pi pi-lock-open";
    const disabled = options.frozenRow ? false : lockedTodos.length >= 2;

    return (
      <Button
        type="button"
        icon={icon}
        disabled={disabled}
        className="p-button-sm p-button-text"
        onClick={() => toggleLock(rowData, options.frozenRow, options.rowIndex)}
      />
    );
  };
  const toggleLock = (data: Todo, frozen: boolean, index: number) => {
    let _lockedTodos, _unlockedTodos;

    if (frozen) {
      _lockedTodos = lockedTodos.filter((c, i) => i !== index);
      _unlockedTodos = [...todos, data];
    } else {
      _unlockedTodos = todos.filter((c, i) => i !== index);
      _lockedTodos = [...lockedTodos, data];
    }

    _unlockedTodos.sort((val1, val2) => {
      return val1.id < val2.id ? -1 : 1;
    });

    setLockedTodos(_lockedTodos);
    setTodos(_unlockedTodos);
  };

  const headerGroup = (
    <ColumnGroup>
      <Row>
        <Column header="Actions" colSpan={3} />
      </Row>
      <Row>
        <Column header="Edit" sortable field="lastYearProfit" />
        <Column header="Lock" sortable field="thisYearProfit" />
      </Row>
    </ColumnGroup>
  );
  const rowClass = (data: Todo) => {
    return {
      "bg-primary": data.completed === true,
    };
  };


  const saveAsExcelFile = (buffer, fileName) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        const EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  };
  const onRowSelect = (event) => {
    toast.current.show({ severity: 'info', summary: 'Product Selected', detail: `Name: ${event.data.name}`, life: 3000 });
};

const onRowUnselect = (event) => {
    toast.current.show({ severity: 'warn', summary: 'Product Unselected', detail: `Name: ${event.data.name}`, life: 3000 });
};
  return (
    <div className="card styled-card">
      <Toast ref={toast} />
      <DataTable
      onRowSelect={onRowSelect} onRowUnselect={onRowUnselect}
      selectionMode={rowClick ? null : 'checkbox'} selection={selectedTodos} onSelectionChange={(e) => setSelectedTodos(e.value)}
        value={todos}
        rowClassName={rowClass}
        headerColumnGroup={headerGroup}
        frozenValue={lockedTodos}
        loading={loading && lazyLoading}
        totalRecords={totalRecords}
        scrollable
        scrollHeight="500px"
        paginator
        lazy
        rows={rows}
        rowsPerPageOptions={[5, 10, 20]}
        header={header}
        first={first}
        size={size}
        onPage={onPage}
        sortMode="multiple"
        removableSort
        sortField="title"
        sortOrder={1}
        filterDisplay="row"
        responsiveLayout="scroll"
        selection={selectedTodos}
        onSelectionChange={(e) => setSelectedTodos(e.value)} // Handle row selection
        columnResizeMode="fit" // Allow column resizing
        cellSelection
        selectionMode="multiple"
        seletion={selectedCells!}
        editMode="row"
        onRowEditComplete={onRowEditComplete}
        className="styled-table"
      >
        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column
          field="id"
          header="ID"
          sortable
          filter
          filterPlaceholder="Search by ID"
          className="column-id"
        ></Column>
        <Column
          field="title"
          header="Title"
          sortable
          filter
          filterPlaceholder="Search by Title"
          editor={(options) => textEditor(options)}
          className="column-title"
        ></Column>
        <Column
          field="completed"
          header="Completed"
          sortable
          filter
          body={statusBodyTemplate}
          editor={(options) => statusEditor(options)}
          filterElement={(options) => (
            <select
              value={options.value || ""}
              onChange={(e) => options.filterApplyCallback(e.target.value)}
              className="p-column-filter"
            >
              <option value="">All</option>
              <option value="true">Completed</option>
              <option value="false">Not Completed</option>
            </select>
          )}
          className="column-completed"
        ></Column>
        <Column
          rowEditor={allowEdit}
          headerStyle={{ width: "10%", minWidth: "8rem" }}
          bodyStyle={{ textAlign: "center" }}
        ></Column>
        <Column style={{ flex: "0 0 4rem" }} body={lockTemplate}></Column>
      </DataTable>
    </div>
  );
};

export default TodosTable;

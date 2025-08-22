import React, { useRef, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { useRows } from '../../store/useRows'
import type { MaterialRow, Unit, PriceSource } from '../../types/material'

const units: Unit[] = ['шт.', 'комплект', 'м', 'кг', 'м2', 'м3', 'л']
const priceSources: PriceSource[] = ['База 1С', 'ETM.ru', 'Tinko.ru', 'Яндекс.Маркет', 'Прайс поставщика', 'Другое']

export const Grid: React.FC = () => {
  const gridRef = useRef<AgGridReact<MaterialRow>>(null)
  const { rows, selectedIds, hiddenColumns, patchCell, setSelected } = useRows()

  const columnDefs = useMemo<ColDef<MaterialRow>[]>(() => [
    {
      field: 'index',
      headerName: '№',
      width: 70,
      pinned: 'left',
      editable: false,
      cellClass: 'text-center font-medium'
    },
    {
      field: 'name',
      headerName: 'Наименование',
      flex: 2,
      minWidth: 250,
      editable: true,
      cellClass: 'font-medium'
    },
    {
      field: 'typeBrand',
      headerName: 'Тип, марка',
      width: 150,
      editable: true,
      hide: hiddenColumns.includes('typeBrand')
    },
    {
      field: 'code',
      headerName: 'Код',
      width: 120,
      editable: true,
      hide: hiddenColumns.includes('code')
    },
    {
      field: 'manufacturer',
      headerName: 'Производитель',
      width: 150,
      editable: true,
      hide: hiddenColumns.includes('manufacturer')
    },
    {
      field: 'unit',
      headerName: 'Ед. изм.',
      width: 100,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: units
      }
    },
    {
      field: 'qty',
      headerName: 'Кол-во',
      width: 100,
      editable: true,
      valueParser: params => {
        const val = Number(params.newValue)
        return isNaN(val) ? 0 : val
      },
      cellClass: 'text-right font-medium'
    },
    {
      field: 'specRef',
      headerName: 'Спецификация',
      width: 140,
      editable: true
    },
    {
      field: 'price',
      headerName: 'Цена',
      width: 120,
      editable: true,
      valueParser: params => {
        const val = Number(params.newValue)
        return isNaN(val) ? 0 : val
      },
      valueFormatter: params => {
        return params.value ? `${params.value.toFixed(2)} ₽` : '0.00 ₽'
      },
      cellClass: 'text-right font-medium'
    },
    {
      field: 'priceSource',
      headerName: 'Основание',
      width: 150,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: priceSources
      }
    },
    {
      field: 'productCode',
      headerName: 'Код товара',
      width: 150,
      editable: true
    },
    {
      field: 'notes',
      headerName: 'Примечания',
      flex: 1,
      minWidth: 150,
      editable: true
    }
  ], [hiddenColumns])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    suppressMenu: true
  }), [])

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit()
  }, [])

  const onCellValueChanged = useCallback((event: CellValueChangedEvent<MaterialRow>) => {
    if (event.data) {
      patchCell(event.data.id, {
        [event.colDef.field!]: event.newValue
      })
    }
  }, [patchCell])

  const onSelectionChanged = useCallback(() => {
    const api = gridRef.current?.api
    if (api) {
      const selectedRows = api.getSelectedRows()
      setSelected(selectedRows.map(r => r.id))
    }
  }, [setSelected])

  const getRowId = useCallback((params: any) => params.data.id, [])

  const getRowClass = useCallback((params: any) => {
    if (selectedIds.includes(params.data.id)) {
      return 'ag-row-selected'
    }
    return params.node.rowIndex % 2 === 0 ? 'ag-row-even' : 'ag-row-odd'
  }, [selectedIds])

  return (
    <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
      <div className="ag-theme-alpine h-full">
        <AgGridReact<MaterialRow>
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onSelectionChanged={onSelectionChanged}
          getRowId={getRowId}
          getRowClass={getRowClass}
          rowSelection="multiple"
          animateRows={true}
          stopEditingWhenCellsLoseFocus={true}
          singleClickEdit={false}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[20, 50, 100, 200]}
          localeText={{
            page: 'Страница',
            of: 'из',
            to: 'до',
            first: 'Первая',
            previous: 'Предыдущая',
            next: 'Следующая',
            last: 'Последняя',
            noRowsToShow: 'Нет данных для отображения',
            loadingOoo: 'Загрузка...',
            filterOoo: 'Фильтр...',
            applyFilter: 'Применить',
            clearFilter: 'Очистить',
            contains: 'Содержит',
            notContains: 'Не содержит',
            startsWith: 'Начинается с',
            endsWith: 'Заканчивается на',
            equals: 'Равно',
            notEqual: 'Не равно',
            blank: 'Пусто',
            notBlank: 'Не пусто'
          }}
        />
      </div>
      
      {/* Нижняя панель с суммами */}
      {rows.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                Σ Количество: <strong>{rows.reduce((sum, r) => sum + r.qty, 0)}</strong>
              </span>
              <span>
                Σ Стоимость: <strong>{rows.reduce((sum, r) => sum + r.qty * r.price, 0).toFixed(2)} ₽</strong>
              </span>
            </div>
            <span>
              Показано колонок: {columnDefs.filter(c => !c.hide).length} из {columnDefs.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
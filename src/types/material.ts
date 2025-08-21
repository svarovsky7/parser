export interface MaterialRow {
  id: string
  index: number                 // №
  name: string                  // Наименования
  typeBrand: string             // Тип, марка
  code: string                  // Код оборудования/артикул
  manufacturer: string          // Завод/бренд
  unit: string                  // Ед. изм. (шт., компл.)
  qty: number                   // Кол-во
  specRef: string               // Спецификация/узел (например, LED-003)
  price: number                 // Стоимость за ед.
  priceSource: string           // Основание (База 1С, Tinko.ru и т.п.)
  notes?: string
  createdAt: string
  updatedAt: string
}

export type Unit = 'шт.' | 'комплект' | 'м' | 'кг' | 'м2' | 'м3' | 'л'

export type PriceSource = 'База 1С' | 'ETM.ru' | 'Tinko.ru' | 'Яндекс.Маркет' | 'Прайс поставщика' | 'Другое'

export interface MaterialDatabase {
  id: string
  code: string
  name: string
  manufacturer: string
  unit: Unit
  price: number
  source: PriceSource
}

export interface ImportMapping {
  sourceColumn: string
  targetField: keyof MaterialRow
  transform?: (value: any) => any
}
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (port 5173 by default)
npm run dev

# Build for production (TypeScript check + Vite build)
npm run build

# Run ESLint for code quality checks
npm run lint

# Preview production build locally
npm run preview
```

## Architecture

Parser System - React + TypeScript application built with Vite, integrated with Supabase for backend services. The application provides two main modules: Materials Management and Products Import, with intelligent data processing capabilities.

### Core Structure
- **Entry**: `src/main.tsx` renders App component to DOM
- **Main Application**: `src/App.tsx` - Navigation between Materials and Products pages
- **Materials Module**: `src/components/MaterialsTable.tsx` - Excel import with material suggestion algorithm
- **Products Module**: `src/components/ProductsImport.tsx` - CSV import with validation

### State Management Architecture
- **Zustand Store**: `src/store/useRows.ts` - Global state management with:
  - Material rows with full CRUD operations
  - Selection management (single/multiple rows)
  - Undo/redo functionality with history tracking (20-state limit)
  - Dirty state tracking for unsaved changes
  - Column visibility and filtering
  - Optimistic updates with Immer integration

### Data Layer
- **Supabase Client**: `src/lib/supabase.ts` - Centralized client configuration
- **Data Hooks**: 
  - `src/hooks/useMaterialsData.ts` - Materials CRUD operations with dual table support
  - `src/hooks/useProductsData.ts` - Products import and management
  - Manages both `materials_data` (user imports) and `materials_database` (reference data)
- **Validation**: `src/lib/validation.ts` - Zod schemas for:
  - MaterialRow validation with localized error messages
  - Import data sanitization
  - Unit and price source validation

### Material Suggestion Algorithm

The system implements an intelligent material matching algorithm:

1. **Keyword Extraction**: Splits material names into keywords (length > 2)
2. **Fuzzy Matching**: Uses substring matching between keywords
3. **Percentage Scoring**: Calculates match percentage based on keyword overlap
4. **Dynamic Limits**: Adjusts suggestion count and minimum percentage by row:
   - Rows 1-2: 5 suggestions, 10% minimum
   - Rows 3-4: 4 suggestions, 12% minimum  
   - Rows 5+: 2 suggestions, 15% minimum

## Database Schema

**IMPORTANT**: The complete and authoritative database schema (tables, views, functions, triggers, policies) is defined in `supabase/schemes/prod.sql`. This file contains the full production database structure exported from Supabase.

### Primary Tables

**materials_data** - User imported materials (from `supabase/migrations/create_materials_tables.sql`):
- `id`: UUID primary key
- `position`: Item position number  
- `name`: Material name
- `type_mark_documents`: Type, mark specifications
- `equipment_code`: Equipment/part code
- `manufacturer`: Manufacturer name
- `unit`: Unit of measurement
- `quantity`: Quantity value
- `material_picker`: Selected material reference
- `price_unit`: Price unit of measurement
- `price`: Unit price
- `source`: Price source/basis
- `file_name`: Source Excel filename
- Timestamps: `created_at`, `updated_at`

**materials_database** - Reference materials database (from `supabase/migrations/create_materials_tables.sql`):
- `id`: UUID primary key
- `code`: Material code
- `name`: Material name
- `manufacturer`: Manufacturer
- `unit`: Unit of measurement
- `price`: Reference price
- `source`: Price source
- Timestamps: `created_at`, `updated_at`

**products** - Products catalog (from `supabase/schemes/prod.sql`):
- `id`: bigint primary key
- `name`: Product name
- `brand`: Brand name
- `article`: Article number (optional)
- `brand_code`: Brand code
- `cli_code`: Client code (optional)
- `class`: Product class/category
- `class_code`: Category code
- Note: Timestamps managed via triggers in `supabase/migrations/create_products_table.sql`

## Type System

### Core Types (`src/types/material.ts`)

```typescript
interface MaterialRow {
  id: string
  index: number                 // №
  name: string                  // Наименования
  typeBrand: string             // Тип, марка
  code: string                  // Код оборудования/артикул
  manufacturer: string          // Завод/бренд
  unit: string                  // Ед. изм.
  qty: number                   // Кол-во
  specRef: string               // Спецификация/узел
  price: number                 // Стоимость за ед.
  priceSource: string           // Основание
  notes?: string
  createdAt: string
  updatedAt: string
}
```

### Validation Schemas
- **UnitSchema**: Validates measurement units ('шт.', 'комплект', 'м', 'кг', 'м2', 'м3', 'л')
- **PriceSourceSchema**: Validates price sources ('База 1С', 'ETM.ru', 'Tinko.ru', etc.)
- **MaterialRowSchema**: Complete row validation with localized error messages
- **MaterialRowImportSchema**: Lenient schema for Excel import data

## Import Processes

### Excel Import (Materials)
1. **File Selection**: Supports .xlsx, .xls formats
2. **XLSX Parsing**: Uses `xlsx` library for sheet parsing
3. **Header Detection**: First row used as column headers
4. **Data Sanitization**: `sanitizeImportData` function cleans input
5. **Row Generation**: Creates MaterialRow objects with UUIDs
6. **Validation**: Zod schema validation with error reporting

### CSV Import (Products)
1. **File Selection**: CSV format only
2. **Custom Parser**: `src/lib/csvParser.ts` handles parsing
3. **Field Mapping**: Automatic mapping to Product type
4. **Type Conversion**: Handles string to number conversions
5. **Upsert Operation**: Updates existing records or creates new ones
6. **Error Reporting**: Detailed per-row validation messages

## Environment Variables

Required in `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Key Dependencies

- **@supabase/supabase-js**: ^2.55.0 - Database client
- **zustand**: ^5.0.8 - State management
- **immer**: ^10.1.1 - Immutable state updates
- **xlsx**: ^0.18.5 - Excel file processing
- **zod**: ^4.0.17 - Schema validation
- **lucide-react**: ^0.540.0 - Icon components
- **antd**: ^5.27.1 - UI components
- **ag-grid-react**: ^34.1.1 - Data grid component
- **react**: ^19.1.1 - UI framework
- **typescript**: ~5.8.3 - Type safety
- **vite**: ^7.1.2 - Build tool and dev server
- **tailwindcss**: ^4.1.12 - Utility-first CSS framework

## Data Flow Patterns

### Materials Flow
1. **Import**: Excel → XLSX parser → sanitizeImportData → MaterialRow creation
2. **State**: MaterialRow → Zustand store → React components
3. **Editing**: Double-click → inline editing → validation → state update
4. **Suggestions**: Material name → matching algorithm → filtered results → user selection
5. **Persistence**: MaterialRow → Supabase adapter → materials_data table
6. **History**: State changes → history array → undo/redo functionality

### Products Flow
1. **Import**: CSV → Custom parser → ProductImport validation
2. **Preview**: Parsed data → UI table → validation indicators
3. **Persistence**: Products array → Supabase upsert → products table
4. **Error Handling**: Parse errors → detailed messages → UI feedback
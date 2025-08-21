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

Equipment Management System - React + TypeScript application built with Vite, integrated with Supabase backend. The application allows users to import equipment data from Excel files, manage inventory, and perform CRUD operations on equipment records.

### Core Structure
- **Entry**: `src/main.tsx` - Application entry point rendering to DOM
- **Main Application**: `src/App.tsx` - Equipment management interface with:
  - Connection status monitoring
  - Excel file upload and parsing
  - Data filtering and search
  - Inline editing capabilities
  - Manufacturer statistics
  
### Data Layer
- **Supabase Client**: `src/lib/supabase.ts` - Centralized Supabase client configuration
- **Custom Hooks**: 
  - `src/hooks/useEquipmentData.ts` - Equipment CRUD operations with optimistic updates
  - Provides: fetchEquipmentData, addEquipmentData, deleteEquipmentData, clearAllData, updateEquipmentData
- **Type Definitions**: `src/types/supabase.ts` - Database schema types for equipment_data table

### Components
- **EquipmentFileUpload**: `src/components/EquipmentFileUpload.tsx`
  - Excel file parsing with XLSX library
  - Column mapping from Excel headers to database fields
  - Multi-step upload process with preview
  - Automatic field type conversion (numbers for position/quantity)

### UI Framework
- **Ant Design (antd)**: Primary UI component library
- **Ant Design Icons**: Icon components
- **Custom theme**: Purple primary color (#667eea)

## Database Schema

The complete database schema is defined in `supabase/schemes/prod.sql`. 

Main table: **equipment_data**
- `id`: UUID primary key
- `file_name`: Source Excel file name
- `position`: Item position number
- `name_and_specs`: Equipment name and specifications
- `type_mark_docs`: Type, mark, and documentation
- `equipment_code`: Equipment code/catalog number
- `manufacturer`: Manufacturer name
- `unit_measure`: Unit of measurement
- `quantity`: Quantity in stock
- `created_at`, `updated_at`: Timestamps

## Excel Import Mapping

The system automatically maps Excel column headers to database fields:
- Позиция → position
- Наименования и технические характеристики → name_and_specs
- Тип, марка, обозначение документов → type_mark_docs
- Код оборудования → equipment_code
- Завод изготовитель → manufacturer
- Единица измерения → unit_measure
- Кол-во/Количество → quantity

Headers are normalized (trimmed, spaces collapsed) and matched case-insensitively.

## Environment Variables

Required in `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Key Dependencies

- **@supabase/supabase-js**: ^2.55.0 - Database client
- **antd**: ^5.27.1 - UI components
- **xlsx**: ^0.18.5 - Excel file parsing
- **react**: ^19.1.1 - UI library
- **typescript**: ~5.8.3 - Type safety
- **vite**: ^7.1.2 - Build tool
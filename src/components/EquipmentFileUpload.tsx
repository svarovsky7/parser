import { useState } from 'react'
import * as XLSX from 'xlsx'
import { 
  Upload, 
  Button, 
  Card, 
  Steps, 
  Table, 
  Space, 
  Typography, 
  Alert,
  Result,
  message,
  Tag
} from 'antd'
import { 
  InboxOutlined, 
  FileExcelOutlined, 
  CheckCircleOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { Database } from '../types/supabase'

const { Dragger } = Upload
const { Step } = Steps
const { Title, Text } = Typography

type EquipmentInsert = Database['public']['Tables']['equipment_data']['Insert']

interface EquipmentFileUploadProps {
  onDataParsed: (equipmentRows: EquipmentInsert[]) => void
}

// Маппинг заголовков Excel к полям базы данных
const COLUMN_MAPPING: Record<string, keyof EquipmentInsert> = {
  'Позиция': 'position',
  'позиция': 'position',
  'Наименования и технические характеристики': 'name_and_specs',
  'наименования и технические характеристики': 'name_and_specs',
  'Тип, марка, обозначение документов, опросного листа': 'type_mark_docs',
  'тип, марка, обозначение документов, опросного листа': 'type_mark_docs',
  'Код оборудования, изделия, материалов, № опросного листа': 'equipment_code',
  'код оборудования, изделия, материалов, № опросного листа': 'equipment_code',
  'Завод изготовитель': 'manufacturer',
  'завод изготовитель': 'manufacturer',
  'Единица измерения': 'unit_measure',
  'единица измерения': 'unit_measure',
  'Кол-во': 'quantity',
  'кол-во': 'quantity',
  'Количество': 'quantity',
  'количество': 'quantity'
}

export function EquipmentFileUpload({ onDataParsed }: EquipmentFileUploadProps) {
  const [parsedData, setParsedData] = useState<EquipmentInsert[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [messageApi, contextHolder] = message.useMessage()

  const normalizeHeader = (header: string): string => {
    return header
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const parseExcel = async (file: File) => {
    setIsProcessing(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        dateNF: 'yyyy-mm-dd'
      })
      
      if (jsonData.length === 0) {
        messageApi.error('Файл не содержит данных')
        resetUpload()
        return
      }

      const equipmentRows: EquipmentInsert[] = jsonData.map((row: unknown) => {
        const mappedRow: EquipmentInsert = {
          file_name: file.name
        }
        
        Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
          const normalizedKey = normalizeHeader(key)
          
          let dbField: keyof EquipmentInsert | undefined
          
          if (COLUMN_MAPPING[normalizedKey]) {
            dbField = COLUMN_MAPPING[normalizedKey]
          } else {
            for (const [mapKey, mapValue] of Object.entries(COLUMN_MAPPING)) {
              if (normalizedKey.toLowerCase().includes(mapKey.toLowerCase()) || 
                  mapKey.toLowerCase().includes(normalizedKey.toLowerCase())) {
                dbField = mapValue
                break
              }
            }
          }
          
          if (dbField && value !== null && value !== undefined) {
            if (dbField === 'position' || dbField === 'quantity') {
              const numValue = Number(value)
              if (!isNaN(numValue)) {
                ;(mappedRow as Record<string, unknown>)[dbField] = numValue
              }
            } else {
              ;(mappedRow as Record<string, unknown>)[dbField] = String(value).trim()
            }
          }
        })
        
        return mappedRow
      })
      
      setParsedData(equipmentRows)
      setCurrentStep(1)
      messageApi.success(`Загружено ${equipmentRows.length} записей`)
    } catch (error) {
      console.error('Ошибка при парсинге файла:', error)
      messageApi.error('Ошибка при чтении файла Excel')
      resetUpload()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (parsedData.length > 0) {
      setIsProcessing(true)
      await onDataParsed(parsedData)
      setCurrentStep(2)
      setTimeout(() => {
        resetUpload()
      }, 3000)
      setIsProcessing(false)
    }
  }

  const resetUpload = () => {
    setParsedData([])
    setFileName('')
    setCurrentStep(0)
    setIsProcessing(false)
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      setFileName(file.name)
      parseExcel(file)
      return false
    },
  }

  const columns = [
    {
      title: 'Позиция',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      render: (text: string | number | null) => <Tag color="blue">{text || '-'}</Tag>,
    },
    {
      title: 'Наименование',
      dataIndex: 'name_and_specs',
      key: 'name_and_specs',
      ellipsis: true,
    },
    {
      title: 'Тип/Марка',
      dataIndex: 'type_mark_docs',
      key: 'type_mark_docs',
      ellipsis: true,
    },
    {
      title: 'Код',
      dataIndex: 'equipment_code',
      key: 'equipment_code',
      width: 150,
    },
    {
      title: 'Производитель',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
      render: (text: string | null) => text ? <Tag color="green">{text}</Tag> : '-',
    },
    {
      title: 'Ед.',
      dataIndex: 'unit_measure',
      key: 'unit_measure',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
      render: (text: number | null) => <strong>{text || 0}</strong>,
    },
  ]

  return (
    <>
      {contextHolder}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="Выбор файла" icon={<FileExcelOutlined />} />
          <Step title="Проверка данных" icon={<CheckCircleOutlined />} />
          <Step title="Сохранение" icon={<SaveOutlined />} />
        </Steps>

        {currentStep === 0 && (
          <Dragger {...uploadProps} style={{ padding: '40px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 64, color: '#667eea' }} />
            </p>
            <Title level={4}>Нажмите или перетащите Excel файл сюда</Title>
            <Text type="secondary">
              Поддерживаются форматы .xlsx и .xls
            </Text>
          </Dragger>
        )}

        {currentStep === 1 && parsedData.length > 0 && (
          <div>
            <Alert
              message={`Файл: ${fileName}`}
              description={`Найдено ${parsedData.length} записей для импорта`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Title level={5} style={{ marginBottom: 16 }}>
              Предпросмотр данных (первые 5 записей)
            </Title>

            <Table
              dataSource={parsedData.slice(0, 5)}
              columns={columns}
              rowKey={(record, index) => index?.toString() || ''}
              pagination={false}
              size="small"
              scroll={{ x: 1000 }}
            />

            {parsedData.length > 5 && (
              <Alert
                message={`Показаны первые 5 записей из ${parsedData.length}`}
                type="info"
                style={{ marginTop: 16 }}
              />
            )}

            <Space style={{ marginTop: 24 }}>
              <Button 
                icon={<CloseOutlined />}
                onClick={resetUpload}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveToDatabase}
                loading={isProcessing}
                size="large"
              >
                Сохранить в базу данных
              </Button>
            </Space>
          </div>
        )}

        {currentStep === 2 && (
          <Result
            status="success"
            title="Данные успешно сохранены!"
            subTitle={`${parsedData.length} записей добавлено в базу данных`}
            extra={[
              <Button type="primary" key="new" onClick={resetUpload}>
                Загрузить новый файл
              </Button>
            ]}
          />
        )}
      </Card>
    </>
  )
}
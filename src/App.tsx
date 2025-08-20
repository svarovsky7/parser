import { useState, useEffect } from 'react'
import { 
  Layout, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Card, 
  Input, 
  Select, 
  Statistic, 
  Row, 
  Col,
  Typography,
  Alert,
  Badge,
  Popconfirm,
  message,
  Spin,
  Empty,
  ConfigProvider,
  theme
} from 'antd'
import {
  DeleteOutlined,
  ClearOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  WarningOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { supabase } from './lib/supabase'
import { useEquipmentData } from './hooks/useEquipmentData'
import { EquipmentFileUpload } from './components/EquipmentFileUpload'
import type { Database } from './types/supabase'
import type { ColumnsType } from 'antd/es/table'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Search } = Input

type EquipmentInsert = Database['public']['Tables']['equipment_data']['Insert']
type EquipmentData = Database['public']['Tables']['equipment_data']['Row']

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')
  const [editingKey, setEditingKey] = useState('')
  const [messageApi, contextHolder] = message.useMessage()
  
  const { 
    equipmentData, 
    loading, 
    addEquipmentData, 
    deleteEquipmentData, 
    clearAllData, 
    updateEquipmentData, 
    refetch 
  } = useEquipmentData()

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const { error } = await supabase.from('equipment_data').select('count').limit(1)
      if (error && error.code === '42P01') {
        console.log('Таблица equipment_data не существует')
        setConnectionStatus('error')
      } else if (error) {
        console.error('Ошибка подключения:', error)
        setConnectionStatus('error')
      } else {
        console.log('Успешно подключено к Supabase!')
        setConnectionStatus('connected')
      }
    } catch (err) {
      console.error('Ошибка:', err)
      setConnectionStatus('error')
    }
  }

  const handleDataParsed = async (equipmentRows: EquipmentInsert[]) => {
    setIsSaving(true)
    try {
      const { error } = await addEquipmentData(equipmentRows)
      if (error) {
        console.error('Ошибка при сохранении данных:', error)
        messageApi.error('Ошибка при сохранении данных в базу')
      } else {
        messageApi.success(`Успешно сохранено ${equipmentRows.length} записей`)
        refetch()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteEquipmentData(id)
    if (error) {
      console.error('Ошибка при удалении:', error)
      messageApi.error('Ошибка при удалении записи')
    } else {
      messageApi.success('Запись удалена')
    }
  }

  const handleClearAll = async () => {
    const { error } = await clearAllData()
    if (error) {
      console.error('Ошибка при очистке базы данных:', error)
      messageApi.error('Ошибка при очистке базы данных')
    } else {
      messageApi.success('База данных очищена')
      refetch()
    }
  }

  const save = async (record: EquipmentData) => {
    try {
      const { error } = await updateEquipmentData(record.id, record)
      if (error) {
        messageApi.error('Ошибка при сохранении изменений')
      } else {
        messageApi.success('Изменения сохранены')
        setEditingKey('')
      }
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  const isEditing = (record: EquipmentData) => record.id === editingKey

  const edit = (record: EquipmentData) => {
    setEditingKey(record.id)
  }

  const cancel = () => {
    setEditingKey('')
  }

  // Фильтрация данных
  const filteredData = equipmentData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name_and_specs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type_mark_docs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesManufacturer = selectedManufacturer === 'all' || item.manufacturer === selectedManufacturer
    
    return matchesSearch && matchesManufacturer
  })

  // Подсчет статистики
  const manufacturerStats = equipmentData.reduce((acc, item) => {
    if (item.manufacturer) {
      if (!acc[item.manufacturer]) {
        acc[item.manufacturer] = { count: 0, totalQuantity: 0 }
      }
      acc[item.manufacturer].count++
      acc[item.manufacturer].totalQuantity += item.quantity || 0
    }
    return acc
  }, {} as Record<string, { count: number; totalQuantity: number }>)

  const manufacturers = Array.from(new Set(equipmentData.map(item => item.manufacturer).filter(Boolean))) as string[]

  // Колонки таблицы
  const columns: ColumnsType<EquipmentData> = [
    {
      title: 'Позиция',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      sorter: (a, b) => (a.position || 0) - (b.position || 0),
      render: (text) => <Tag color="blue">{text || '-'}</Tag>,
    },
    {
      title: 'Наименование',
      dataIndex: 'name_and_specs',
      key: 'name_and_specs',
      ellipsis: true,
      editable: true,
    },
    {
      title: 'Тип/Марка',
      dataIndex: 'type_mark_docs',
      key: 'type_mark_docs',
      ellipsis: true,
      editable: true,
    },
    {
      title: 'Код',
      dataIndex: 'equipment_code',
      key: 'equipment_code',
      width: 150,
      editable: true,
    },
    {
      title: 'Производитель',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 150,
      filters: manufacturers.map(m => ({ text: m, value: m })),
      onFilter: (value, record) => record.manufacturer === value,
      render: (text) => text ? <Tag color="green">{text}</Tag> : '-',
      editable: true,
    },
    {
      title: 'Ед. изм.',
      dataIndex: 'unit_measure',
      key: 'unit_measure',
      width: 100,
      align: 'center',
      editable: true,
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0),
      render: (text) => <strong>{text || 0}</strong>,
      editable: true,
    },
    {
      title: 'Действия',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <Space>
            <Button type="primary" size="small" onClick={() => save(record)}>
              Сохранить
            </Button>
            <Button size="small" onClick={cancel}>
              Отмена
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => edit(record)}
              disabled={editingKey !== ''}
            />
            <Popconfirm
              title="Удалить запись?"
              onConfirm={() => handleDelete(record.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record: EquipmentData) => ({
        record,
        inputType: col.dataIndex === 'quantity' || col.dataIndex === 'position' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })

  const EditableCell = ({
    editing,
    dataIndex,
    inputType,
    record,
    children,
    ...restProps
  }: {
    editing: boolean
    dataIndex: string
    inputType: string
    record: EquipmentData
    children: React.ReactNode
  }) => {

    return (
      <td {...restProps}>
        {editing ? (
          <Input
            defaultValue={record[dataIndex]}
            onBlur={(e) => {
              record[dataIndex] = inputType === 'number' ? 
                parseFloat(e.target.value) || null : 
                e.target.value
            }}
            onPressEnter={() => save(record)}
          />
        ) : (
          children
        )}
      </td>
    )
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#667eea',
        },
      }}
    >
      {contextHolder}
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Title level={3} style={{ margin: 0 }}>
            🏭 Система учета оборудования
          </Title>
          
          <Badge 
            status={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'error' : 'processing'}
            text={
              connectionStatus === 'connected' ? 'Подключено' :
              connectionStatus === 'error' ? 'Ошибка подключения' :
              'Подключение...'
            }
          />
        </Header>

        <Content style={{ padding: '24px' }}>
          {connectionStatus === 'error' && (
            <Alert
              message="Ошибка подключения к базе данных"
              description="Выполните SQL из файла supabase/schemes/equipment_data.sql в Supabase Dashboard"
              type="error"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 24 }}
            />
          )}

          {connectionStatus === 'connected' && (
            <>
              <EquipmentFileUpload onDataParsed={handleDataParsed} />

              {isSaving && (
                <Card style={{ marginBottom: 24, textAlign: 'center' }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <Text style={{ marginLeft: 12 }}>Сохранение данных...</Text>
                </Card>
              )}

              {/* Статистика */}
              {Object.keys(manufacturerStats).length > 0 && (
                <Card title="📊 Статистика по производителям" style={{ marginBottom: 24 }}>
                  <Row gutter={16}>
                    {Object.entries(manufacturerStats).map(([manufacturer, stats]) => (
                      <Col span={6} key={manufacturer}>
                        <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                          <Statistic
                            title={<Text style={{ color: 'white' }}>{manufacturer}</Text>}
                            value={stats.totalQuantity}
                            suffix={`шт. (${stats.count} поз.)`}
                            valueStyle={{ color: 'white', fontSize: 20 }}
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* Таблица данных */}
              <Card 
                title="📋 База данных оборудования"
                extra={
                  <Space>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={refetch}
                    >
                      Обновить
                    </Button>
                    {equipmentData.length > 0 && (
                      <Popconfirm
                        title="Очистить базу данных?"
                        description={`Будет удалено ${equipmentData.length} записей. Это действие нельзя отменить.`}
                        onConfirm={handleClearAll}
                        okText="Да, очистить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                      >
                        <Button danger icon={<ClearOutlined />}>
                          Очистить базу
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Фильтры */}
                  {equipmentData.length > 0 && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Search
                          placeholder="Поиск по всем полям..."
                          allowClear
                          enterButton={<SearchOutlined />}
                          size="large"
                          onSearch={setSearchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </Col>
                      <Col span={8}>
                        <Select
                          placeholder="Все производители"
                          style={{ width: '100%' }}
                          size="large"
                          value={selectedManufacturer}
                          onChange={setSelectedManufacturer}
                          options={[
                            { value: 'all', label: 'Все производители' },
                            ...manufacturers.map(m => ({ 
                              value: m, 
                              label: `${m} (${manufacturerStats[m]?.count || 0})` 
                            }))
                          ]}
                        />
                      </Col>
                      <Col span={4}>
                        {(searchTerm || selectedManufacturer !== 'all') && (
                          <Button 
                            size="large"
                            onClick={() => {
                              setSearchTerm('')
                              setSelectedManufacturer('all')
                            }}
                          >
                            Сбросить фильтры
                          </Button>
                        )}
                      </Col>
                    </Row>
                  )}

                  {/* Таблица */}
                  <Table
                    components={{
                      body: {
                        cell: EditableCell,
                      },
                    }}
                    bordered
                    dataSource={filteredData}
                    columns={mergedColumns}
                    rowKey="id"
                    loading={loading}
                    locale={{
                      emptyText: <Empty description="Нет данных" />
                    }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} записей`,
                    }}
                    scroll={{ x: 1200 }}
                    size="middle"
                  />
                </Space>
              </Card>
            </>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
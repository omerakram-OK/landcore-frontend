import { useState } from "react";
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { TableColumnsType, UploadFile } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkImportBlocks,
  createBlock,
  deleteBlock,
  listBlocks,
  updateBlock,
} from "../../api/blocks";
import { listSocieties } from "../../api/societies";
import type {
  BlockResponse,
  BulkImportBlockRowResult,
  BulkImportBlocksResult,
  CreateBlockRequest,
  UpdateBlockRequest,
} from "../../types/block";
import { getApiErrorMessage } from "../../utils/errors";

const BLOCKS_QUERY_KEY = ["blocks"] as const;
const SOCIETIES_QUERY_KEY = ["societies"] as const;

export default function BlocksListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockResponse | null>(null);
  const [isImportOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<BulkImportBlocksResult | null>(null);
  const [searchText, setSearchText] = useState("");
  const [createForm] = Form.useForm<CreateBlockRequest>();
  const [editForm] = Form.useForm<UpdateBlockRequest>();

  const { data, isLoading } = useQuery({
    queryKey: BLOCKS_QUERY_KEY,
    queryFn: listBlocks,
  });

  const { data: societies } = useQuery({
    queryKey: SOCIETIES_QUERY_KEY,
    queryFn: listSocieties,
  });
  const societyNameById = new Map((societies ?? []).map((society) => [society.id, society.name]));

  const invalidateBlocks = () => queryClient.invalidateQueries({ queryKey: BLOCKS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (dto: CreateBlockRequest) => createBlock(dto),
    onSuccess: () => {
      message.success("Block created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateBlocks();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create block.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBlockRequest }) => updateBlock(id, dto),
    onSuccess: () => {
      message.success("Block updated.");
      setEditingBlock(null);
      void invalidateBlocks();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update block.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onSuccess: () => {
      message.success("Block deleted.");
      void invalidateBlocks();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete block.")),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => bulkImportBlocks(file),
    onSuccess: (result) => {
      setImportResult(result);
      if (result.failureCount === 0) {
        message.success(`Imported ${result.successCount} of ${result.totalRows} block(s).`);
      } else {
        message.warning(
          `Imported ${result.successCount} of ${result.totalRows} block(s) — ${result.failureCount} row(s) failed, see details below.`,
        );
      }
      void invalidateBlocks();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to import the file — check it is a valid CSV/TXT.")),
  });

  const closeImportModal = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportResult(null);
  };

  const downloadImportTemplate = () => {
    const header = "SocietyName,Name,Description,TotalPlots";
    const sampleRows = [
      "DHA Phase 1,North Block,Northern residential sector,120",
      "DHA Phase 1,South Block,Southern commercial sector,60",
    ];
    const csvContent = [header, ...sampleRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blocks-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openEdit = (record: BlockResponse) => {
    setEditingBlock(record);
    editForm.setFieldsValue({
      societyId: record.societyId,
      name: record.name,
      description: record.description,
      totalPlots: record.totalPlots,
    });
  };

  const filteredBlocks = (data ?? []).filter((block) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    const societyName = societyNameById.get(block.societyId) ?? "";
    return (
      block.name.toLowerCase().includes(term) ||
      block.description.toLowerCase().includes(term) ||
      societyName.toLowerCase().includes(term)
    );
  });

  const columns: TableColumnsType<BlockResponse> = [
    {
      title: "Society",
      dataIndex: "societyId",
      key: "societyId",
      render: (societyId: string) => societyNameById.get(societyId) ?? "—",
    },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Total Plots", dataIndex: "totalPlots", key: "totalPlots" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this block?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Blocks
        </Typography.Title>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            Import Blocks
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create Block
          </Button>
        </Space>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by name, description, or society"
        style={{ width: 320, marginBottom: 16 }}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table<BlockResponse> rowKey="id" loading={isLoading} dataSource={filteredBlocks} columns={columns} />

      <Modal
        title="Import Blocks from CSV/TXT"
        open={isImportOpen}
        onCancel={closeImportModal}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Typography.Paragraph type="secondary">
          Upload a .csv or .txt file to create many blocks at once. Required columns: SocietyName
          (must match an existing Society exactly) and Name. Description and TotalPlots are optional
          (default to "" and 0). Name must be unique within its Society — a row whose Name already
          exists there is reported as a failure rather than overwriting the existing Block.
        </Typography.Paragraph>
        <Button onClick={downloadImportTemplate} style={{ marginBottom: 16 }}>
          Download Sample Template
        </Button>

        <Upload.Dragger
          accept=".csv,.txt"
          maxCount={1}
          fileList={
            importFile
              ? [{ uid: "import-file", name: importFile.name, status: "done" } as UploadFile]
              : []
          }
          beforeUpload={(file) => {
            setImportFile(file);
            setImportResult(null);
            return false;
          }}
          onRemove={() => {
            setImportFile(null);
            setImportResult(null);
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a .csv/.txt file here</p>
        </Upload.Dragger>

        <Button
          type="primary"
          block
          style={{ marginTop: 16 }}
          disabled={!importFile}
          loading={importMutation.isPending}
          onClick={() => {
            if (importFile) {
              importMutation.mutate(importFile);
            }
          }}
        >
          Start Import
        </Button>

        {importResult ? (
          <div style={{ marginTop: 16 }}>
            <Alert
              type={importResult.failureCount === 0 ? "success" : "warning"}
              showIcon
              message={`${importResult.successCount} of ${importResult.totalRows} row(s) imported successfully.`}
              style={{ marginBottom: 12 }}
            />
            <Table<BulkImportBlockRowResult>
              size="small"
              rowKey="rowNumber"
              dataSource={importResult.rows}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "Row", dataIndex: "rowNumber", key: "rowNumber", width: 70 },
                { title: "Name", dataIndex: "name", key: "name" },
                {
                  title: "Status",
                  key: "status",
                  width: 100,
                  render: (_, record) =>
                    record.success ? (
                      <Tag color="green">Imported</Tag>
                    ) : (
                      <Tag color="red">Failed</Tag>
                    ),
                },
                { title: "Error", dataIndex: "error", key: "error" },
              ]}
            />
          </div>
        ) : null}
      </Modal>

      <Drawer
        title="Create Block"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<CreateBlockRequest>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="societyId"
            label="Society"
            rules={[{ required: true, message: "Society is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a Society"
              options={(societies ?? []).map((society) => ({ value: society.id, label: society.name }))}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="totalPlots"
            label="Total Plots"
            rules={[{ required: true, message: "Total plots is required" }]}
          >
            <InputNumber<number> min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Block"
        open={editingBlock !== null}
        onClose={() => setEditingBlock(null)}
        destroyOnHidden
        width={420}
      >
        <Form<UpdateBlockRequest>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingBlock) {
              updateMutation.mutate({ id: editingBlock.id, dto: values });
            }
          }}
        >
          <Form.Item
            name="societyId"
            label="Society"
            rules={[{ required: true, message: "Society is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a Society"
              options={(societies ?? []).map((society) => ({ value: society.id, label: society.name }))}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="totalPlots"
            label="Total Plots"
            rules={[{ required: true, message: "Total plots is required" }]}
          >
            <InputNumber<number> min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

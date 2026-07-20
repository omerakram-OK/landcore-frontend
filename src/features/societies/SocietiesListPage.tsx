import { useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSociety,
  deleteSociety,
  listSocieties,
  updateSociety,
} from "../../api/societies";
import { useAuth } from "../../hooks/useAuth";
import type {
  CreateSocietyRequest,
  SocietyResponse,
  UpdateSocietyRequest,
} from "../../types/society";
import { getApiErrorMessage } from "../../utils/errors";

const SOCIETIES_QUERY_KEY = ["societies"] as const;

export default function SocietiesListPage() {
  const queryClient = useQueryClient();
  const { claims } = useAuth();
  const isAdmin = claims?.role === "Admin";

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingSociety, setEditingSociety] = useState<SocietyResponse | null>(null);
  const [createForm] = Form.useForm<CreateSocietyRequest>();
  const [editForm] = Form.useForm<UpdateSocietyRequest>();

  const { data, isLoading } = useQuery({
    queryKey: SOCIETIES_QUERY_KEY,
    queryFn: listSocieties,
  });

  const invalidateSocieties = () => queryClient.invalidateQueries({ queryKey: SOCIETIES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSocietyRequest) => createSociety(dto),
    onSuccess: () => {
      message.success("Society created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateSocieties();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create society.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSocietyRequest }) => updateSociety(id, dto),
    onSuccess: () => {
      message.success("Society updated.");
      setEditingSociety(null);
      void invalidateSocieties();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update society.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSociety(id),
    onSuccess: () => {
      message.success("Society deleted.");
      void invalidateSocieties();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete society.")),
  });

  const openEdit = (record: SocietyResponse) => {
    setEditingSociety(record);
    editForm.setFieldsValue({
      name: record.name,
      address: record.address,
      description: record.description,
      totalPlots: record.totalPlots,
    });
  };

  const columns: TableColumnsType<SocietyResponse> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Target Plots", dataIndex: "totalPlots", key: "totalPlots" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this society?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger loading={deleteMutation.isPending}>
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
          Societies
        </Typography.Title>
        {isAdmin ? (
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Create Society
          </Button>
        ) : null}
      </div>

      <Table<SocietyResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Society"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<CreateSocietyRequest>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. DHA Phase 1" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address / Location"
            rules={[{ required: true, message: "Address is required" }]}
          >
            <Input.TextArea rows={2} />
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
            label="Target Total Plots"
            rules={[{ required: true, message: "Target total plots is required" }]}
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
        title="Edit Society"
        open={editingSociety !== null}
        onClose={() => setEditingSociety(null)}
        destroyOnHidden
        width={420}
      >
        <Form<UpdateSocietyRequest>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingSociety) {
              updateMutation.mutate({ id: editingSociety.id, dto: values });
            }
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address / Location"
            rules={[{ required: true, message: "Address is required" }]}
          >
            <Input.TextArea rows={2} />
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
            label="Target Total Plots"
            rules={[{ required: true, message: "Target total plots is required" }]}
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

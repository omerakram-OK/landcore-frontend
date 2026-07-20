import { useState } from "react";
import { Button, Drawer, Form, Input, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdmin,
  listAdmins,
  reactivateAdmin,
  suspendAdmin,
  updateAdmin,
} from "../../api/admins";
import type { AdminResponse, CreateAdminRequest, UpdateAdminRequest } from "../../types/admin";
import { getApiErrorMessage } from "../../utils/errors";

const ADMINS_QUERY_KEY = ["admins"] as const;

function statusColor(status: AdminResponse["status"]): string {
  return status === "Active" ? "green" : "red";
}

export default function AdminsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminResponse | null>(null);
  const [createForm] = Form.useForm<CreateAdminRequest>();
  const [editForm] = Form.useForm<UpdateAdminRequest>();

  const { data, isLoading } = useQuery({
    queryKey: ADMINS_QUERY_KEY,
    queryFn: listAdmins,
  });

  const invalidateAdmins = () => queryClient.invalidateQueries({ queryKey: ADMINS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (dto: CreateAdminRequest) => createAdmin(dto),
    onSuccess: () => {
      message.success("Admin created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateAdmins();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create admin.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAdminRequest }) => updateAdmin(id, dto),
    onSuccess: () => {
      message.success("Admin updated.");
      setEditingAdmin(null);
      void invalidateAdmins();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update admin.")),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendAdmin(id),
    onSuccess: () => {
      message.success("Admin suspended.");
      void invalidateAdmins();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to suspend admin.")),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => reactivateAdmin(id),
    onSuccess: () => {
      message.success("Admin reactivated.");
      void invalidateAdmins();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to reactivate admin.")),
  });

  const openEdit = (record: AdminResponse) => {
    setEditingAdmin(record);
    editForm.setFieldsValue({
      societyName: record.societyName,
      contactEmail: record.contactEmail,
    });
  };

  const columns: TableColumnsType<AdminResponse> = [
    { title: "Society / Company", dataIndex: "societyName", key: "societyName" },
    { title: "Contact Email", dataIndex: "contactEmail", key: "contactEmail" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AdminResponse["status"]) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          {record.status === "Active" ? (
            <Popconfirm
              title="Suspend this admin?"
              description="This blocks login for the admin and all of its employees."
              onConfirm={() => suspendMutation.mutate(record.id)}
            >
              <Button size="small" danger loading={suspendMutation.isPending}>
                Suspend
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Reactivate this admin?"
              onConfirm={() => reactivateMutation.mutate(record.id)}
            >
              <Button size="small" loading={reactivateMutation.isPending}>
                Reactivate
              </Button>
            </Popconfirm>
          )}
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
          Admins
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create Admin
        </Button>
      </div>

      <Table<AdminResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Admin"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<CreateAdminRequest>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="societyName"
            label="Society / Company Name"
            rules={[{ required: true, message: "Society name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactEmail"
            label="Contact Email"
            rules={[
              { required: true, message: "Contact email is required" },
              { type: "email", message: "Must be a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="initialPassword"
            label="Initial Password"
            rules={[{ required: true, message: "Initial password is required" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Admin"
        open={editingAdmin !== null}
        onClose={() => setEditingAdmin(null)}
        destroyOnHidden
        width={420}
      >
        <Form<UpdateAdminRequest>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingAdmin) {
              updateMutation.mutate({ id: editingAdmin.id, dto: values });
            }
          }}
        >
          <Form.Item
            name="societyName"
            label="Society / Company Name"
            rules={[{ required: true, message: "Society name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactEmail"
            label="Contact Email"
            rules={[
              { required: true, message: "Contact email is required" },
              { type: "email", message: "Must be a valid email" },
            ]}
          >
            <Input />
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

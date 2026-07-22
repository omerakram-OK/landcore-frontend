import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDesignation,
  deleteDesignation,
  listDesignations,
  updateDesignation,
} from "../../api/designations";
import { PERMISSION_MODULES } from "../../types/designation";
import type { DesignationResponse, Permission } from "../../types/designation";
import { getApiErrorMessage } from "../../utils/errors";

const DESIGNATIONS_QUERY_KEY = ["designations"] as const;

type PermissionsState = Record<string, string[]>;

function permissionsToState(permissions: Permission[]): PermissionsState {
  const state: PermissionsState = {};
  for (const permission of permissions) {
    state[permission.module] = permission.actions;
  }
  return state;
}

function stateToPermissions(state: PermissionsState): Permission[] {
  return Object.entries(state)
    .filter(([, actions]) => actions.length > 0)
    .map(([module, actions]) => ({ module, actions }));
}

interface PermissionGridProps {
  value: PermissionsState;
  onChange: (value: PermissionsState) => void;
}

function PermissionGrid({ value, onChange }: PermissionGridProps) {
  const handleModuleChange = (module: string, actions: string[]) => {
    onChange({ ...value, [module]: actions });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {PERMISSION_MODULES.map(({ module, actions }) => (
        <div
          key={module}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            paddingBottom: 8,
          }}
        >
          <Typography.Text strong style={{ width: 140 }}>
            {module}
          </Typography.Text>
          <Checkbox.Group
            options={actions.map((action) => ({ label: action, value: action }))}
            value={value[module] ?? []}
            onChange={(checked) => handleModuleChange(module, checked as string[])}
          />
        </div>
      ))}
    </div>
  );
}

export default function DesignationsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationResponse | null>(null);
  const [searchText, setSearchText] = useState("");
  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string }>();
  const [createPermissions, setCreatePermissions] = useState<PermissionsState>({});
  const [editPermissions, setEditPermissions] = useState<PermissionsState>({});

  const { data, isLoading } = useQuery({
    queryKey: DESIGNATIONS_QUERY_KEY,
    queryFn: listDesignations,
  });

  const invalidateDesignations = () =>
    queryClient.invalidateQueries({ queryKey: DESIGNATIONS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (values: { name: string }) =>
      createDesignation({ name: values.name, permissions: stateToPermissions(createPermissions) }),
    onSuccess: () => {
      message.success("Designation created.");
      setCreateOpen(false);
      createForm.resetFields();
      setCreatePermissions({});
      void invalidateDesignations();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create designation.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateDesignation(id, { name, permissions: stateToPermissions(editPermissions) }),
    onSuccess: () => {
      message.success("Designation updated.");
      setEditingDesignation(null);
      void invalidateDesignations();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update designation.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDesignation(id),
    onSuccess: () => {
      message.success("Designation deleted.");
      void invalidateDesignations();
    },
    onError: (error) =>
      message.error(
        getApiErrorMessage(
          error,
          "Failed to delete designation. It may still be assigned to an active Employee.",
        ),
      ),
  });

  const openEdit = (record: DesignationResponse) => {
    setEditingDesignation(record);
    setEditPermissions(permissionsToState(record.permissions));
    editForm.setFieldsValue({ name: record.name });
  };

  useEffect(() => {
    if (editingDesignation === null) {
      editForm.resetFields();
      setEditPermissions({});
    }
  }, [editingDesignation, editForm]);

  const filteredDesignations = (data ?? []).filter((designation) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return designation.name.toLowerCase().includes(term);
  });

  const columns: TableColumnsType<DesignationResponse> = [
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions: Permission[]) =>
        permissions.length === 0
          ? "—"
          : permissions.map((permission) => `${permission.module} (${permission.actions.join(", ")})`).join("; "),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this designation?"
            description="Fails if any active Employee is still assigned to it."
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
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
          Designations
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Create Designation
        </Button>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by name"
        style={{ width: 320, marginBottom: 16 }}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table<DesignationResponse> rowKey="id" loading={isLoading} dataSource={filteredDesignations} columns={columns} />

      <Drawer
        title="Create Designation"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={520}
      >
        <Form<{ name: string }>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Permissions">
            <PermissionGrid value={createPermissions} onChange={setCreatePermissions} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Designation"
        open={editingDesignation !== null}
        onClose={() => setEditingDesignation(null)}
        destroyOnHidden
        width={520}
      >
        <Form<{ name: string }>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingDesignation) {
              updateMutation.mutate({ id: editingDesignation.id, name: values.name });
            }
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Permissions">
            <PermissionGrid value={editPermissions} onChange={setEditPermissions} />
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

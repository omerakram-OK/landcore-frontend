import { useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, deleteClient, listClients, updateClient } from "../../api/clients";
import { listAgents } from "../../api/agents";
import type { ClientResponse, CreateClientRequest, UpdateClientRequest } from "../../types/client";
import { getApiErrorMessage } from "../../utils/errors";

const CLIENTS_QUERY_KEY = ["clients"] as const;
const AGENTS_QUERY_KEY = ["agents"] as const;

interface ClientFormValues {
  fullName: string;
  cnic: string;
  phones: string[];
  email: string;
  address: string;
  emergencyContact?: string;
  linkedAgentId?: string;
  coOwnerClientIds?: string[];
  enablePortalAccess: boolean;
  password?: string;
  enableMarketplaceView?: boolean;
  enableMarketplacePublish?: boolean;
}

export default function ClientsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientResponse | null>(null);
  const [searchText, setSearchText] = useState("");
  const [createForm] = Form.useForm<ClientFormValues>();
  const [editForm] = Form.useForm<ClientFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: listClients,
  });

  const { data: agents } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: listAgents,
  });

  const agentOptions = (agents ?? []).map((agent) => ({ label: agent.fullName, value: agent.id }));

  const invalidateClients = () => queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });

  const toRequest = (values: ClientFormValues): CreateClientRequest | UpdateClientRequest => ({
    fullName: values.fullName,
    cnic: values.cnic,
    phones: values.phones.filter((phone) => phone.trim().length > 0),
    email: values.email,
    address: values.address,
    emergencyContact: values.emergencyContact || null,
    linkedAgentId: values.linkedAgentId || null,
    coOwnerClientIds: values.coOwnerClientIds ?? null,
    enablePortalAccess: values.enablePortalAccess ?? false,
    password: values.password || null,
    enableMarketplaceView: values.enableMarketplaceView ?? false,
    enableMarketplacePublish: values.enableMarketplacePublish ?? false,
  });

  const createMutation = useMutation({
    mutationFn: (values: ClientFormValues) => createClient(toRequest(values)),
    onSuccess: () => {
      message.success("Client created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateClients();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create client.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ClientFormValues }) =>
      updateClient(id, toRequest(values)),
    onSuccess: () => {
      message.success("Client updated.");
      setEditingClient(null);
      void invalidateClients();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update client.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      message.success("Client deleted.");
      void invalidateClients();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete client.")),
  });

  const openEdit = (record: ClientResponse) => {
    setEditingClient(record);
    editForm.setFieldsValue({
      fullName: record.fullName,
      cnic: record.cnic,
      phones: record.phones.length > 0 ? record.phones : [""],
      email: record.email,
      address: record.address,
      emergencyContact: record.emergencyContact || undefined,
      linkedAgentId: record.linkedAgentId ?? undefined,
      coOwnerClientIds: record.coOwnerClientIds,
      enablePortalAccess: record.portalAccessEnabled,
      password: undefined,
      enableMarketplaceView: record.marketplaceViewEnabled,
      enableMarketplacePublish: record.marketplacePublishEnabled,
    });
  };

  const coOwnerOptions = (excludeId?: string) =>
    (data ?? [])
      .filter((client) => client.id !== excludeId)
      .map((client) => ({ label: client.fullName, value: client.id }));

  const columns: TableColumnsType<ClientResponse> = [
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    { title: "CNIC", dataIndex: "cnic", key: "cnic" },
    {
      title: "Phones",
      dataIndex: "phones",
      key: "phones",
      render: (phones: string[]) => phones.join(", "),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Portal Access",
      dataIndex: "portalAccessEnabled",
      key: "portalAccessEnabled",
      render: (enabled: boolean) =>
        enabled ? <Tag color="success">Enabled</Tag> : <Tag>Disabled</Tag>,
    },
    {
      title: "Marketplace",
      key: "marketplace",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.marketplaceViewEnabled ? "blue" : "default"}>
            View {record.marketplaceViewEnabled ? "On" : "Off"}
          </Tag>
          <Tag color={record.marketplacePublishEnabled ? "cyan" : "default"}>
            Publish {record.marketplacePublishEnabled ? "On" : "Off"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this client?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredClients = (data ?? []).filter((client) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return (
      client.fullName.toLowerCase().includes(term) ||
      client.cnic.toLowerCase().includes(term) ||
      client.phones.some((phone) => phone.toLowerCase().includes(term)) ||
      client.email.toLowerCase().includes(term)
    );
  });

  const clientFormFields = (excludeId?: string, hasExistingPassword?: boolean) => (
    <>
      <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: "Full name is required" }]}>
        <Input />
      </Form.Item>
      <Form.Item name="cnic" label="CNIC" rules={[{ required: true, message: "CNIC is required" }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Phones" required>
        <Form.List name="phones" initialValue={[""]}>
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: "100%" }}>
              {fields.map((field) => (
                <Space key={field.key} align="baseline" style={{ width: "100%" }}>
                  <Form.Item
                    {...field}
                    rules={[{ required: true, message: "Phone is required" }]}
                    style={{ marginBottom: 8, flex: 1 }}
                  >
                    <Input placeholder="Phone number" />
                  </Form.Item>
                  {fields.length > 1 ? (
                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                  ) : null}
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                Add Phone
              </Button>
            </Space>
          )}
        </Form.List>
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Email is required" },
          { type: "email", message: "Must be a valid email" },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="address" label="Address" rules={[{ required: true, message: "Address is required" }]}>
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item name="emergencyContact" label="Emergency Contact (optional)">
        <Input />
      </Form.Item>
      <Form.Item name="linkedAgentId" label="Linked Agent (optional)">
        <Select
          allowClear
          showSearch
          placeholder="Select an agent"
          options={agentOptions}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Form.Item>
      <Form.Item name="coOwnerClientIds" label="Co-Owners (optional)">
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Select co-owner clients"
          options={coOwnerOptions(excludeId)}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Form.Item>
      <Form.Item name="enablePortalAccess" label="Client Portal Access" valuePropName="checked">
        <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prev: ClientFormValues, curr: ClientFormValues) =>
          prev.enablePortalAccess !== curr.enablePortalAccess
        }
      >
        {({ getFieldValue }) =>
          getFieldValue("enablePortalAccess") ? (
            <Form.Item
              name="password"
              label={hasExistingPassword ? "New Password (leave blank to keep current)" : "Password"}
              rules={[
                { required: !hasExistingPassword, message: "Password is required to enable portal access" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password
                autoComplete="new-password"
                placeholder={hasExistingPassword ? "Leave blank to keep current password" : "Set a login password"}
              />
            </Form.Item>
          ) : null
        }
      </Form.Item>
      <Form.Item name="enableMarketplaceView" label="Can View Marketplace" valuePropName="checked">
        <Switch checkedChildren="On" unCheckedChildren="Off" />
      </Form.Item>
      <Form.Item name="enableMarketplacePublish" label="Can Publish to Marketplace" valuePropName="checked">
        <Switch checkedChildren="On" unCheckedChildren="Off" />
      </Form.Item>
    </>
  );

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
          Clients
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Create Client
        </Button>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by name, CNIC, phone, or email"
        style={{ width: 320, marginBottom: 16 }}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table<ClientResponse> rowKey="id" loading={isLoading} dataSource={filteredClients} columns={columns} />

      <Drawer
        title="Create Client"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={460}
      >
        <Form<ClientFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          {clientFormFields()}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Client"
        open={editingClient !== null}
        onClose={() => setEditingClient(null)}
        destroyOnHidden
        width={460}
      >
        <Form<ClientFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingClient) {
              updateMutation.mutate({ id: editingClient.id, values });
            }
          }}
        >
          {clientFormFields(editingClient?.id, editingClient?.portalAccessEnabled)}
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

import { useState } from "react";
import { DeleteOutlined, DollarOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { createAgent, deleteAgent, getAgentCommissionHistory, listAgents, updateAgent } from "../../api/agents";
import type {
  AgentCommissionRecordResponse,
  AgentResponse,
  CommissionType,
  CreateAgentRequest,
  UpdateAgentRequest,
} from "../../types/agent";
import { getApiErrorMessage } from "../../utils/errors";

const AGENTS_QUERY_KEY = ["agents"] as const;

const COMMISSION_TYPE_OPTIONS: Array<{ label: string; value: CommissionType }> = [
  { label: "Percentage", value: "Percentage" },
  { label: "Fixed", value: "Fixed" },
];

function commissionValueLabel(agent: AgentResponse): string {
  return agent.commissionType === "Percentage"
    ? `${agent.commissionValue}%`
    : `PKR ${agent.commissionValue.toLocaleString()}`;
}

function commissionRecordAmountLabel(record: AgentCommissionRecordResponse): string {
  return record.commissionType === "Percentage"
    ? `PKR ${record.amount.toLocaleString()} (${record.commissionValue}%)`
    : `PKR ${record.amount.toLocaleString()}`;
}

interface AgentFormValues {
  fullName: string;
  cnic: string;
  phone: string;
  email: string;
  address: string;
  commissionType: CommissionType;
  commissionValue: number;
  enablePortalAccess: boolean;
  password?: string;
}

export default function AgentsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentResponse | null>(null);
  const [commissionsAgent, setCommissionsAgent] = useState<AgentResponse | null>(null);
  const [searchText, setSearchText] = useState("");
  const [createForm] = Form.useForm<AgentFormValues>();
  const [editForm] = Form.useForm<AgentFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: listAgents,
  });

  const { data: commissionRecords, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ["agents", commissionsAgent?.id, "commissions"] as const,
    queryFn: () => getAgentCommissionHistory(commissionsAgent!.id),
    enabled: commissionsAgent !== null,
  });

  const invalidateAgents = () => queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });

  const toRequest = (values: AgentFormValues): CreateAgentRequest | UpdateAgentRequest => ({
    fullName: values.fullName,
    cnic: values.cnic,
    phone: values.phone,
    email: values.email,
    address: values.address,
    commissionType: values.commissionType,
    commissionValue: values.commissionValue,
    enablePortalAccess: values.enablePortalAccess ?? false,
    password: values.password || null,
  });

  const createMutation = useMutation({
    mutationFn: (values: AgentFormValues) => createAgent(toRequest(values)),
    onSuccess: () => {
      message.success("Agent created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateAgents();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create agent.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AgentFormValues }) =>
      updateAgent(id, toRequest(values)),
    onSuccess: () => {
      message.success("Agent updated.");
      setEditingAgent(null);
      void invalidateAgents();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update agent.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => {
      message.success("Agent deleted.");
      void invalidateAgents();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete agent.")),
  });

  const openEdit = (record: AgentResponse) => {
    setEditingAgent(record);
    editForm.setFieldsValue({
      fullName: record.fullName,
      cnic: record.cnic,
      phone: record.phone,
      email: record.email,
      address: record.address,
      commissionType: record.commissionType,
      commissionValue: record.commissionValue,
      enablePortalAccess: record.portalAccessEnabled,
      password: undefined,
    });
  };

  const columns: TableColumnsType<AgentResponse> = [
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    { title: "CNIC", dataIndex: "cnic", key: "cnic" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Commission", key: "commission", render: (_, record) => commissionValueLabel(record) },
    {
      title: "Portal Access",
      dataIndex: "portalAccessEnabled",
      key: "portalAccessEnabled",
      render: (enabled: boolean) => (enabled ? <Tag color="success">Enabled</Tag> : <Tag>Disabled</Tag>),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<DollarOutlined />} onClick={() => setCommissionsAgent(record)}>
            Commissions
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm title="Delete this agent?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredAgents = (data ?? []).filter((agent) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return (
      agent.fullName.toLowerCase().includes(term) ||
      agent.cnic.toLowerCase().includes(term) ||
      agent.phone.toLowerCase().includes(term) ||
      agent.email.toLowerCase().includes(term)
    );
  });

  const commissionFields = (
    <>
      <Form.Item
        name="commissionType"
        label="Commission Type"
        rules={[{ required: true, message: "Commission type is required" }]}
      >
        <Select options={COMMISSION_TYPE_OPTIONS} placeholder="Select a commission type" />
      </Form.Item>
      <Form.Item
        name="commissionValue"
        label="Commission Value"
        rules={[{ required: true, message: "Commission value is required" }]}
      >
        <InputNumber<number> min={0} style={{ width: "100%" }} />
      </Form.Item>
    </>
  );

  const portalAccessFields = (hasExistingPassword?: boolean) => (
    <>
      <Form.Item name="enablePortalAccess" label="Agent Portal Access" valuePropName="checked">
        <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prev: AgentFormValues, curr: AgentFormValues) =>
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
          Agents
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Create Agent
        </Button>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by name, CNIC, phone, or email"
        style={{ width: 320, marginBottom: 16 }}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table<AgentResponse> rowKey="id" loading={isLoading} dataSource={filteredAgents} columns={columns} />

      <Drawer
        title="Create Agent"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<AgentFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Full name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="cnic" label="CNIC" rules={[{ required: true, message: "CNIC is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Phone is required" }]}>
            <Input />
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
          {commissionFields}
          {portalAccessFields()}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Agent"
        open={editingAgent !== null}
        onClose={() => setEditingAgent(null)}
        destroyOnHidden
        width={420}
      >
        <Form<AgentFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingAgent) {
              updateMutation.mutate({ id: editingAgent.id, values });
            }
          }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Full name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="cnic" label="CNIC" rules={[{ required: true, message: "CNIC is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Phone is required" }]}>
            <Input />
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
          {commissionFields}
          {portalAccessFields(Boolean(editingAgent?.portalAccessEnabled))}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={commissionsAgent ? `Commissions — ${commissionsAgent.fullName}` : "Commissions"}
        open={commissionsAgent !== null}
        onClose={() => setCommissionsAgent(null)}
        destroyOnHidden
        width={480}
      >
        <Table<AgentCommissionRecordResponse>
          rowKey="id"
          loading={isLoadingCommissions}
          dataSource={commissionRecords ?? []}
          pagination={false}
          locale={{ emptyText: <Empty description="No commissions earned yet" /> }}
          columns={[
            {
              title: "Earned",
              dataIndex: "earnedAt",
              key: "earnedAt",
              render: (value: string) => dayjs(value).format("DD MMM YYYY"),
            },
            { title: "Plot", dataIndex: "plotNumber", key: "plotNumber" },
            {
              title: "Source",
              dataIndex: "sourceType",
              key: "sourceType",
              render: (value: string) => (
                <Tag color={value === "Resale" ? "purple" : "blue"}>{value}</Tag>
              ),
            },
            {
              title: "Amount",
              key: "amount",
              render: (_, record) => commissionRecordAmountLabel(record),
            },
          ]}
        />
      </Drawer>
    </div>
  );
}

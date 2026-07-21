import { useState } from "react";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAgent, deleteAgent, listAgents, updateAgent } from "../../api/agents";
import type { AgentResponse, CommissionType, CreateAgentRequest, UpdateAgentRequest } from "../../types/agent";
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

export default function AgentsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentResponse | null>(null);
  const [createForm] = Form.useForm<CreateAgentRequest>();
  const [editForm] = Form.useForm<UpdateAgentRequest>();

  const { data, isLoading } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: listAgents,
  });

  const invalidateAgents = () => queryClient.invalidateQueries({ queryKey: AGENTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (dto: CreateAgentRequest) => createAgent(dto),
    onSuccess: () => {
      message.success("Agent created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateAgents();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create agent.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAgentRequest }) => updateAgent(id, dto),
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
    });
  };

  const columns: TableColumnsType<AgentResponse> = [
    { title: "Full Name", dataIndex: "fullName", key: "fullName" },
    { title: "CNIC", dataIndex: "cnic", key: "cnic" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Commission", key: "commission", render: (_, record) => commissionValueLabel(record) },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
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

      <Table<AgentResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Agent"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<CreateAgentRequest>
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
        <Form<UpdateAgentRequest>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingAgent) {
              updateMutation.mutate({ id: editingAgent.id, dto: values });
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

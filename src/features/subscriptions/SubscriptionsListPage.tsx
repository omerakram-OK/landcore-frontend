import { useState } from "react";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { listAdmins } from "../../api/admins";
import {
  activateSubscription,
  createSubscription,
  listSubscriptions,
  reactivateSubscription,
  suspendSubscription,
  updateSubscription,
} from "../../api/subscriptions";
import type {
  CreateSubscriptionRequest,
  SubscriptionPlan,
  SubscriptionResponse,
  UpdateSubscriptionRequest,
} from "../../types/subscription";
import { getApiErrorMessage } from "../../utils/errors";

const SUBSCRIPTIONS_QUERY_KEY = ["subscriptions"] as const;
const ADMINS_QUERY_KEY = ["admins"] as const;

const PLAN_OPTIONS: Array<{ label: string; value: SubscriptionPlan }> = [
  { label: "Monthly", value: "Monthly" },
  { label: "Yearly", value: "Yearly" },
];

interface CreateSubscriptionFormValues {
  adminId: string;
  plan: SubscriptionPlan;
  feeAmount: number;
  startDate: Dayjs;
  nextDueDate: Dayjs;
}

interface EditSubscriptionFormValues {
  plan: SubscriptionPlan;
  feeAmount: number;
  startDate: Dayjs;
  nextDueDate: Dayjs;
}

function statusColor(status: SubscriptionResponse["status"]): string {
  if (status === "Active") return "green";
  if (status === "Overdue") return "orange";
  return "red";
}

export default function SubscriptionsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionResponse | null>(null);
  const [createForm] = Form.useForm<CreateSubscriptionFormValues>();
  const [editForm] = Form.useForm<EditSubscriptionFormValues>();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: SUBSCRIPTIONS_QUERY_KEY,
    queryFn: listSubscriptions,
  });

  const { data: admins } = useQuery({
    queryKey: ADMINS_QUERY_KEY,
    queryFn: listAdmins,
  });

  const adminNameById = new Map((admins ?? []).map((admin) => [admin.id, admin.societyName]));

  const invalidateSubscriptions = () =>
    queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSubscriptionRequest) => createSubscription(dto),
    onSuccess: () => {
      message.success("Subscription created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateSubscriptions();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create subscription.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubscriptionRequest }) =>
      updateSubscription(id, dto),
    onSuccess: () => {
      message.success("Subscription updated.");
      setEditingSubscription(null);
      void invalidateSubscriptions();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update subscription.")),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateSubscription(id),
    onSuccess: () => {
      message.success("Subscription activated.");
      void invalidateSubscriptions();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to activate subscription.")),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendSubscription(id),
    onSuccess: () => {
      message.success("Subscription suspended.");
      void invalidateSubscriptions();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to suspend subscription.")),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => reactivateSubscription(id),
    onSuccess: () => {
      message.success("Subscription reactivated.");
      void invalidateSubscriptions();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to reactivate subscription.")),
  });

  const openEdit = (record: SubscriptionResponse) => {
    setEditingSubscription(record);
    editForm.setFieldsValue({
      plan: record.plan,
      feeAmount: record.feeAmount,
      startDate: dayjs(record.startDate),
      nextDueDate: dayjs(record.nextDueDate),
    });
  };

  const columns: TableColumnsType<SubscriptionResponse> = [
    {
      title: "Admin",
      dataIndex: "adminId",
      key: "adminId",
      render: (adminId: string) => adminNameById.get(adminId) ?? adminId,
    },
    { title: "Plan", dataIndex: "plan", key: "plan" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: SubscriptionResponse["status"]) => (
        <Tag color={statusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Fee",
      dataIndex: "feeAmount",
      key: "feeAmount",
      render: (feeAmount: number) => `PKR ${feeAmount.toLocaleString()}`,
    },
    {
      title: "Next Due Date",
      dataIndex: "nextDueDate",
      key: "nextDueDate",
      render: (nextDueDate: string) => dayjs(nextDueDate).format("DD-MMM-YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          {record.status !== "Active" ? (
            <Popconfirm title="Activate this subscription?" onConfirm={() => activateMutation.mutate(record.id)}>
              <Button size="small" loading={activateMutation.isPending}>
                Activate
              </Button>
            </Popconfirm>
          ) : null}
          {record.status !== "Suspended" ? (
            <Popconfirm
              title="Suspend this subscription?"
              description="This blocks login for the linked admin and its employees."
              onConfirm={() => suspendMutation.mutate(record.id)}
            >
              <Button size="small" danger loading={suspendMutation.isPending}>
                Suspend
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="Reactivate this subscription?" onConfirm={() => reactivateMutation.mutate(record.id)}>
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
          Subscriptions
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Create Subscription
        </Button>
      </div>

      <Table<SubscriptionResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={subscriptions}
        columns={columns}
      />

      <Drawer
        title="Create Subscription"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<CreateSubscriptionFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) =>
            createMutation.mutate({
              adminId: values.adminId,
              plan: values.plan,
              feeAmount: values.feeAmount,
              startDate: values.startDate.toISOString(),
              nextDueDate: values.nextDueDate.toISOString(),
            })
          }
        >
          <Form.Item name="adminId" label="Admin" rules={[{ required: true, message: "Admin is required" }]}>
            <Select
              showSearch
              placeholder="Select an admin"
              options={(admins ?? []).map((admin) => ({ label: admin.societyName, value: admin.id }))}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="plan" label="Plan" rules={[{ required: true, message: "Plan is required" }]}>
            <Select options={PLAN_OPTIONS} placeholder="Select a plan" />
          </Form.Item>
          <Form.Item
            name="feeAmount"
            label="Fee Amount (PKR)"
            rules={[{ required: true, message: "Fee amount is required" }]}
          >
            <InputNumber<number> min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Start date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="nextDueDate"
            label="Next Due Date"
            rules={[{ required: true, message: "Next due date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Subscription"
        open={editingSubscription !== null}
        onClose={() => setEditingSubscription(null)}
        destroyOnHidden
        width={420}
      >
        <Form<EditSubscriptionFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingSubscription) {
              updateMutation.mutate({
                id: editingSubscription.id,
                dto: {
                  plan: values.plan,
                  feeAmount: values.feeAmount,
                  startDate: values.startDate.toISOString(),
                  nextDueDate: values.nextDueDate.toISOString(),
                },
              });
            }
          }}
        >
          <Form.Item name="plan" label="Plan" rules={[{ required: true, message: "Plan is required" }]}>
            <Select options={PLAN_OPTIONS} placeholder="Select a plan" />
          </Form.Item>
          <Form.Item
            name="feeAmount"
            label="Fee Amount (PKR)"
            rules={[{ required: true, message: "Fee amount is required" }]}
          >
            <InputNumber<number> min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Start date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="nextDueDate"
            label="Next Due Date"
            rules={[{ required: true, message: "Next due date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
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

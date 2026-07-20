import { useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
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
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountReconciliation,
  listBankAccounts,
  updateBankAccount,
} from "../../api/bankAccounts";
import type {
  BankAccountReconciliationReport,
  BankAccountResponse,
  CreateBankAccountRequest,
  PaymentModeBreakdown,
  UpdateBankAccountRequest,
} from "../../types/bankAccount";
import { getApiErrorMessage } from "../../utils/errors";

const { RangePicker } = DatePicker;

const BANK_ACCOUNTS_QUERY_KEY = ["bankAccounts"] as const;

interface BankAccountFormValues {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export default function BankAccountsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountResponse | null>(null);
  const [reconcilingAccount, setReconcilingAccount] = useState<BankAccountResponse | null>(null);
  const [reconcileRange, setReconcileRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(90, "day").startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [createForm] = Form.useForm<BankAccountFormValues>();
  const [editForm] = Form.useForm<BankAccountFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: BANK_ACCOUNTS_QUERY_KEY,
    queryFn: listBankAccounts,
  });

  const invalidateBankAccounts = () =>
    queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (values: BankAccountFormValues) => {
      const dto: CreateBankAccountRequest = { ...values };
      return createBankAccount(dto);
    },
    onSuccess: () => {
      message.success("Bank account created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateBankAccounts();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create bank account.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BankAccountFormValues }) => {
      const dto: UpdateBankAccountRequest = { ...values };
      return updateBankAccount(id, dto);
    },
    onSuccess: () => {
      message.success("Bank account updated.");
      setEditingAccount(null);
      void invalidateBankAccounts();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update bank account.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBankAccount(id),
    onSuccess: () => {
      message.success("Bank account deleted.");
      void invalidateBankAccounts();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete bank account.")),
  });

  const {
    data: reconciliation,
    isFetching: isReconciliationLoading,
    refetch: refetchReconciliation,
  } = useQuery<BankAccountReconciliationReport>({
    queryKey: [
      "bankAccountReconciliation",
      reconcilingAccount?.id,
      reconcileRange[0].toISOString(),
      reconcileRange[1].toISOString(),
    ] as const,
    queryFn: () =>
      getBankAccountReconciliation(
        reconcilingAccount!.id,
        reconcileRange[0].toISOString(),
        reconcileRange[1].toISOString(),
      ),
    enabled: reconcilingAccount !== null,
  });

  const openEdit = (record: BankAccountResponse) => {
    setEditingAccount(record);
    editForm.setFieldsValue({
      accountName: record.accountName,
      accountNumber: record.accountNumber,
      bankName: record.bankName,
    });
  };

  const openReconciliation = (record: BankAccountResponse) => {
    setReconcilingAccount(record);
  };

  const columns: TableColumnsType<BankAccountResponse> = [
    { title: "Account Name", dataIndex: "accountName", key: "accountName" },
    { title: "Account Number", dataIndex: "accountNumber", key: "accountNumber" },
    { title: "Bank Name", dataIndex: "bankName", key: "bankName" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => openReconciliation(record)}>
            Reconciliation
          </Button>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this bank account?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const accountFormFields = (
    <>
      <Form.Item
        name="accountName"
        label="Account Name"
        rules={[{ required: true, message: "Account name is required" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="accountNumber"
        label="Account Number"
        rules={[{ required: true, message: "Account number is required" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="bankName"
        label="Bank Name"
        rules={[{ required: true, message: "Bank name is required" }]}
      >
        <Input />
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
          Bank Accounts
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create Bank Account
        </Button>
      </div>

      <Table<BankAccountResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Bank Account"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<BankAccountFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          {accountFormFields}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Bank Account"
        open={editingAccount !== null}
        onClose={() => setEditingAccount(null)}
        destroyOnHidden
        width={420}
      >
        <Form<BankAccountFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingAccount) {
              updateMutation.mutate({ id: editingAccount.id, values });
            }
          }}
        >
          {accountFormFields}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={
          reconcilingAccount
            ? `Reconciliation — ${reconcilingAccount.accountName}`
            : "Reconciliation"
        }
        open={reconcilingAccount !== null}
        onClose={() => setReconcilingAccount(null)}
        destroyOnHidden
        width={480}
      >
        {reconcilingAccount ? (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Space>
              <RangePicker
                value={reconcileRange}
                onChange={(range) => {
                  if (range && range[0] && range[1]) {
                    setReconcileRange([range[0], range[1]]);
                  }
                }}
                allowClear={false}
              />
              <Button onClick={() => void refetchReconciliation()} loading={isReconciliationLoading}>
                Refresh
              </Button>
            </Space>

            {reconciliation ? (
              <>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Account Number">
                    {reconciliation.accountNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bank">{reconciliation.bankName}</Descriptions.Item>
                  <Descriptions.Item label="From">
                    {dayjs(reconciliation.from).format("DD-MMM-YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="To">
                    {dayjs(reconciliation.to).format("DD-MMM-YYYY")}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Payments">
                    {reconciliation.totalPaymentCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Recorded Amount">
                    {reconciliation.totalRecordedAmount}
                  </Descriptions.Item>
                </Descriptions>

                <Typography.Text strong>By Payment Mode</Typography.Text>
                <Table<PaymentModeBreakdown>
                  size="small"
                  rowKey="mode"
                  pagination={false}
                  dataSource={reconciliation.byMode}
                  columns={[
                    { title: "Mode", dataIndex: "mode", key: "mode", render: (mode: string) => <Tag>{mode}</Tag> },
                    { title: "Count", dataIndex: "count", key: "count" },
                    { title: "Amount", dataIndex: "amount", key: "amount" },
                  ]}
                />

                <Typography.Text type="secondary">{reconciliation.note}</Typography.Text>
              </>
            ) : (
              <Empty description="No reconciliation data" />
            )}
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}

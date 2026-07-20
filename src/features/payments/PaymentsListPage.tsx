import { useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
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
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  applyInstallmentDiscount,
  createInstallmentPlan,
  listInstallmentPlans,
} from "../../api/installments";
import { listPayments, recordPayment } from "../../api/payments";
import { bounceCheque, clearCheque, listCheques } from "../../api/cheques";
import { getReceipt } from "../../api/receipts";
import { listBankAccounts } from "../../api/bankAccounts";
import { listBookings } from "../../api/bookings";
import { listPlots } from "../../api/plots";
import { useAuth } from "../../hooks/useAuth";
import { isApprovalRequestResponse } from "../../types/approval";
import type {
  ApplyDiscountRequest,
  CreateInstallmentPlanRequest,
  InstallmentDto,
  InstallmentPlanResponse,
  InstallmentStatus,
} from "../../types/installment";
import type { PaymentMode, PaymentResponse, RecordPaymentRequest } from "../../types/payment";
import type { BounceChequeRequest, ChequeResponse, ChequeStatus } from "../../types/cheque";
import { getApiErrorMessage } from "../../utils/errors";

const INSTALLMENT_PLANS_QUERY_KEY = ["installmentPlans"] as const;
const PAYMENTS_QUERY_KEY = ["payments"] as const;
const CHEQUES_QUERY_KEY = ["cheques"] as const;
const BANK_ACCOUNTS_QUERY_KEY = ["bankAccounts"] as const;
const BOOKINGS_QUERY_KEY = ["bookings"] as const;
const PLOTS_QUERY_KEY = ["plots"] as const;

const PAYMENT_MODE_OPTIONS: Array<{ label: string; value: PaymentMode }> = [
  { label: "Cash", value: "Cash" },
  { label: "Bank", value: "Bank" },
  { label: "Cheque", value: "Cheque" },
];

interface RecordPaymentFormValues {
  installmentPlanId: string;
  installmentSeqNo: number;
  amount: number;
  mode: PaymentMode;
  bankAccountId?: string;
  date: Dayjs;
  chequeNumber?: string;
  chequeBank?: string;
  chequeDueDate?: Dayjs;
  chequeDepositDate?: Dayjs;
}

interface CreatePlanFormValues {
  bookingId: string;
  downPayment: number;
  earlyPaymentDiscount?: number;
  installments: Array<{ dueDate: Dayjs; amount: number }>;
}

interface BounceFormValues {
  penaltyAmount: number;
  notes?: string;
}

interface DiscountFormValues {
  discountAmount: number;
  notes?: string;
  justification?: string;
}

function installmentStatusColor(status: InstallmentStatus): string {
  switch (status) {
    case "Paid":
      return "green";
    case "PartiallyPaid":
      return "blue";
    case "Late":
      return "orange";
    case "Missed":
      return "red";
    default:
      return "default";
  }
}

function chequeStatusColor(status: ChequeStatus): string {
  switch (status) {
    case "Cleared":
      return "green";
    case "Bounced":
      return "red";
    default:
      return "blue";
  }
}

function modeColor(mode: PaymentMode): string {
  switch (mode) {
    case "Cash":
      return "green";
    case "Bank":
      return "blue";
    case "Cheque":
      return "purple";
    default:
      return "default";
  }
}

export default function PaymentsListPage() {
  const queryClient = useQueryClient();
  const { claims } = useAuth();
  const isAdmin = claims?.role === "Admin";

  const [isRecordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [isCreatePlanOpen, setCreatePlanOpen] = useState(false);
  const [viewingInstallmentsPlan, setViewingInstallmentsPlan] = useState<InstallmentPlanResponse | null>(null);
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<PaymentResponse | null>(null);
  const [viewingCheque, setViewingCheque] = useState<ChequeResponse | null>(null);
  const [bouncingCheque, setBouncingCheque] = useState<ChequeResponse | null>(null);
  const [discountingPlan, setDiscountingPlan] = useState<InstallmentPlanResponse | null>(null);

  const [recordPaymentForm] = Form.useForm<RecordPaymentFormValues>();
  const [createPlanForm] = Form.useForm<CreatePlanFormValues>();
  const [bounceForm] = Form.useForm<BounceFormValues>();
  const [discountForm] = Form.useForm<DiscountFormValues>();

  const selectedPlanId = Form.useWatch("installmentPlanId", recordPaymentForm);
  const selectedMode = Form.useWatch("mode", recordPaymentForm);

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: INSTALLMENT_PLANS_QUERY_KEY,
    queryFn: listInstallmentPlans,
  });

  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: listPayments,
  });

  const { data: cheques } = useQuery({
    queryKey: CHEQUES_QUERY_KEY,
    queryFn: listCheques,
  });

  const { data: bankAccounts } = useQuery({
    queryKey: BANK_ACCOUNTS_QUERY_KEY,
    queryFn: listBankAccounts,
  });

  const { data: bookings } = useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: listBookings,
  });

  const { data: plots } = useQuery({
    queryKey: PLOTS_QUERY_KEY,
    queryFn: listPlots,
  });

  const { data: viewingReceipt, isFetching: isReceiptLoading } = useQuery({
    queryKey: ["receipt", viewingReceiptPayment?.receiptId] as const,
    queryFn: () => getReceipt(viewingReceiptPayment!.receiptId),
    enabled: viewingReceiptPayment !== null,
  });

  const planById = new Map((plans ?? []).map((plan) => [plan.id, plan]));
  const bookingById = new Map((bookings ?? []).map((booking) => [booking.id, booking]));
  const plotNumberById = new Map((plots ?? []).map((plot) => [plot.id, plot.plotNumber]));
  const bankAccountLabelById = new Map(
    (bankAccounts ?? []).map((account) => [account.id, `${account.accountName} (${account.bankName})`]),
  );
  const chequeByPaymentId = new Map((cheques ?? []).map((cheque) => [cheque.paymentId, cheque]));

  const plotRefForPlan = (planId: string): string => {
    const plan = planById.get(planId);
    if (!plan) return planId;
    const booking = bookingById.get(plan.bookingId);
    if (!booking) return plan.bookingId;
    return plotNumberById.get(booking.plotId) ?? booking.plotId;
  };

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: INSTALLMENT_PLANS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CHEQUES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: PLOTS_QUERY_KEY });
  };

  const recordPaymentMutation = useMutation({
    mutationFn: (values: RecordPaymentFormValues) => {
      const dto: RecordPaymentRequest = {
        installmentPlanId: values.installmentPlanId,
        installmentSeqNo: values.installmentSeqNo,
        amount: values.amount,
        mode: values.mode,
        bankAccountId: values.bankAccountId || null,
        date: values.date.toISOString(),
        chequeNumber: values.mode === "Cheque" ? values.chequeNumber : null,
        chequeBank: values.mode === "Cheque" ? values.chequeBank : null,
        chequeDueDate: values.mode === "Cheque" && values.chequeDueDate ? values.chequeDueDate.toISOString() : null,
        chequeDepositDate:
          values.mode === "Cheque" && values.chequeDepositDate ? values.chequeDepositDate.toISOString() : null,
      };
      return recordPayment(dto);
    },
    onSuccess: () => {
      message.success("Payment recorded.");
      setRecordPaymentOpen(false);
      recordPaymentForm.resetFields();
      invalidateAll();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to record payment.")),
  });

  const createPlanMutation = useMutation({
    mutationFn: (values: CreatePlanFormValues) => {
      const dto: CreateInstallmentPlanRequest = {
        bookingId: values.bookingId,
        downPayment: values.downPayment,
        earlyPaymentDiscount: values.earlyPaymentDiscount ?? null,
        installments: values.installments.map((item) => ({
          dueDate: item.dueDate.toISOString(),
          amount: item.amount,
        })),
      };
      return createInstallmentPlan(dto);
    },
    onSuccess: () => {
      message.success("Installment plan created.");
      setCreatePlanOpen(false);
      createPlanForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: INSTALLMENT_PLANS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create installment plan.")),
  });

  const clearChequeMutation = useMutation({
    mutationFn: (id: string) => clearCheque(id),
    onSuccess: () => {
      message.success("Cheque cleared.");
      setViewingCheque(null);
      void queryClient.invalidateQueries({ queryKey: CHEQUES_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to clear cheque.")),
  });

  const bounceChequeMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: BounceFormValues }) => {
      const dto: BounceChequeRequest = {
        penaltyAmount: values.penaltyAmount,
        notes: values.notes || null,
      };
      return bounceCheque(id, dto);
    },
    onSuccess: () => {
      message.success("Cheque marked as bounced.");
      setBouncingCheque(null);
      setViewingCheque(null);
      bounceForm.resetFields();
      invalidateAll();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to bounce cheque.")),
  });

  const applyDiscountMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: DiscountFormValues }) => {
      const dto: ApplyDiscountRequest = {
        discountAmount: values.discountAmount,
        notes: values.notes || null,
        justification: values.justification || null,
      };
      return applyInstallmentDiscount(id, dto);
    },
    onSuccess: (result) => {
      if (isApprovalRequestResponse(result)) {
        message.success("Discount submitted for admin approval.");
      } else {
        message.success("Discount applied.");
        setViewingInstallmentsPlan(result);
      }
      setDiscountingPlan(null);
      discountForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: INSTALLMENT_PLANS_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to apply discount.")),
  });

  const selectedPlan = selectedPlanId ? planById.get(selectedPlanId) : undefined;
  const installmentOptions = (selectedPlan?.installments ?? [])
    .filter((installment) => installment.status !== "Paid")
    .map((installment) => ({
      label: `#${installment.seqNo} — due ${dayjs(installment.dueDate).format("DD-MMM-YYYY")} — ${installment.amount} (${installment.status})`,
      value: installment.seqNo,
    }));

  const planOptions = (plans ?? []).map((plan) => ({
    label: `${plotRefForPlan(plan.id)} — Plan ${plan.id.slice(-6)}`,
    value: plan.id,
  }));

  const bankAccountOptions = (bankAccounts ?? []).map((account) => ({
    label: `${account.accountName} (${account.bankName})`,
    value: account.id,
  }));

  const bookingIdsWithPlan = new Set((plans ?? []).map((plan) => plan.bookingId));
  const eligibleBookingOptions = (bookings ?? [])
    .filter((booking) => booking.status === "Active" && !bookingIdsWithPlan.has(booking.id))
    .map((booking) => ({
      label: `${plotNumberById.get(booking.plotId) ?? booking.plotId} — Booking ${booking.id.slice(-6)}`,
      value: booking.id,
    }));

  const columns: TableColumnsType<PaymentResponse> = [
    {
      title: "Booking / Plot",
      key: "plotRef",
      render: (_, record) => plotRefForPlan(record.installmentPlanId),
    },
    { title: "Installment #", dataIndex: "installmentSeqNo", key: "installmentSeqNo" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      render: (mode: PaymentMode) => <Tag color={modeColor(mode)}>{mode}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD-MMM-YYYY"),
    },
    {
      title: "Bank Account",
      dataIndex: "bankAccountId",
      key: "bankAccountId",
      render: (bankAccountId: string | null) =>
        bankAccountId ? bankAccountLabelById.get(bankAccountId) ?? bankAccountId : "—",
    },
    {
      title: "Receipt #",
      dataIndex: "receiptNumber",
      key: "receiptNumber",
      render: (receiptNumber: string | null) => receiptNumber ?? "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const plan = planById.get(record.installmentPlanId);
        const cheque = chequeByPaymentId.get(record.id);
        return (
          <Space wrap>
            <Button size="small" onClick={() => setViewingInstallmentsPlan(plan ?? null)} disabled={!plan}>
              View Installments
            </Button>
            <Button size="small" onClick={() => setViewingReceiptPayment(record)}>
              View Receipt
            </Button>
            {record.mode === "Cheque" && cheque ? (
              <>
                <Button size="small" onClick={() => setViewingCheque(cheque)}>
                  View Cheque
                </Button>
                {cheque.status === "Pending" ? (
                  <Button size="small" danger onClick={() => setBouncingCheque(cheque)}>
                    Mark Bounced
                  </Button>
                ) : null}
              </>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const installmentColumns: TableColumnsType<InstallmentDto> = [
    { title: "Seq", dataIndex: "seqNo", key: "seqNo" },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate: string) => dayjs(dueDate).format("DD-MMM-YYYY"),
    },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    { title: "Paid Amount", dataIndex: "paidAmount", key: "paidAmount" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: InstallmentStatus) => <Tag color={installmentStatusColor(status)}>{status}</Tag>,
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
          Payments
        </Typography.Title>
        <Space>
          <Button onClick={() => setCreatePlanOpen(true)}>Create Installment Plan</Button>
          <Button type="primary" onClick={() => setRecordPaymentOpen(true)}>
            Record Payment
          </Button>
        </Space>
      </div>

      <Table<PaymentResponse>
        rowKey="id"
        loading={isPaymentsLoading || isPlansLoading}
        dataSource={payments}
        columns={columns}
      />

      <Drawer
        title="Record Payment"
        open={isRecordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        destroyOnHidden
        width={460}
      >
        <Form<RecordPaymentFormValues>
          form={recordPaymentForm}
          layout="vertical"
          onFinish={(values) => recordPaymentMutation.mutate(values)}
        >
          <Form.Item
            name="installmentPlanId"
            label="Booking / Installment Plan"
            rules={[{ required: true, message: "Installment plan is required" }]}
          >
            <Select
              showSearch
              placeholder="Select an installment plan"
              options={planOptions}
              onChange={() => recordPaymentForm.setFieldValue("installmentSeqNo", undefined)}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="installmentSeqNo"
            label="Installment"
            rules={[{ required: true, message: "Installment is required" }]}
          >
            <Select
              placeholder="Select an installment"
              options={installmentOptions}
              disabled={!selectedPlanId}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="mode" label="Mode" rules={[{ required: true, message: "Mode is required" }]}>
            <Select options={PAYMENT_MODE_OPTIONS} placeholder="Select a payment mode" />
          </Form.Item>
          <Form.Item name="bankAccountId" label="Bank Account (Bank/Cheque)">
            <Select
              allowClear
              showSearch
              placeholder="Select a bank account"
              options={bankAccountOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          {selectedMode === "Cheque" ? (
            <>
              <Form.Item
                name="chequeNumber"
                label="Cheque Number"
                rules={[{ required: true, message: "Cheque number is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="chequeBank"
                label="Cheque Bank"
                rules={[{ required: true, message: "Cheque bank is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="chequeDueDate"
                label="Cheque Due Date"
                rules={[{ required: true, message: "Cheque due date is required" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="chequeDepositDate"
                label="Cheque Deposit Date"
                rules={[{ required: true, message: "Cheque deposit date is required" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </>
          ) : null}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={recordPaymentMutation.isPending}>
              Record Payment
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Create Installment Plan"
        open={isCreatePlanOpen}
        onClose={() => setCreatePlanOpen(false)}
        destroyOnHidden
        width={520}
      >
        <Form<CreatePlanFormValues>
          form={createPlanForm}
          layout="vertical"
          onFinish={(values) => createPlanMutation.mutate(values)}
        >
          <Form.Item
            name="bookingId"
            label="Booking"
            rules={[{ required: true, message: "Booking is required" }]}
          >
            <Select
              showSearch
              placeholder="Select an Active booking without a plan yet"
              options={eligibleBookingOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="downPayment"
            label="Down Payment"
            rules={[{ required: true, message: "Down payment is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="earlyPaymentDiscount" label="Early Payment Discount (optional)">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="Installments" required>
            <Form.List name="installments" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline" style={{ width: "100%" }} wrap>
                      <Form.Item
                        {...field}
                        name={[field.name, "dueDate"]}
                        rules={[{ required: true, message: "Due date is required" }]}
                        style={{ marginBottom: 8 }}
                      >
                        <DatePicker placeholder="Due date" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, "amount"]}
                        rules={[{ required: true, message: "Amount is required" }]}
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber placeholder="Amount" min={0} />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      ) : null}
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    Add Installment
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createPlanMutation.isPending}>
              Create Plan
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Installment Plan"
        open={viewingInstallmentsPlan !== null}
        onClose={() => setViewingInstallmentsPlan(null)}
        destroyOnHidden
        width={560}
      >
        {viewingInstallmentsPlan ? (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Plot / Booking">
                {plotRefForPlan(viewingInstallmentsPlan.id)}
              </Descriptions.Item>
              <Descriptions.Item label="Down Payment">
                {viewingInstallmentsPlan.downPayment}
              </Descriptions.Item>
              <Descriptions.Item label="Early Payment Discount">
                {viewingInstallmentsPlan.earlyPaymentDiscount ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Credit Balance">
                {viewingInstallmentsPlan.creditBalance}
              </Descriptions.Item>
            </Descriptions>

            <Table<InstallmentDto>
              size="small"
              rowKey="seqNo"
              pagination={false}
              dataSource={viewingInstallmentsPlan.installments}
              columns={installmentColumns}
            />

            <Button onClick={() => setDiscountingPlan(viewingInstallmentsPlan)}>Apply Discount</Button>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={discountingPlan ? `Apply Discount — ${plotRefForPlan(discountingPlan.id)}` : "Apply Discount"}
        open={discountingPlan !== null}
        onCancel={() => setDiscountingPlan(null)}
        onOk={() => discountForm.submit()}
        confirmLoading={applyDiscountMutation.isPending}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          As an Admin this applies immediately; as an Employee it is submitted as a LargeDiscount
          approval request for an Admin to review.
        </Typography.Paragraph>
        <Form<DiscountFormValues>
          form={discountForm}
          layout="vertical"
          onFinish={(values) => {
            if (discountingPlan) {
              applyDiscountMutation.mutate({ id: discountingPlan.id, values });
            }
          }}
        >
          <Form.Item
            name="discountAmount"
            label="Discount Amount"
            rules={[{ required: true, message: "Discount amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="justification"
            label={isAdmin ? "Justification (optional)" : "Justification"}
            rules={isAdmin ? [] : [{ required: true, message: "Justification is required for an approval request" }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Receipt"
        open={viewingReceiptPayment !== null}
        onClose={() => setViewingReceiptPayment(null)}
        destroyOnHidden
        width={420}
      >
        {viewingReceiptPayment ? (
          isReceiptLoading ? (
            <Empty description="Loading..." />
          ) : viewingReceipt ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Receipt Number">{viewingReceipt.receiptNumber}</Descriptions.Item>
              <Descriptions.Item label="Payment ID">{viewingReceipt.paymentId}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(viewingReceipt.createdAt).format("DD-MMM-YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description="Receipt not found" />
          )
        ) : null}
      </Drawer>

      <Drawer
        title="Cheque"
        open={viewingCheque !== null}
        onClose={() => setViewingCheque(null)}
        destroyOnHidden
        width={420}
      >
        {viewingCheque ? (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Cheque Number">{viewingCheque.chequeNumber}</Descriptions.Item>
              <Descriptions.Item label="Bank">{viewingCheque.bank}</Descriptions.Item>
              <Descriptions.Item label="Amount">{viewingCheque.amount}</Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {dayjs(viewingCheque.dueDate).format("DD-MMM-YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Deposit Date">
                {dayjs(viewingCheque.depositDate).format("DD-MMM-YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={chequeStatusColor(viewingCheque.status)}>{viewingCheque.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bounce Penalty">
                {viewingCheque.bouncePenaltyAmount ?? "—"}
              </Descriptions.Item>
            </Descriptions>

            {viewingCheque.status === "Pending" ? (
              <Space>
                <Popconfirm
                  title="Mark this cheque as cleared?"
                  onConfirm={() => clearChequeMutation.mutate(viewingCheque.id)}
                >
                  <Button loading={clearChequeMutation.isPending}>Clear</Button>
                </Popconfirm>
                <Button danger onClick={() => setBouncingCheque(viewingCheque)}>
                  Mark Bounced
                </Button>
              </Space>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title="Mark Cheque Bounced"
        open={bouncingCheque !== null}
        onCancel={() => setBouncingCheque(null)}
        onOk={() => bounceForm.submit()}
        confirmLoading={bounceChequeMutation.isPending}
        destroyOnHidden
      >
        <Form<BounceFormValues>
          form={bounceForm}
          layout="vertical"
          onFinish={(values) => {
            if (bouncingCheque) {
              bounceChequeMutation.mutate({ id: bouncingCheque.id, values });
            }
          }}
        >
          <Form.Item
            name="penaltyAmount"
            label="Penalty Amount"
            rules={[{ required: true, message: "Penalty amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

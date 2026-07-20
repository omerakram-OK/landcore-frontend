import { useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
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
import {
  approveApprovalRequest,
  listApprovals,
  proposeApproval,
  rejectApprovalRequest,
} from "../../api/approvals";
import { listEmployees } from "../../api/employees";
import { listPlots } from "../../api/plots";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/errors";
import type {
  ApprovalRequestResponse,
  ApprovalRequestStatus,
  ApprovalRequestType,
} from "../../types/approval";

const APPROVALS_QUERY_KEY = ["approvals"] as const;
const EMPLOYEES_QUERY_KEY = ["employees"] as const;
const PLOTS_QUERY_KEY = ["plots"] as const;

const TYPE_OPTIONS: Array<{ label: string; value: ApprovalRequestType }> = [
  { label: "Repossession Override", value: "RepossessionOverride" },
  { label: "Refund", value: "Refund" },
  { label: "Merge / Split", value: "MergeSplit" },
  { label: "Large Discount", value: "LargeDiscount" },
];

const STATUS_OPTIONS: Array<{ label: string; value: ApprovalRequestStatus }> = [
  { label: "Pending Approval", value: "PendingApproval" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

function typeLabel(type: ApprovalRequestType): string {
  return TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

function statusColor(status: ApprovalRequestStatus): string {
  switch (status) {
    case "Approved":
      return "green";
    case "Rejected":
      return "red";
    default:
      return "orange";
  }
}

interface NewRequestFormValues {
  targetPlotId: string;
  notes?: string;
  justification: string;
}

interface DecisionFormValues {
  decisionNotes?: string;
}

export default function ApprovalsListPage() {
  const { claims } = useAuth();
  const isAdmin = claims?.role === "Admin";
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<ApprovalRequestStatus | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<ApprovalRequestType | undefined>(undefined);
  const [viewingRequest, setViewingRequest] = useState<ApprovalRequestResponse | null>(null);
  const [isNewRequestOpen, setNewRequestOpen] = useState(false);
  const [decidingRequest, setDecidingRequest] = useState<{
    request: ApprovalRequestResponse;
    action: "approve" | "reject";
  } | null>(null);

  const [newRequestForm] = Form.useForm<NewRequestFormValues>();
  const [decisionForm] = Form.useForm<DecisionFormValues>();

  const { data: approvals, isLoading } = useQuery({
    queryKey: APPROVALS_QUERY_KEY,
    queryFn: listApprovals,
  });

  const { data: employees } = useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: listEmployees,
    retry: false,
  });

  const { data: plots } = useQuery({
    queryKey: PLOTS_QUERY_KEY,
    queryFn: listPlots,
    retry: false,
  });

  const employeeNameById = new Map((employees ?? []).map((employee) => [employee.id, employee.fullName]));
  const plotNumberById = new Map((plots ?? []).map((plot) => [plot.id, plot.plotNumber]));

  const overduePlotOptions = (plots ?? [])
    .filter((plot) => plot.status === "Overdue")
    .map((plot) => ({ label: plot.plotNumber, value: plot.id }));

  const invalidateApprovals = () => queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });

  const proposeMutation = useMutation({
    mutationFn: (values: NewRequestFormValues) =>
      proposeApproval({
        type: "RepossessionOverride",
        targetPlotId: values.targetPlotId,
        justification: values.justification,
        payloadJson: JSON.stringify({ Notes: values.notes?.trim() || null }),
      }),
    onSuccess: () => {
      message.success("Approval request submitted.");
      setNewRequestOpen(false);
      newRequestForm.resetFields();
      void invalidateApprovals();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to submit approval request.")),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      request,
      action,
      values,
    }: {
      request: ApprovalRequestResponse;
      action: "approve" | "reject";
      values: DecisionFormValues;
    }) =>
      action === "approve"
        ? approveApprovalRequest(request.id, { decisionNotes: values.decisionNotes || null })
        : rejectApprovalRequest(request.id, { decisionNotes: values.decisionNotes ?? "" }),
    onSuccess: (_, { action }) => {
      message.success(action === "approve" ? "Request approved." : "Request rejected.");
      setDecidingRequest(null);
      decisionForm.resetFields();
      void invalidateApprovals();
    },
    onError: (error, { action }) =>
      message.error(
        getApiErrorMessage(
          error,
          action === "approve" ? "Failed to approve request." : "Failed to reject request.",
        ),
      ),
  });

  const filteredApprovals = useMemo(() => {
    return (approvals ?? []).filter((request) => {
      if (statusFilter && request.status !== statusFilter) return false;
      if (typeFilter && request.type !== typeFilter) return false;
      return true;
    });
  }, [approvals, statusFilter, typeFilter]);

  let payloadPreview: string | null = null;
  if (viewingRequest?.payloadJson) {
    try {
      payloadPreview = JSON.stringify(JSON.parse(viewingRequest.payloadJson), null, 2);
    } catch {
      payloadPreview = viewingRequest.payloadJson;
    }
  }

  const columns: TableColumnsType<ApprovalRequestResponse> = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: ApprovalRequestType) => typeLabel(type),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: ApprovalRequestStatus) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: "Target Plot",
      dataIndex: "targetPlotId",
      key: "targetPlotId",
      render: (targetPlotId: string | null) =>
        targetPlotId ? plotNumberById.get(targetPlotId) ?? targetPlotId : "—",
    },
    {
      title: "Requested By",
      dataIndex: "requestedByEmployeeId",
      key: "requestedByEmployeeId",
      render: (employeeId: string) => employeeNameById.get(employeeId) ?? employeeId,
    },
    {
      title: "Justification",
      dataIndex: "justification",
      key: "justification",
      ellipsis: true,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => dayjs(createdAt).format("DD-MMM-YYYY HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setViewingRequest(record)}>
            View
          </Button>
          {isAdmin && record.status === "PendingApproval" ? (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => setDecidingRequest({ request: record, action: "approve" })}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                onClick={() => setDecidingRequest({ request: record, action: "reject" })}
              >
                Reject
              </Button>
            </>
          ) : null}
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
          Approvals
        </Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 180 }}
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Select
            allowClear
            placeholder="Filter by type"
            style={{ width: 200 }}
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <Button type="primary" onClick={() => setNewRequestOpen(true)}>
            New Request
          </Button>
        </Space>
      </div>

      <Table<ApprovalRequestResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={filteredApprovals}
        columns={columns}
      />

      <Drawer
        title="Approval Request"
        open={viewingRequest !== null}
        onClose={() => setViewingRequest(null)}
        destroyOnHidden
        width={480}
      >
        {viewingRequest ? (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Type">{typeLabel(viewingRequest.type)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColor(viewingRequest.status)}>{viewingRequest.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Target Plot">
                {viewingRequest.targetPlotId
                  ? plotNumberById.get(viewingRequest.targetPlotId) ?? viewingRequest.targetPlotId
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Requested By">
                {employeeNameById.get(viewingRequest.requestedByEmployeeId) ?? viewingRequest.requestedByEmployeeId}
              </Descriptions.Item>
              <Descriptions.Item label="Justification">{viewingRequest.justification}</Descriptions.Item>
              <Descriptions.Item label="Decided By">
                {viewingRequest.decidedByAdminId ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Decision Notes">
                {viewingRequest.decisionNotes ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(viewingRequest.createdAt).format("DD-MMM-YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {dayjs(viewingRequest.updatedAt).format("DD-MMM-YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>

            {payloadPreview ? (
              <div>
                <Typography.Text strong>Payload</Typography.Text>
                <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 4, overflowX: "auto" }}>
                  {payloadPreview}
                </pre>
              </div>
            ) : null}
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        title="New Approval Request — Repossession Override"
        open={isNewRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        destroyOnHidden
        width={440}
      >
        <Form<NewRequestFormValues>
          form={newRequestForm}
          layout="vertical"
          onFinish={(values) => proposeMutation.mutate(values)}
        >
          <Typography.Paragraph type="secondary">
            Resumes an Overdue Plot's plan (no refund, Plot moves back to Sold). This is the only
            action with no direct-call alternative — even an Admin must propose then approve it.
          </Typography.Paragraph>
          <Form.Item
            name="targetPlotId"
            label="Overdue Plot"
            rules={[{ required: true, message: "Target plot is required" }]}
          >
            <Select
              showSearch
              placeholder="Select an Overdue plot"
              options={overduePlotOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="justification"
            label="Justification"
            rules={[{ required: true, message: "Justification is required" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={proposeMutation.isPending}>
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={decidingRequest?.action === "approve" ? "Approve Request" : "Reject Request"}
        open={decidingRequest !== null}
        onCancel={() => setDecidingRequest(null)}
        onOk={() => decisionForm.submit()}
        confirmLoading={decisionMutation.isPending}
        destroyOnHidden
      >
        <Form<DecisionFormValues>
          form={decisionForm}
          layout="vertical"
          onFinish={(values) => {
            if (decidingRequest) {
              decisionMutation.mutate({ ...decidingRequest, values });
            }
          }}
        >
          <Form.Item
            name="decisionNotes"
            label="Decision Notes"
            rules={
              decidingRequest?.action === "reject"
                ? [{ required: true, message: "A rejection reason is required" }]
                : []
            }
          >
            <Input.TextArea rows={3} placeholder={decidingRequest?.action === "reject" ? "Reason for rejection" : "Optional notes"} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

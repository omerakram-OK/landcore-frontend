import { useState } from "react";
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  List,
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
import {
  appendLeadFollowUpNote,
  createLead,
  deleteLead,
  listLeads,
  updateLead,
  updateLeadStatus,
} from "../../api/leads";
import { listEmployees } from "../../api/employees";
import type {
  CreateLeadRequest,
  LeadResponse,
  LeadSource,
  LeadStatus,
  UpdateLeadRequest,
} from "../../types/lead";
import { getApiErrorMessage } from "../../utils/errors";

const LEADS_QUERY_KEY = ["leads"] as const;
const EMPLOYEES_QUERY_KEY = ["employees"] as const;

const SOURCE_OPTIONS: Array<{ label: string; value: LeadSource }> = [
  { label: "Walk-In", value: "WalkIn" },
  { label: "Referral", value: "Referral" },
  { label: "Agent", value: "Agent" },
  { label: "Call", value: "Call" },
];

const STATUS_OPTIONS: Array<{ label: string; value: LeadStatus }> = [
  { label: "New", value: "New" },
  { label: "Contacted", value: "Contacted" },
  { label: "Follow Up", value: "FollowUp" },
  { label: "Converted", value: "Converted" },
  { label: "Lost", value: "Lost" },
];

function statusColor(status: LeadStatus): string {
  switch (status) {
    case "New":
      return "blue";
    case "Contacted":
      return "gold";
    case "FollowUp":
      return "orange";
    case "Converted":
      return "green";
    case "Lost":
      return "red";
    default:
      return "default";
  }
}

interface LeadFormValues {
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  interestedPlotId?: string;
  assignedEmployeeId: string;
}

export default function LeadsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadResponse | null>(null);
  const [notesLead, setNotesLead] = useState<LeadResponse | null>(null);
  const [createForm] = Form.useForm<LeadFormValues>();
  const [editForm] = Form.useForm<LeadFormValues>();
  const [noteForm] = Form.useForm<{ note: string }>();

  const { data, isLoading } = useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: listLeads,
  });

  const { data: employees } = useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: listEmployees,
  });

  const employeeOptions = (employees ?? []).map((employee) => ({
    label: employee.fullName,
    value: employee.id,
  }));

  const invalidateLeads = () => queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });

  const toRequest = (values: LeadFormValues): CreateLeadRequest | UpdateLeadRequest => ({
    name: values.name,
    phone: values.phone,
    email: values.email,
    source: values.source,
    interestedPlotId: values.interestedPlotId || null,
    assignedEmployeeId: values.assignedEmployeeId,
  });

  const createMutation = useMutation({
    mutationFn: (values: LeadFormValues) => createLead(toRequest(values)),
    onSuccess: () => {
      message.success("Lead created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateLeads();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create lead.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: LeadFormValues }) =>
      updateLead(id, toRequest(values)),
    onSuccess: () => {
      message.success("Lead updated.");
      setEditingLead(null);
      void invalidateLeads();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update lead.")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, { status }),
    onSuccess: () => {
      message.success("Lead status updated.");
      void invalidateLeads();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update lead status.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      message.success("Lead deleted.");
      void invalidateLeads();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete lead.")),
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      appendLeadFollowUpNote(id, { note }),
    onSuccess: (updated) => {
      message.success("Follow-up note added.");
      noteForm.resetFields();
      setNotesLead(updated);
      void invalidateLeads();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to add follow-up note.")),
  });

  const openEdit = (record: LeadResponse) => {
    setEditingLead(record);
    editForm.setFieldsValue({
      name: record.name,
      phone: record.phone,
      email: record.email,
      source: record.source,
      interestedPlotId: record.interestedPlotId ?? undefined,
      assignedEmployeeId: record.assignedEmployeeId,
    });
  };

  const columns: TableColumnsType<LeadResponse> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Source", dataIndex: "source", key: "source" },
    { title: "Assigned To", dataIndex: "assignedEmployeeName", key: "assignedEmployeeName" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: LeadStatus, record) => (
        <Select<LeadStatus>
          size="small"
          value={status}
          options={STATUS_OPTIONS}
          style={{ width: 130 }}
          onChange={(value) => statusMutation.mutate({ id: record.id, status: value })}
          popupMatchSelectWidth={false}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Button size="small" onClick={() => setNotesLead(record)}>
            Notes ({record.followUpNotes.length})
          </Button>
          {record.status !== "Converted" ? (
            <Popconfirm
              title="Convert this lead to a client?"
              description="Marks the lead as Converted. This does not yet create a Client or Booking record (backend support pending)."
              onConfirm={() => statusMutation.mutate({ id: record.id, status: "Converted" })}
            >
              <Button size="small" type="primary" loading={statusMutation.isPending}>
                Convert to Client
              </Button>
            </Popconfirm>
          ) : (
            <Tag color={statusColor(record.status)}>Converted</Tag>
          )}
          <Popconfirm title="Delete this lead?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const leadFormFields = (
    <>
      <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
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
      <Form.Item name="source" label="Source" rules={[{ required: true, message: "Source is required" }]}>
        <Select options={SOURCE_OPTIONS} placeholder="Select a source" />
      </Form.Item>
      <Form.Item name="interestedPlotId" label="Interested Plot Id (optional)">
        <Input placeholder="Plot ObjectId, if known" />
      </Form.Item>
      <Form.Item
        name="assignedEmployeeId"
        label="Assigned Employee"
        rules={[{ required: true, message: "Assigned employee is required" }]}
      >
        <Select
          showSearch
          placeholder="Select an employee"
          options={employeeOptions}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
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
          Leads
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create Lead
        </Button>
      </div>

      <Table<LeadResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Lead"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<LeadFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          {leadFormFields}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Lead"
        open={editingLead !== null}
        onClose={() => setEditingLead(null)}
        destroyOnHidden
        width={420}
      >
        <Form<LeadFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingLead) {
              updateMutation.mutate({ id: editingLead.id, values });
            }
          }}
        >
          {leadFormFields}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={notesLead ? `Follow-Up Notes — ${notesLead.name}` : "Follow-Up Notes"}
        open={notesLead !== null}
        onClose={() => setNotesLead(null)}
        destroyOnHidden
        width={420}
      >
        {notesLead && notesLead.followUpNotes.length > 0 ? (
          <List
            dataSource={notesLead.followUpNotes}
            renderItem={(note) => (
              <List.Item>
                <List.Item.Meta
                  title={dayjs(note.at).format("DD-MMM-YYYY HH:mm")}
                  description={note.note}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No follow-up notes yet" />
        )}
        <Form<{ note: string }>
          form={noteForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          onFinish={(values) => {
            if (notesLead) {
              noteMutation.mutate({ id: notesLead.id, note: values.note });
            }
          }}
        >
          <Form.Item name="note" label="Add Note" rules={[{ required: true, message: "Note is required" }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={noteMutation.isPending}>
              Add Note
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

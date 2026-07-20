import { useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
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
import {
  cancelBooking,
  createBooking,
  expireBooking,
  listBookings,
} from "../../api/bookings";
import { listPlots } from "../../api/plots";
import { listClients } from "../../api/clients";
import { listAgents } from "../../api/agents";
import { listLeads } from "../../api/leads";
import type { BookingResponse, BookingStatus, CreateBookingRequest } from "../../types/booking";
import { getApiErrorMessage } from "../../utils/errors";

const BOOKINGS_QUERY_KEY = ["bookings"] as const;
const PLOTS_QUERY_KEY = ["plots"] as const;
const CLIENTS_QUERY_KEY = ["clients"] as const;
const AGENTS_QUERY_KEY = ["agents"] as const;
const LEADS_QUERY_KEY = ["leads"] as const;

interface BookingFormValues {
  plotId: string;
  clientId: string;
  leadId?: string;
  agentId?: string;
  tokenAmount: number;
  expiryDate?: Dayjs;
}

function statusColor(status: BookingStatus): string {
  switch (status) {
    case "Active":
      return "blue";
    case "Converted":
      return "green";
    case "Expired":
      return "orange";
    case "Cancelled":
      return "red";
    default:
      return "default";
  }
}

export default function BookingsListPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingResponse | null>(null);
  const [createForm] = Form.useForm<BookingFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: listBookings,
  });

  const { data: plots } = useQuery({
    queryKey: PLOTS_QUERY_KEY,
    queryFn: listPlots,
  });

  const { data: clients } = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: listClients,
  });

  const { data: agents } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: listAgents,
  });

  const { data: leads } = useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: listLeads,
  });

  const plotNumberById = new Map((plots ?? []).map((plot) => [plot.id, plot.plotNumber]));
  const clientNameById = new Map((clients ?? []).map((client) => [client.id, client.fullName]));
  const agentNameById = new Map((agents ?? []).map((agent) => [agent.id, agent.fullName]));

  const availablePlotOptions = (plots ?? [])
    .filter((plot) => plot.status === "Available")
    .map((plot) => ({ label: plot.plotNumber, value: plot.id }));

  const clientOptions = (clients ?? []).map((client) => ({
    label: client.fullName,
    value: client.id,
  }));

  const agentOptions = (agents ?? []).map((agent) => ({ label: agent.fullName, value: agent.id }));

  const leadOptions = (leads ?? []).map((lead) => ({ label: lead.name, value: lead.id }));

  const invalidateBookings = () => queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
  const invalidatePlots = () => queryClient.invalidateQueries({ queryKey: PLOTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (values: BookingFormValues) => {
      const dto: CreateBookingRequest = {
        plotId: values.plotId,
        clientId: values.clientId,
        leadId: values.leadId || null,
        agentId: values.agentId || null,
        tokenAmount: values.tokenAmount,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      };
      return createBooking(dto);
    },
    onSuccess: () => {
      message.success("Booking created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidateBookings();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create booking.")),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id, {}),
    onSuccess: () => {
      message.success("Booking cancelled.");
      void invalidateBookings();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to cancel booking.")),
  });

  const expireMutation = useMutation({
    mutationFn: (id: string) => expireBooking(id, {}),
    onSuccess: () => {
      message.success("Booking expired.");
      void invalidateBookings();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to expire booking.")),
  });

  const columns: TableColumnsType<BookingResponse> = [
    {
      title: "Plot",
      dataIndex: "plotId",
      key: "plotId",
      render: (plotId: string) => plotNumberById.get(plotId) ?? plotId,
    },
    {
      title: "Client",
      dataIndex: "clientId",
      key: "clientId",
      render: (clientId: string) => clientNameById.get(clientId) ?? clientId,
    },
    {
      title: "Booking Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => dayjs(createdAt).format("DD-MMM-YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: BookingStatus) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    { title: "Token Amount", dataIndex: "tokenAmount", key: "tokenAmount" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setDetailBooking(record)}>
            View
          </Button>
          {record.status === "Active" ? (
            <>
              <Popconfirm title="Cancel this booking?" onConfirm={() => cancelMutation.mutate(record.id)}>
                <Button size="small" danger loading={cancelMutation.isPending}>
                  Cancel
                </Button>
              </Popconfirm>
              <Popconfirm title="Expire this booking?" onConfirm={() => expireMutation.mutate(record.id)}>
                <Button size="small" loading={expireMutation.isPending}>
                  Expire
                </Button>
              </Popconfirm>
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
          Bookings
        </Typography.Title>
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          Create Booking
        </Button>
      </div>

      <Table<BookingResponse> rowKey="id" loading={isLoading} dataSource={data} columns={columns} />

      <Drawer
        title="Create Booking"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={460}
      >
        <Form<BookingFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item name="plotId" label="Plot" rules={[{ required: true, message: "Plot is required" }]}>
            <Select
              showSearch
              placeholder="Select an available plot"
              options={availablePlotOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="clientId"
            label="Client"
            rules={[{ required: true, message: "Client is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a client"
              options={clientOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="leadId" label="Lead (optional)">
            <Select
              allowClear
              showSearch
              placeholder="Select a lead"
              options={leadOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item name="agentId" label="Agent (optional)">
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
          <Form.Item
            name="tokenAmount"
            label="Token Amount"
            rules={[{ required: true, message: "Token amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="expiryDate" label="Expiry Date (optional, defaults to +15 days)">
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
        title="Booking Detail"
        open={detailBooking !== null}
        onClose={() => setDetailBooking(null)}
        destroyOnHidden
        width={420}
      >
        {detailBooking ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Plot">
              {plotNumberById.get(detailBooking.plotId) ?? detailBooking.plotId}
            </Descriptions.Item>
            <Descriptions.Item label="Client">
              {clientNameById.get(detailBooking.clientId) ?? detailBooking.clientId}
            </Descriptions.Item>
            <Descriptions.Item label="Agent">
              {detailBooking.agentId
                ? agentNameById.get(detailBooking.agentId) ?? detailBooking.agentId
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Commission Type">
              {detailBooking.commissionType ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Commission Value">
              {detailBooking.commissionValue ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Token Amount">{detailBooking.tokenAmount}</Descriptions.Item>
            <Descriptions.Item label="Expiry Date">
              {dayjs(detailBooking.expiryDate).format("DD-MMM-YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColor(detailBooking.status)}>{detailBooking.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {dayjs(detailBooking.createdAt).format("DD-MMM-YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}

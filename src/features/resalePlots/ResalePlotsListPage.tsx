import { useState } from "react";
import {
  Button,
  DatePicker,
  Divider,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Form,
  message,
} from "antd";
import type { TableColumnsType } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  createPlot,
  deletePlot,
  listPlots,
  markPlotResaleSold,
  updatePlot,
} from "../../api/plots";
import { listBlocks } from "../../api/blocks";
import { listSocieties } from "../../api/societies";
import { listClients } from "../../api/clients";
import { listAgents } from "../../api/agents";
import type {
  CommissionType,
  CreatePlotRequest,
  MarkPlotResaleSoldRequest,
  PlotCategory,
  PlotResponse,
  PlotSizeUnit,
  UpdatePlotRequest,
} from "../../types/plot";
import { getApiErrorMessage } from "../../utils/errors";

const PLOTS_QUERY_KEY = ["plots"] as const;
const BLOCKS_QUERY_KEY = ["blocks"] as const;
const SOCIETIES_QUERY_KEY = ["societies"] as const;
const CLIENTS_QUERY_KEY = ["clients"] as const;
const AGENTS_QUERY_KEY = ["agents"] as const;

const COMMISSION_TYPE_OPTIONS: Array<{ label: string; value: CommissionType | "" }> = [
  { label: "No commission", value: "" },
  { label: "Percentage of Sold Price", value: "Percentage" },
  { label: "Fixed Amount", value: "Fixed" },
];

const CATEGORY_OPTIONS: Array<{ label: string; value: PlotCategory }> = [
  { label: "Residential", value: "Residential" },
  { label: "Commercial", value: "Commercial" },
];

const SIZE_UNIT_OPTIONS: Array<{ label: string; value: PlotSizeUnit }> = [
  { label: "Marla", value: "Marla" },
  { label: "Kanal", value: "Kanal" },
  { label: "Sq. Yd", value: "SqYd" },
];

interface ResaleFormValues {
  plotNumber: string;
  blockId: string;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  ownerAskingPrice: number;
  listingPrice: number;
  openForAgents?: boolean;
  assignedAgentIds?: string[];
}

interface AgentCommissionFormValue {
  agentId: string;
  value: number;
}

interface ResaleSellFormValues {
  soldPrice: number;
  buyerClientId?: string;
  soldDate: Dayjs;
  notes?: string;
  buyerCommissionType?: CommissionType | "";
  buyerCommissionValue?: number;
  ownerCommissionType?: CommissionType | "";
  ownerCommissionValue?: number;
  agentSplitMode: CommissionType;
  agentCommissions?: AgentCommissionFormValue[];
}

function computeCommissionAmount(
  type: CommissionType | "" | undefined,
  value: number | undefined,
  basePrice: number,
): number {
  if (!type || !value) {
    return 0;
  }
  return type === "Percentage" ? (basePrice * value) / 100 : value;
}

function CommissionPreview({ form }: { form: ReturnType<typeof Form.useForm<ResaleSellFormValues>>[0] }) {
  const values = Form.useWatch([], form) as ResaleSellFormValues | undefined;
  if (!values) {
    return null;
  }

  const soldPrice = values.soldPrice ?? 0;
  const buyerAmount = computeCommissionAmount(values.buyerCommissionType, values.buyerCommissionValue, soldPrice);
  const ownerAmount = computeCommissionAmount(values.ownerCommissionType, values.ownerCommissionValue, soldPrice);
  const totalAmount = buyerAmount + ownerAmount;

  if (totalAmount === 0) {
    return null;
  }

  const agentTotal = (values.agentCommissions ?? []).reduce(
    (sum, entry) => sum + computeCommissionAmount(values.agentSplitMode, entry?.value, totalAmount),
    0,
  );

  return (
    <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
      Total Commission: <strong>{totalAmount.toFixed(2)}</strong> &middot; Agents get:{" "}
      <strong>{agentTotal.toFixed(2)}</strong> &middot; Admin keeps:{" "}
      <strong>{Math.max(0, totalAmount - agentTotal).toFixed(2)}</strong>
    </Typography.Paragraph>
  );
}

export default function ResalePlotsListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotResponse | null>(null);
  const [sellingPlot, setSellingPlot] = useState<PlotResponse | null>(null);
  const [searchText, setSearchText] = useState("");

  const [createForm] = Form.useForm<ResaleFormValues>();
  const [editForm] = Form.useForm<ResaleFormValues>();
  const [sellForm] = Form.useForm<ResaleSellFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: PLOTS_QUERY_KEY,
    queryFn: listPlots,
  });

  const { data: blocks } = useQuery({
    queryKey: BLOCKS_QUERY_KEY,
    queryFn: listBlocks,
  });

  const { data: societies } = useQuery({
    queryKey: SOCIETIES_QUERY_KEY,
    queryFn: listSocieties,
  });

  const { data: clients } = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: listClients,
  });

  const { data: agents } = useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: listAgents,
  });

  const blockOptions = (blocks ?? []).map((block) => ({ label: block.name, value: block.id }));
  const blockNameById = new Map((blocks ?? []).map((block) => [block.id, block.name]));
  const societyNameById = new Map((societies ?? []).map((society) => [society.id, society.name]));
  const clientNameById = new Map((clients ?? []).map((client) => [client.id, client.fullName]));
  const clientOptions = (clients ?? []).map((client) => ({ label: client.fullName, value: client.id }));
  const agentNameById = new Map((agents ?? []).map((agent) => [agent.id, agent.fullName]));
  const agentOptions = (agents ?? []).map((agent) => ({ label: agent.fullName, value: agent.id }));

  const invalidatePlots = () => queryClient.invalidateQueries({ queryKey: PLOTS_QUERY_KEY });

  const resalePlots = (data ?? []).filter((plot) => plot.isResale);

  const filteredResalePlots = resalePlots.filter((plot) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    const blockName = blockNameById.get(plot.blockId) ?? "";
    const societyName = societyNameById.get(plot.societyId) ?? "";
    return (
      plot.plotNumber.toLowerCase().includes(term) ||
      blockName.toLowerCase().includes(term) ||
      societyName.toLowerCase().includes(term)
    );
  });

  const createMutation = useMutation({
    mutationFn: (values: ResaleFormValues) => {
      const dto: CreatePlotRequest = {
        plotNumber: values.plotNumber,
        blockId: values.blockId,
        size: values.size,
        sizeUnit: values.sizeUnit,
        category: values.category,
        basePrice: values.listingPrice,
        annualMaintenanceCharge: 0,
        charges: null,
        ownerClientIds: null,
        isResale: true,
        ownerAskingPrice: values.ownerAskingPrice,
        listingPrice: values.listingPrice,
        openForAgents: values.openForAgents ?? false,
        assignedAgentIds: values.assignedAgentIds ?? null,
      };
      return createPlot(dto);
    },
    onSuccess: () => {
      message.success("Resale plot added.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to add the resale plot.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ResaleFormValues }) => {
      if (!editingPlot) {
        throw new Error("No resale plot selected for editing.");
      }
      const dto: UpdatePlotRequest = {
        plotNumber: values.plotNumber,
        blockId: values.blockId,
        size: values.size,
        sizeUnit: values.sizeUnit,
        category: values.category,
        basePrice: editingPlot.basePrice,
        ownerClientIds: editingPlot.ownerClientIds,
        isResale: true,
        ownerAskingPrice: values.ownerAskingPrice,
        listingPrice: values.listingPrice,
        openForAgents: values.openForAgents ?? false,
        assignedAgentIds: values.assignedAgentIds ?? null,
      };
      return updatePlot(id, dto);
    },
    onSuccess: () => {
      message.success("Resale plot updated.");
      setEditingPlot(null);
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update the resale plot.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlot(id),
    onSuccess: () => {
      message.success("Resale plot deleted.");
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete the resale plot.")),
  });

  const markSoldMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ResaleSellFormValues }) => {
      const dto: MarkPlotResaleSoldRequest = {
        soldPrice: values.soldPrice,
        buyerClientId: values.buyerClientId || null,
        soldDate: values.soldDate.toISOString(),
        notes: values.notes || null,
        buyerCommissionType: values.buyerCommissionType || null,
        buyerCommissionValue: values.buyerCommissionType ? values.buyerCommissionValue ?? null : null,
        ownerCommissionType: values.ownerCommissionType || null,
        ownerCommissionValue: values.ownerCommissionType ? values.ownerCommissionValue ?? null : null,
        agentCommissions:
          values.agentCommissions
            ?.filter((entry) => entry?.agentId)
            .map((entry) => ({ agentId: entry.agentId, type: values.agentSplitMode, value: entry.value ?? 0 })) ?? null,
      };
      return markPlotResaleSold(id, dto);
    },
    onSuccess: () => {
      message.success("Plot marked as sold.");
      setSellingPlot(null);
      sellForm.resetFields();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to mark the plot as sold.")),
  });

  const openEdit = (record: PlotResponse) => {
    setEditingPlot(record);
    editForm.setFieldsValue({
      plotNumber: record.plotNumber,
      blockId: record.blockId,
      size: record.size,
      sizeUnit: record.sizeUnit,
      category: record.category,
      ownerAskingPrice: record.ownerAskingPrice ?? 0,
      listingPrice: record.listingPrice ?? 0,
      openForAgents: record.openForAgents,
      assignedAgentIds: record.assignedAgentIds,
    });
  };

  const openSell = (record: PlotResponse) => {
    setSellingPlot(record);
    sellForm.setFieldsValue({
      soldPrice: undefined,
      buyerClientId: undefined,
      soldDate: dayjs(),
      notes: undefined,
      buyerCommissionType: "",
      buyerCommissionValue: undefined,
      ownerCommissionType: "",
      ownerCommissionValue: undefined,
      agentSplitMode: "Percentage",
      agentCommissions: [],
    });
  };

  const confirmMarkSold = (record: PlotResponse) => {
    Modal.confirm({
      title: "Confirm resale sale?",
      content: `Are you sure you want to mark Plot ${record.plotNumber} as sold? This cannot be undone.`,
      okText: "Yes, mark as sold",
      cancelText: "Cancel",
      onOk: () => sellForm.submit(),
    });
  };

  const columns: TableColumnsType<PlotResponse> = [
    { title: "Plot #", dataIndex: "plotNumber", key: "plotNumber" },
    {
      title: "Society",
      dataIndex: "societyId",
      key: "societyId",
      render: (societyId: string) => societyNameById.get(societyId) ?? "—",
    },
    {
      title: "Block",
      dataIndex: "blockId",
      key: "blockId",
      render: (blockId: string) => blockNameById.get(blockId) ?? blockId,
    },
    {
      title: "Size",
      key: "size",
      render: (_, record) => `${record.size} ${record.sizeUnit}`,
    },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Owner's Asking Price", dataIndex: "ownerAskingPrice", key: "ownerAskingPrice" },
    { title: "Listing Price", dataIndex: "listingPrice", key: "listingPrice" },
    {
      title: "Status",
      key: "status",
      render: (_, record) =>
        record.soldPrice !== null ? (
          <Tag color="purple">Sold</Tag>
        ) : (
          <Tag color="gold">Listed</Tag>
        ),
    },
    {
      title: "Sold Price",
      dataIndex: "soldPrice",
      key: "soldPrice",
      render: (soldPrice: number | null) => soldPrice ?? "—",
    },
    {
      title: "Buyer",
      dataIndex: "buyerClientId",
      key: "buyerClientId",
      render: (buyerClientId: string | null) =>
        buyerClientId ? clientNameById.get(buyerClientId) ?? buyerClientId : "—",
    },
    {
      title: "Profit",
      dataIndex: "resaleProfit",
      key: "resaleProfit",
      render: (profit: number | null) =>
        profit === null ? (
          "—"
        ) : (
          <Tag color={profit >= 0 ? "green" : "red"}>{profit}</Tag>
        ),
    },
    {
      title: "Commission",
      key: "commission",
      render: (_, record) => {
        const commission = record.resaleCommission;
        if (!commission) {
          return "—";
        }
        return (
          <Popover
            title="Commission Breakdown"
            content={
              <Space direction="vertical" size={4} style={{ maxWidth: 320 }}>
                <Typography.Text>
                  From Buyer: {commission.buyerCommissionType ? commission.buyerCommissionAmount : "—"}
                  {commission.buyerCommissionType === "Percentage" ? ` (${commission.buyerCommissionValue}%)` : ""}
                </Typography.Text>
                <Typography.Text>
                  From Owner: {commission.ownerCommissionType ? commission.ownerCommissionAmount : "—"}
                  {commission.ownerCommissionType === "Percentage" ? ` (${commission.ownerCommissionValue}%)` : ""}
                </Typography.Text>
                <Typography.Text strong>Total Collected: {commission.totalCommissionAmount}</Typography.Text>
                {commission.agentCommissions.length > 0 ? (
                  <>
                    <Divider style={{ margin: "4px 0" }} />
                    {commission.agentCommissions.map((agentCommission) => (
                      <Typography.Text key={agentCommission.agentId}>
                        {agentNameById.get(agentCommission.agentId) ?? agentCommission.agentId}: {agentCommission.amount}
                        {agentCommission.type === "Percentage" ? ` (${agentCommission.value}%)` : ""}
                      </Typography.Text>
                    ))}
                  </>
                ) : null}
                <Divider style={{ margin: "4px 0" }} />
                <Typography.Text strong>Admin Keeps: {commission.adminNetCommissionAmount}</Typography.Text>
              </Space>
            }
          >
            <Tag color="blue" style={{ cursor: "pointer" }}>
              Total: {commission.totalCommissionAmount}
            </Tag>
          </Popover>
        );
      },
    },
    {
      title: "Agents",
      key: "agentVisibility",
      render: (_, record) =>
        record.openForAgents ? (
          <Tag color="cyan">Open to all</Tag>
        ) : record.assignedAgentIds.length > 0 ? (
          <Tag color="geekblue">{record.assignedAgentIds.length} assigned</Tag>
        ) : (
          <Tag>Not visible</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/resale-plots/${record.id}`)}
          >
            Details
          </Button>
          {record.soldPrice === null ? (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                Edit
              </Button>
              <Button size="small" type="primary" onClick={() => openSell(record)}>
                Mark as Sold
              </Button>
            </>
          ) : null}
          <Popconfirm title="Delete this resale plot?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const resaleFormFields = (
    <>
      <Form.Item
        name="plotNumber"
        label="Plot Number"
        rules={[{ required: true, message: "Plot number is required" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="blockId" label="Block" rules={[{ required: true, message: "Block is required" }]}>
        <Select
          showSearch
          placeholder="Select a block"
          options={blockOptions}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Form.Item>
      <Space.Compact style={{ width: "100%" }}>
        <Form.Item
          name="size"
          label="Size"
          style={{ width: "60%" }}
          rules={[{ required: true, message: "Size is required" }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item
          name="sizeUnit"
          label="Unit"
          style={{ width: "40%" }}
          rules={[{ required: true, message: "Unit is required" }]}
        >
          <Select options={SIZE_UNIT_OPTIONS} />
        </Form.Item>
      </Space.Compact>
      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: "Category is required" }]}
      >
        <Select options={CATEGORY_OPTIONS} placeholder="Select a category" />
      </Form.Item>
      <Form.Item
        name="ownerAskingPrice"
        label="Owner's Asking Price"
        rules={[{ required: true, message: "Owner's asking price is required" }]}
      >
        <InputNumber style={{ width: "100%" }} min={0} />
      </Form.Item>
      <Form.Item
        name="listingPrice"
        label="Listing Price"
        rules={[{ required: true, message: "Listing price is required" }]}
      >
        <InputNumber style={{ width: "100%" }} min={0} />
      </Form.Item>
      <Divider titlePlacement="left" plain>
        Agent Visibility
      </Divider>
      <Form.Item
        name="openForAgents"
        label="Open to all Agents"
        valuePropName="checked"
        tooltip="When enabled, every Agent can see this plot as available to sell."
      >
        <Switch />
      </Form.Item>
      <Form.Item name="assignedAgentIds" label="Assigned Agents (optional)">
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Select specific agents who can see this plot"
          options={agentOptions}
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
          Resale Plots
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Add Resale Plot
        </Button>
      </div>

      <Typography.Paragraph type="secondary">
        Plots bought in from an existing owner and listed for resale. Profit is calculated as Sold
        Price minus the Owner's Asking Price once a plot is marked as sold.
      </Typography.Paragraph>

      <Input.Search
        allowClear
        placeholder="Search by plot number, block, or society"
        style={{ width: 320, marginBottom: 16 }}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table<PlotResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={filteredResalePlots}
        columns={columns}
      />

      <Drawer
        title="Add Resale Plot"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={420}
      >
        <Form<ResaleFormValues>
          form={createForm}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          {resaleFormFields}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Add Resale Plot
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Resale Plot"
        open={editingPlot !== null}
        onClose={() => setEditingPlot(null)}
        destroyOnHidden
        width={420}
      >
        <Form<ResaleFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingPlot) {
              updateMutation.mutate({ id: editingPlot.id, values });
            }
          }}
        >
          {resaleFormFields}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={sellingPlot ? `Mark as Sold — Plot ${sellingPlot.plotNumber}` : "Mark as Sold"}
        open={sellingPlot !== null}
        onCancel={() => {
          setSellingPlot(null);
          sellForm.resetFields();
        }}
        onOk={() => {
          if (sellingPlot) {
            confirmMarkSold(sellingPlot);
          }
        }}
        confirmLoading={markSoldMutation.isPending}
        destroyOnHidden
      >
        {sellingPlot ? (
          <Typography.Paragraph type="secondary">
            Owner asked {sellingPlot.ownerAskingPrice}, listed at {sellingPlot.listingPrice}. Profit
            is calculated as Sold Price minus the Owner's Asking Price.
          </Typography.Paragraph>
        ) : null}
        <Form<ResaleSellFormValues>
          form={sellForm}
          layout="vertical"
          onFinish={(values) => {
            if (sellingPlot) {
              markSoldMutation.mutate({ id: sellingPlot.id, values });
            }
          }}
        >
          <Form.Item
            name="soldPrice"
            label="Sold Price"
            rules={[{ required: true, message: "Sold price is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="buyerClientId" label="Buyer (optional)">
            <Select
              allowClear
              showSearch
              placeholder="Select the buyer Client"
              options={clientOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="soldDate"
            label="Sold Date"
            rules={[{ required: true, message: "Sold date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider titlePlacement="left" plain>
            Commission
          </Divider>
          <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
            Set a commission from the buyer and/or the owner. Any Agent(s) involved are then paid out
            of that total commission — they don't add an extra charge on top.
          </Typography.Paragraph>

          <Space.Compact style={{ width: "100%" }}>
            <Form.Item name="buyerCommissionType" label="Commission from Buyer" style={{ width: "60%" }}>
              <Select options={COMMISSION_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prev: ResaleSellFormValues, curr: ResaleSellFormValues) =>
                prev.buyerCommissionType !== curr.buyerCommissionType
              }
            >
              {({ getFieldValue }) => (
                <Form.Item name="buyerCommissionValue" label="Value" style={{ width: "40%" }}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={getFieldValue("buyerCommissionType") === "Percentage" ? 100 : undefined}
                    disabled={!getFieldValue("buyerCommissionType")}
                    addonAfter={getFieldValue("buyerCommissionType") === "Percentage" ? "%" : undefined}
                  />
                </Form.Item>
              )}
            </Form.Item>
          </Space.Compact>

          <Space.Compact style={{ width: "100%" }}>
            <Form.Item name="ownerCommissionType" label="Commission from Owner" style={{ width: "60%" }}>
              <Select options={COMMISSION_TYPE_OPTIONS} />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prev: ResaleSellFormValues, curr: ResaleSellFormValues) =>
                prev.ownerCommissionType !== curr.ownerCommissionType
              }
            >
              {({ getFieldValue }) => (
                <Form.Item name="ownerCommissionValue" label="Value" style={{ width: "40%" }}>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={getFieldValue("ownerCommissionType") === "Percentage" ? 100 : undefined}
                    disabled={!getFieldValue("ownerCommissionType")}
                    addonAfter={getFieldValue("ownerCommissionType") === "Percentage" ? "%" : undefined}
                  />
                </Form.Item>
              )}
            </Form.Item>
          </Space.Compact>

          <Form.Item label="Pay Agent(s) from this commission? (optional)">
            <Form.Item
              noStyle
              shouldUpdate={(prev: ResaleSellFormValues, curr: ResaleSellFormValues) =>
                prev.agentSplitMode !== curr.agentSplitMode
              }
            >
              {({ getFieldValue, setFieldValue }) => {
                const mode: CommissionType = getFieldValue("agentSplitMode") ?? "Percentage";
                return (
                  <>
                    <Form.Item name="agentSplitMode" style={{ marginBottom: 12 }} initialValue="Percentage">
                      <Segmented
                        options={[
                          { label: "Give each agent a %", value: "Percentage" },
                          { label: "Give each agent a fixed amount", value: "Fixed" },
                        ]}
                        onChange={(value) => setFieldValue("agentSplitMode", value)}
                      />
                    </Form.Item>

                    <Form.List name="agentCommissions">
                      {(fields, { add, remove }) => (
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {fields.map((field) => (
                            <Space key={field.key} align="baseline" style={{ width: "100%" }} wrap>
                              <Form.Item
                                {...field}
                                name={[field.name, "agentId"]}
                                rules={[{ required: true, message: "Agent is required" }]}
                                style={{ marginBottom: 8, minWidth: 200 }}
                              >
                                <Select
                                  showSearch
                                  placeholder="Select agent"
                                  options={agentOptions}
                                  filterOption={(input, option) =>
                                    String(option?.label ?? "")
                                      .toLowerCase()
                                      .includes(input.toLowerCase())
                                  }
                                />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, "value"]}
                                rules={[{ required: true, message: "Value is required" }]}
                                style={{ marginBottom: 8, width: 140 }}
                              >
                                <InputNumber
                                  style={{ width: "100%" }}
                                  min={0}
                                  max={mode === "Percentage" ? 100 : undefined}
                                  addonAfter={mode === "Percentage" ? "%" : undefined}
                                  placeholder={mode === "Percentage" ? "e.g. 20" : "e.g. 50000"}
                                />
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => remove(field.name)} />
                            </Space>
                          ))}
                          <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                            Add Agent
                          </Button>
                        </Space>
                      )}
                    </Form.List>
                  </>
                );
              }}
            </Form.Item>
          </Form.Item>

          <CommissionPreview form={sellForm} />
        </Form>
      </Modal>
    </div>
  );
}

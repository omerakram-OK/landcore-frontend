import { useState } from "react";
import {
  Alert,
  Button,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { TableColumnsType, UploadFile } from "antd";
import { DeleteOutlined, EditOutlined, MinusCircleOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  addOrUpdatePlotCharge,
  bulkImportPlots,
  createPlot,
  deletePlot,
  issueRefund,
  listPlots,
  listRefunds,
  mergePlots,
  recordLatePayment,
  removePlotCharge,
  runRepossessionScan,
  setPlotAnnualMaintenanceCharge,
  splitPlot,
  updatePlot,
  updatePlotPossessionStatus,
  changePlotStatus,
} from "../../api/plots";
import { listBlocks } from "../../api/blocks";
import { listSocieties } from "../../api/societies";
import { listClients } from "../../api/clients";
import { listAgents } from "../../api/agents";
import { useAuth } from "../../hooks/useAuth";
import { isApprovalRequestResponse } from "../../types/approval";
import type {
  BulkImportPlotRowResult,
  BulkImportPlotsResult,
  CreatePlotRequest,
  MergePlotsRequest,
  NewPlotDefinition,
  PlotCategory,
  PlotResponse,
  PlotSizeUnit,
  PlotStatus,
  RecordLatePaymentRequest,
  RefundRecordResponse,
  SplitPlotRequest,
  UpdatePlotRequest,
} from "../../types/plot";
import { PLOT_STATUS_TRANSITIONS } from "../../types/plot";
import { getApiErrorMessage } from "../../utils/errors";

const PLOTS_QUERY_KEY = ["plots"] as const;
const BLOCKS_QUERY_KEY = ["blocks"] as const;
const SOCIETIES_QUERY_KEY = ["societies"] as const;
const CLIENTS_QUERY_KEY = ["clients"] as const;
const AGENTS_QUERY_KEY = ["agents"] as const;
const REFUNDS_QUERY_KEY = ["refunds"] as const;

const CATEGORY_OPTIONS: Array<{ label: string; value: PlotCategory }> = [
  { label: "Residential", value: "Residential" },
  { label: "Commercial", value: "Commercial" },
];

const SIZE_UNIT_OPTIONS: Array<{ label: string; value: PlotSizeUnit }> = [
  { label: "Marla", value: "Marla" },
  { label: "Kanal", value: "Kanal" },
  { label: "Sq. Yd", value: "SqYd" },
];

function statusColor(status: PlotStatus): string {
  switch (status) {
    case "Available":
      return "green";
    case "Booked":
      return "blue";
    case "Sold":
      return "purple";
    case "Overdue":
      return "orange";
    case "Repossessed":
      return "red";
    default:
      return "default";
  }
}

interface PlotChargeFormValue {
  chargeType: string;
  amount: number;
}

interface PlotFormValues {
  plotNumber: string;
  blockId: string;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  basePrice: number;
  annualMaintenanceCharge: number;
  ownerClientIds?: string[];
  charges?: PlotChargeFormValue[];
  openForAgents?: boolean;
  assignedAgentIds?: string[];
}

interface NewPlotFormValue {
  plotNumber: string;
  blockId?: string;
  size: number;
  sizeUnit: PlotSizeUnit;
  category: PlotCategory;
  basePrice: number;
  annualMaintenanceCharge: number;
  ownerClientIds?: string[];
}

interface SplitFormValues {
  newPlots: NewPlotFormValue[];
  notes?: string;
  justification?: string;
}

interface MergeFormValues {
  sourcePlotIds: string[];
  newPlot: NewPlotFormValue;
  notes?: string;
  justification?: string;
}

interface LatePaymentFormValues {
  amountPaid: number;
  paymentDate: Dayjs;
  notes?: string;
}

interface RefundJustificationFormValues {
  justification: string;
}

function toNewPlotDefinition(value: NewPlotFormValue): NewPlotDefinition {
  return {
    plotNumber: value.plotNumber,
    blockId: value.blockId || null,
    size: value.size,
    sizeUnit: value.sizeUnit,
    category: value.category,
    basePrice: value.basePrice,
    annualMaintenanceCharge: value.annualMaintenanceCharge,
    ownerClientIds: value.ownerClientIds ?? null,
  };
}

function refundStatusColor(status: RefundRecordResponse["status"]): string {
  return status === "Issued" ? "green" : "orange";
}

export default function PlotsListPage() {
  const queryClient = useQueryClient();
  const { claims } = useAuth();
  const isAdmin = claims?.role === "Admin";

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotResponse | null>(null);
  const [chargesPlot, setChargesPlot] = useState<PlotResponse | null>(null);
  const [splittingPlot, setSplittingPlot] = useState<PlotResponse | null>(null);
  const [isMergeOpen, setMergeOpen] = useState(false);
  const [latePaymentPlot, setLatePaymentPlot] = useState<PlotResponse | null>(null);
  const [isRefundsOpen, setRefundsOpen] = useState(false);
  const [justifyingRefund, setJustifyingRefund] = useState<RefundRecordResponse | null>(null);
  const [isImportOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<BulkImportPlotsResult | null>(null);
  const [searchText, setSearchText] = useState("");

  const [createForm] = Form.useForm<PlotFormValues>();
  const [editForm] = Form.useForm<PlotFormValues>();
  const [chargeForm] = Form.useForm<PlotChargeFormValue>();
  const [maintenanceForm] = Form.useForm<{ amount: number }>();
  const [splitForm] = Form.useForm<SplitFormValues>();
  const [mergeForm] = Form.useForm<MergeFormValues>();
  const [latePaymentForm] = Form.useForm<LatePaymentFormValues>();
  const [refundJustificationForm] = Form.useForm<RefundJustificationFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: PLOTS_QUERY_KEY,
    queryFn: listPlots,
  });

  const { data: refunds, isLoading: isRefundsLoading } = useQuery({
    queryKey: REFUNDS_QUERY_KEY,
    queryFn: listRefunds,
    enabled: isRefundsOpen,
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
  const clientOptions = (clients ?? []).map((client) => ({
    label: client.fullName,
    value: client.id,
  }));
  const agentOptions = (agents ?? []).map((agent) => ({
    label: agent.fullName,
    value: agent.id,
  }));

  const invalidatePlots = () => queryClient.invalidateQueries({ queryKey: PLOTS_QUERY_KEY });

  const toCreateRequest = (values: PlotFormValues): CreatePlotRequest => ({
    plotNumber: values.plotNumber,
    blockId: values.blockId,
    size: values.size,
    sizeUnit: values.sizeUnit,
    category: values.category,
    basePrice: values.basePrice,
    annualMaintenanceCharge: values.annualMaintenanceCharge,
    charges: (values.charges ?? [])
      .filter((charge) => charge?.chargeType?.trim())
      .map((charge) => ({ chargeType: charge.chargeType.trim(), amount: charge.amount })),
    ownerClientIds: values.ownerClientIds ?? null,
    isResale: false,
    ownerAskingPrice: null,
    listingPrice: null,
    openForAgents: values.openForAgents ?? false,
    assignedAgentIds: values.assignedAgentIds ?? null,
  });

  const toUpdateRequest = (values: PlotFormValues): UpdatePlotRequest => ({
    plotNumber: values.plotNumber,
    blockId: values.blockId,
    size: values.size,
    sizeUnit: values.sizeUnit,
    category: values.category,
    basePrice: values.basePrice,
    ownerClientIds: values.ownerClientIds ?? null,
    isResale: false,
    ownerAskingPrice: null,
    listingPrice: null,
    openForAgents: values.openForAgents ?? false,
    assignedAgentIds: values.assignedAgentIds ?? null,
  });

  const createMutation = useMutation({
    mutationFn: (values: PlotFormValues) => createPlot(toCreateRequest(values)),
    onSuccess: () => {
      message.success("Plot created.");
      setCreateOpen(false);
      createForm.resetFields();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to create plot.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PlotFormValues }) =>
      updatePlot(id, toUpdateRequest(values)),
    onSuccess: () => {
      message.success("Plot updated.");
      setEditingPlot(null);
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update plot.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlot(id),
    onSuccess: () => {
      message.success("Plot deleted.");
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to delete plot.")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlotStatus }) =>
      changePlotStatus(id, { status }),
    onSuccess: () => {
      message.success("Plot status updated.");
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update plot status.")),
  });

  const possessionMutation = useMutation({
    mutationFn: (id: string) => updatePlotPossessionStatus(id, { possessionStatus: "PossessionGiven" }),
    onSuccess: () => {
      message.success("Possession marked as given.");
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update possession status.")),
  });


  const repossessionScanMutation = useMutation({
    mutationFn: runRepossessionScan,
    onSuccess: (result) => {
      message.success(
        `Repossession scan complete — ${result.newlyOverduePlotIds.length} plot(s) newly flagged Overdue, ${result.autoRepossessedPlotIds.length} plot(s) auto-repossessed.`,
      );
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Repossession scan failed.")),
  });

  const splitMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SplitPlotRequest }) => splitPlot(id, dto),
    onSuccess: (result) => {
      if (isApprovalRequestResponse(result)) {
        message.success("Plot split submitted for admin approval.");
      } else {
        message.success(`Plot split into ${result.length} new plot(s).`);
      }
      setSplittingPlot(null);
      splitForm.resetFields();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to split plot.")),
  });

  const mergeMutation = useMutation({
    mutationFn: (dto: MergePlotsRequest) => mergePlots(dto),
    onSuccess: (result) => {
      if (isApprovalRequestResponse(result)) {
        message.success("Plot merge submitted for admin approval.");
      } else {
        message.success("Plots merged.");
      }
      setMergeOpen(false);
      mergeForm.resetFields();
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to merge plots.")),
  });

  const recordLatePaymentMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: RecordLatePaymentRequest }) =>
      recordLatePayment(id, dto),
    onSuccess: () => {
      message.success("Late payment recorded — a pending refund record was created.");
      setLatePaymentPlot(null);
      latePaymentForm.resetFields();
      void invalidatePlots();
      void queryClient.invalidateQueries({ queryKey: REFUNDS_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to record late payment.")),
  });

  const issueRefundMutation = useMutation({
    mutationFn: ({ refundRecordId, justification }: { refundRecordId: string; justification?: string }) =>
      issueRefund(refundRecordId, { justification: justification || null }),
    onSuccess: (result) => {
      if (isApprovalRequestResponse(result)) {
        message.success("Refund issuance submitted for admin approval.");
      } else {
        message.success("Refund issued.");
      }
      setJustifyingRefund(null);
      refundJustificationForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: REFUNDS_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to issue refund.")),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => bulkImportPlots(file),
    onSuccess: (result) => {
      setImportResult(result);
      if (result.failureCount === 0) {
        message.success(`Imported ${result.successCount} of ${result.totalRows} plot(s).`);
      } else {
        message.warning(
          `Imported ${result.successCount} of ${result.totalRows} plot(s) — ${result.failureCount} row(s) failed, see details below.`,
        );
      }
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to import the file — check it is a valid CSV/TXT.")),
  });

  const closeImportModal = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportResult(null);
  };

  const downloadImportTemplate = () => {
    const sampleSocietyName = societies && societies.length > 0 ? societies[0].name : "DHA Phase 1";
    const sampleBlockName = blocks && blocks.length > 0 ? blocks[0].name : "North Block";
    const header =
      "SocietyName,PlotNumber,BlockName,Size,SizeUnit,Category,BasePrice,AnnualMaintenanceCharge";
    const sampleRows = [
      `${sampleSocietyName},A-101,${sampleBlockName},5,Marla,Residential,2500000,15000`,
      `${sampleSocietyName},A-102,${sampleBlockName},10,Marla,Residential,4800000,25000`,
      `${sampleSocietyName},A-103,${sampleBlockName},1,Kanal,Commercial,9500000,40000`,
    ];
    const csvContent = [header, ...sampleRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plots-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const addChargeMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PlotChargeFormValue }) =>
      addOrUpdatePlotCharge(id, { chargeType: values.chargeType.trim(), amount: values.amount }),
    onSuccess: (updated) => {
      message.success("Charge saved.");
      chargeForm.resetFields();
      setChargesPlot(updated);
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to save charge.")),
  });

  const removeChargeMutation = useMutation({
    mutationFn: ({ id, chargeType }: { id: string; chargeType: string }) =>
      removePlotCharge(id, chargeType),
    onSuccess: (updated) => {
      message.success("Charge removed.");
      setChargesPlot(updated);
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to remove charge.")),
  });

  const maintenanceChargeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      setPlotAnnualMaintenanceCharge(id, { amount }),
    onSuccess: (updated) => {
      message.success("Annual maintenance charge updated.");
      setChargesPlot(updated);
      void invalidatePlots();
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to update annual maintenance charge.")),
  });

  const openEdit = (record: PlotResponse) => {
    setEditingPlot(record);
    editForm.setFieldsValue({
      plotNumber: record.plotNumber,
      blockId: record.blockId,
      size: record.size,
      sizeUnit: record.sizeUnit,
      category: record.category,
      basePrice: record.basePrice,
      annualMaintenanceCharge: record.annualMaintenanceCharge,
      ownerClientIds: record.ownerClientIds,
      openForAgents: record.openForAgents,
      assignedAgentIds: record.assignedAgentIds,
    });
  };

  const openCharges = (record: PlotResponse) => {
    setChargesPlot(record);
    maintenanceForm.setFieldsValue({ amount: record.annualMaintenanceCharge });
  };

  const openLatePayment = (record: PlotResponse) => {
    setLatePaymentPlot(record);
    latePaymentForm.resetFields();
  };

  const plotNumberById = new Map((data ?? []).map((plot) => [plot.id, plot.plotNumber]));

  const sourcePlotOptions = (data ?? []).map((plot) => ({
    label: `${plot.plotNumber} (${plot.status})`,
    value: plot.id,
  }));

  const confirmStatusChange = (record: PlotResponse, nextStatus: PlotStatus) => {
    Modal.confirm({
      title: "Change plot status?",
      content: `Are you sure you want to change Plot ${record.plotNumber}'s status to "${nextStatus}"? This action may be irreversible.`,
      okText: "Yes, change status",
      cancelText: "Cancel",
      onOk: () => statusMutation.mutate({ id: record.id, status: nextStatus }),
    });
  };

  const filteredPlots = (data ?? [])
    .filter((plot) => !plot.isResale)
    .filter((plot) => {
      const term = searchText.trim().toLowerCase();
      if (!term) return true;
      const blockName = blockNameById.get(plot.blockId) ?? "";
      const societyName = societyNameById.get(plot.societyId) ?? "";
      return (
        plot.plotNumber.toLowerCase().includes(term) ||
        plot.category.toLowerCase().includes(term) ||
        plot.status.toLowerCase().includes(term) ||
        blockName.toLowerCase().includes(term) ||
        societyName.toLowerCase().includes(term)
      );
    });

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
    { title: "Base Price", dataIndex: "basePrice", key: "basePrice" },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const nextOptions = (PLOT_STATUS_TRANSITIONS[record.status] ?? []).map((next) => ({
          label: next,
          value: next,
        }));
        return (
          <Space direction="vertical" size={4}>
            <Tag color={statusColor(record.status)}>{record.status}</Tag>
            {nextOptions.length > 0 ? (
              <Select<PlotStatus>
                size="small"
                placeholder="Change status"
                style={{ width: 140 }}
                value={undefined}
                options={nextOptions}
                onChange={(value) => confirmStatusChange(record, value)}
              />
            ) : null}
          </Space>
        );
      },
    },
    {
      title: "Possession",
      key: "possessionStatus",
      render: (_, record) =>
        record.possessionStatus === "PossessionGiven" ? (
          <Tag color="green">Possession Given</Tag>
        ) : (
          <Popconfirm
            title="Mark possession as given for this plot?"
            onConfirm={() => possessionMutation.mutate(record.id)}
          >
            <Button size="small" loading={possessionMutation.isPending}>
              Not Handed Over
            </Button>
          </Popconfirm>
        ),
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
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Button size="small" onClick={() => openCharges(record)}>
            Charges ({record.charges.length})
          </Button>
          <Button size="small" onClick={() => setSplittingPlot(record)}>
            Split
          </Button>
          {record.status === "Repossessed" ? (
            <Button size="small" onClick={() => openLatePayment(record)}>
              Record Late Payment
            </Button>
          ) : null}
          <Popconfirm title="Delete this plot?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const plotFormFields = (isCreate: boolean) => (
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
        name="basePrice"
        label="Base Price"
        rules={[{ required: true, message: "Base price is required" }]}
      >
        <InputNumber style={{ width: "100%" }} min={0} />
      </Form.Item>
      {isCreate ? (
        <>
          <Form.Item
            name="annualMaintenanceCharge"
            label="Annual Maintenance Charge"
            rules={[{ required: true, message: "Annual maintenance charge is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item label="Charges (optional)">
            <Form.List name="charges">
              {(fields, { add, remove }) => (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline" style={{ width: "100%" }}>
                      <Form.Item
                        name={[field.name, "chargeType"]}
                        style={{ marginBottom: 8, flex: 1 }}
                      >
                        <Input placeholder="Charge type" />
                      </Form.Item>
                      <Form.Item name={[field.name, "amount"]} style={{ marginBottom: 8, width: 120 }}>
                        <InputNumber style={{ width: "100%" }} min={0} placeholder="Amount" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                    Add Charge
                  </Button>
                </Space>
              )}
            </Form.List>
          </Form.Item>
        </>
      ) : null}
      <Form.Item name="ownerClientIds" label="Owner Clients (optional)">
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Select owner clients"
          options={clientOptions}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
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

  const newPlotFields = (namePrefix: Array<string | number>, required = true) => (
    <>
      <Form.Item
        name={[...namePrefix, "plotNumber"]}
        label="Plot Number"
        rules={required ? [{ required: true, message: "Plot number is required" }] : []}
      >
        <Input />
      </Form.Item>
      <Form.Item name={[...namePrefix, "blockId"]} label="Block (optional — inherits source if omitted)">
        <Select
          allowClear
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
          name={[...namePrefix, "size"]}
          label="Size"
          style={{ width: "60%" }}
          rules={required ? [{ required: true, message: "Size is required" }] : []}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
        <Form.Item
          name={[...namePrefix, "sizeUnit"]}
          label="Unit"
          style={{ width: "40%" }}
          rules={required ? [{ required: true, message: "Unit is required" }] : []}
        >
          <Select options={SIZE_UNIT_OPTIONS} />
        </Form.Item>
      </Space.Compact>
      <Form.Item
        name={[...namePrefix, "category"]}
        label="Category"
        rules={required ? [{ required: true, message: "Category is required" }] : []}
      >
        <Select options={CATEGORY_OPTIONS} placeholder="Select a category" />
      </Form.Item>
      <Form.Item
        name={[...namePrefix, "basePrice"]}
        label="Base Price"
        rules={required ? [{ required: true, message: "Base price is required" }] : []}
      >
        <InputNumber style={{ width: "100%" }} min={0} />
      </Form.Item>
      <Form.Item
        name={[...namePrefix, "annualMaintenanceCharge"]}
        label="Annual Maintenance Charge"
        rules={required ? [{ required: true, message: "Annual maintenance charge is required" }] : []}
      >
        <InputNumber style={{ width: "100%" }} min={0} />
      </Form.Item>
      <Form.Item name={[...namePrefix, "ownerClientIds"]} label="Owner Clients (optional)">
        <Select
          mode="multiple"
          allowClear
          showSearch
          placeholder="Select owner clients"
          options={clientOptions}
          filterOption={(input, option) =>
            String(option?.label ?? "")
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Form.Item>
    </>
  );

  const justificationField = (
    <Form.Item
      name="justification"
      label={isAdmin ? "Justification (optional)" : "Justification"}
      rules={isAdmin ? [] : [{ required: true, message: "Justification is required for an approval request" }]}
    >
      <Input.TextArea rows={2} />
    </Form.Item>
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
          Plots
        </Typography.Title>
        <Space>
          <Popconfirm
            title="Run repossession scan?"
            description="Flags every Sold plot with a missed installment as Overdue."
            onConfirm={() => repossessionScanMutation.mutate()}
          >
            <Button loading={repossessionScanMutation.isPending}>Run Repossession Scan</Button>
          </Popconfirm>
          <Button onClick={() => setRefundsOpen(true)}>Refunds</Button>
          <Button onClick={() => setMergeOpen(true)}>Merge Plots</Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            Import Plots
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Create Plot
          </Button>
        </Space>
      </div>

      <Input.Search
        allowClear
        placeholder="Search by plot number, category, status, block, or society"
        style={{ width: 340, marginBottom: 16 }}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Table<PlotResponse> rowKey="id" loading={isLoading} dataSource={filteredPlots} columns={columns} />

      <Drawer
        title="Create Plot"
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        destroyOnHidden
        width={480}
      >
        <Form<PlotFormValues>
          form={createForm}
          layout="vertical"
          initialValues={{ charges: [] }}
          onFinish={(values) => createMutation.mutate(values)}
        >
          {plotFormFields(true)}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="Import Plots from CSV/TXT"
        open={isImportOpen}
        onCancel={closeImportModal}
        footer={null}
        destroyOnHidden
        width={640}
      >
        <Typography.Paragraph type="secondary">
          Upload a .csv or .txt file to create many plots at once. Required columns: SocietyName,
          PlotNumber, BlockName, Size, SizeUnit ({SIZE_UNIT_OPTIONS.map((option) => option.value).join(" / ")}
          ), Category ({CATEGORY_OPTIONS.map((option) => option.value).join(" / ")}), BasePrice.
          AnnualMaintenanceCharge is optional (defaults to 0). SocietyName must exactly match an
          existing Society, and BlockName must exactly match an existing Block within that Society —
          create them under Societies/Blocks first if they don't exist yet. Charges and owner clients
          aren't imported here; add those per-plot afterwards.
        </Typography.Paragraph>
        <Button onClick={downloadImportTemplate} style={{ marginBottom: 16 }}>
          Download Sample Template
        </Button>

        <Upload.Dragger
          accept=".csv,.txt"
          maxCount={1}
          fileList={
            importFile
              ? [{ uid: "import-file", name: importFile.name, status: "done" } as UploadFile]
              : []
          }
          beforeUpload={(file) => {
            setImportFile(file);
            setImportResult(null);
            return false;
          }}
          onRemove={() => {
            setImportFile(null);
            setImportResult(null);
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a .csv/.txt file here</p>
        </Upload.Dragger>

        <Button
          type="primary"
          block
          style={{ marginTop: 16 }}
          disabled={!importFile}
          loading={importMutation.isPending}
          onClick={() => {
            if (importFile) {
              importMutation.mutate(importFile);
            }
          }}
        >
          Start Import
        </Button>

        {importResult ? (
          <div style={{ marginTop: 16 }}>
            <Alert
              type={importResult.failureCount === 0 ? "success" : "warning"}
              showIcon
              message={`${importResult.successCount} of ${importResult.totalRows} row(s) imported successfully.`}
              style={{ marginBottom: 12 }}
            />
            <Table<BulkImportPlotRowResult>
              size="small"
              rowKey="rowNumber"
              dataSource={importResult.rows}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "Row", dataIndex: "rowNumber", key: "rowNumber", width: 70 },
                { title: "Plot #", dataIndex: "plotNumber", key: "plotNumber" },
                {
                  title: "Status",
                  key: "status",
                  width: 100,
                  render: (_, record) =>
                    record.success ? (
                      <Tag color="green">Imported</Tag>
                    ) : (
                      <Tag color="red">Failed</Tag>
                    ),
                },
                { title: "Error", dataIndex: "error", key: "error" },
              ]}
            />
          </div>
        ) : null}
      </Modal>

      <Drawer
        title="Edit Plot"
        open={editingPlot !== null}
        onClose={() => setEditingPlot(null)}
        destroyOnHidden
        width={480}
      >
        <Form<PlotFormValues>
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (editingPlot) {
              updateMutation.mutate({ id: editingPlot.id, values });
            }
          }}
        >
          {plotFormFields(false)}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={updateMutation.isPending}>
              Save
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={chargesPlot ? `Charges — Plot ${chargesPlot.plotNumber}` : "Charges"}
        open={chargesPlot !== null}
        onClose={() => setChargesPlot(null)}
        destroyOnHidden
        width={420}
      >
        {chargesPlot && chargesPlot.charges.length > 0 ? (
          <List
            dataSource={chargesPlot.charges}
            renderItem={(charge) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="remove"
                    title="Remove this charge?"
                    onConfirm={() =>
                      removeChargeMutation.mutate({ id: chargesPlot.id, chargeType: charge.chargeType })
                    }
                  >
                    <Button size="small" danger loading={removeChargeMutation.isPending}>
                      Remove
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta title={charge.chargeType} description={`Amount: ${charge.amount}`} />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No charges yet" />
        )}

        <Form<PlotChargeFormValue>
          form={chargeForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          onFinish={(values) => {
            if (chargesPlot) {
              addChargeMutation.mutate({ id: chargesPlot.id, values });
            }
          }}
        >
          <Form.Item
            name="chargeType"
            label="Charge Type"
            rules={[{ required: true, message: "Charge type is required" }]}
          >
            <Input placeholder="e.g. Development Charges" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={addChargeMutation.isPending}>
              Add / Update Charge
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Form<{ amount: number }>
          form={maintenanceForm}
          layout="vertical"
          onFinish={(values) => {
            if (chargesPlot) {
              maintenanceChargeMutation.mutate({ id: chargesPlot.id, amount: values.amount });
            }
          }}
        >
          <Form.Item
            name="amount"
            label="Annual Maintenance Charge"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button block loading={maintenanceChargeMutation.isPending} htmlType="submit">
              Save Maintenance Charge
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={splittingPlot ? `Split Plot ${splittingPlot.plotNumber}` : "Split Plot"}
        open={splittingPlot !== null}
        onClose={() => setSplittingPlot(null)}
        destroyOnHidden
        width={560}
      >
        <Typography.Paragraph type="secondary">
          Define at least 2 new plots to replace this one. As an Admin this executes immediately; as
          an Employee it is submitted as a MergeSplit approval request for an Admin to review.
        </Typography.Paragraph>
        <Form<SplitFormValues>
          form={splitForm}
          layout="vertical"
          initialValues={{ newPlots: [{}, {}] }}
          onFinish={(values) => {
            if (!splittingPlot) return;
            const dto: SplitPlotRequest = {
              newPlots: (values.newPlots ?? []).map(toNewPlotDefinition),
              notes: values.notes || null,
              justification: values.justification || null,
            };
            splitMutation.mutate({ id: splittingPlot.id, dto });
          }}
        >
          <Form.List name="newPlots">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: "100%" }}>
                {fields.map((field) => (
                  <div key={field.key} style={{ border: "1px solid #f0f0f0", padding: 12, borderRadius: 4 }}>
                    <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }}>
                      <Typography.Text strong>New Plot {field.name + 1}</Typography.Text>
                      {fields.length > 2 ? (
                        <MinusCircleOutlined onClick={() => remove(field.name)} />
                      ) : null}
                    </Space>
                    {newPlotFields([field.name])}
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Add New Plot
                </Button>
              </Space>
            )}
          </Form.List>
          <Divider />
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          {justificationField}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={splitMutation.isPending}>
              Submit Split
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Merge Plots"
        open={isMergeOpen}
        onClose={() => setMergeOpen(false)}
        destroyOnHidden
        width={560}
      >
        <Typography.Paragraph type="secondary">
          Select at least 2 source plots (same block) to merge into one new plot. As an Admin this
          executes immediately; as an Employee it is submitted as a MergeSplit approval request.
        </Typography.Paragraph>
        <Form<MergeFormValues>
          form={mergeForm}
          layout="vertical"
          onFinish={(values) => {
            const dto: MergePlotsRequest = {
              sourcePlotIds: values.sourcePlotIds,
              newPlot: values.newPlot?.plotNumber ? toNewPlotDefinition(values.newPlot) : null,
              notes: values.notes || null,
              justification: values.justification || null,
            };
            mergeMutation.mutate(dto);
          }}
        >
          <Form.Item
            name="sourcePlotIds"
            label="Source Plots"
            rules={[
              {
                validator: (_, value: string[] | undefined) =>
                  value && value.length >= 2
                    ? Promise.resolve()
                    : Promise.reject(new Error("Select at least 2 source plots")),
              },
            ]}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Select source plots"
              options={sourcePlotOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Divider>New Merged Plot (optional — leave blank to inherit from sources)</Divider>
          {newPlotFields(["newPlot"], false)}
          <Divider />
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          {justificationField}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={mergeMutation.isPending}>
              Submit Merge
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={
          latePaymentPlot ? `Record Late Payment — Plot ${latePaymentPlot.plotNumber}` : "Record Late Payment"
        }
        open={latePaymentPlot !== null}
        onCancel={() => setLatePaymentPlot(null)}
        footer={null}
        destroyOnHidden
      >
        <Form<LatePaymentFormValues>
          form={latePaymentForm}
          layout="vertical"
          onFinish={(values) => {
            if (!latePaymentPlot) return;
            const dto: RecordLatePaymentRequest = {
              amountPaid: values.amountPaid,
              paymentDate: values.paymentDate.toISOString(),
              notes: values.notes || null,
            };
            recordLatePaymentMutation.mutate({ id: latePaymentPlot.id, dto });
          }}
        >
          <Form.Item
            name="amountPaid"
            label="Amount Paid"
            rules={[{ required: true, message: "Amount paid is required" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="paymentDate"
            label="Payment Date"
            rules={[{ required: true, message: "Payment date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={recordLatePaymentMutation.isPending}>
              Record Payment
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Refunds"
        open={isRefundsOpen}
        onClose={() => setRefundsOpen(false)}
        destroyOnHidden
        width={760}
      >
        <Table<RefundRecordResponse>
          rowKey="id"
          loading={isRefundsLoading}
          dataSource={refunds}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Plot",
              dataIndex: "plotId",
              key: "plotId",
              render: (plotId: string) => plotNumberById.get(plotId) ?? plotId,
            },
            { title: "Amount Paid", dataIndex: "amountPaid", key: "amountPaid" },
            { title: "Company Profit", dataIndex: "companyProfitAmount", key: "companyProfitAmount" },
            { title: "Client Refund", dataIndex: "clientRefundAmount", key: "clientRefundAmount" },
            {
              title: "Payment Date",
              dataIndex: "paymentDate",
              key: "paymentDate",
              render: (value: string) => dayjs(value).format("DD-MMM-YYYY"),
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status: RefundRecordResponse["status"]) => (
                <Tag color={refundStatusColor(status)}>{status}</Tag>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) =>
                record.status === "PendingIssuance" ? (
                  isAdmin ? (
                    <Popconfirm
                      title="Issue this refund?"
                      onConfirm={() => issueRefundMutation.mutate({ refundRecordId: record.id })}
                    >
                      <Button size="small" loading={issueRefundMutation.isPending}>
                        Issue
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Button size="small" onClick={() => setJustifyingRefund(record)}>
                      Request Issuance
                    </Button>
                  )
                ) : (
                  <Tag color="green">Issued</Tag>
                ),
            },
          ]}
        />
      </Drawer>

      <Modal
        title="Request Refund Issuance"
        open={justifyingRefund !== null}
        onCancel={() => setJustifyingRefund(null)}
        footer={null}
        destroyOnHidden
      >
        <Form<RefundJustificationFormValues>
          form={refundJustificationForm}
          layout="vertical"
          onFinish={(values) => {
            if (!justifyingRefund) return;
            issueRefundMutation.mutate({
              refundRecordId: justifyingRefund.id,
              justification: values.justification,
            });
          }}
        >
          <Form.Item
            name="justification"
            label="Justification"
            rules={[{ required: true, message: "Justification is required" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={issueRefundMutation.isPending}>
              Submit for Approval
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

import { Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getMyAvailablePlots } from "../../api/agentPortal";
import type { PlotResponse } from "../../types/plot";

export default function AvailablePlotsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-portal", "plots"],
    queryFn: getMyAvailablePlots,
  });

  const columns: TableColumnsType<PlotResponse> = [
    { title: "Plot #", dataIndex: "plotNumber", key: "plotNumber" },
    { title: "Size", key: "size", render: (_, record) => `${record.size} ${record.sizeUnit}` },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Type",
      key: "type",
      render: (_, record) => (record.isResale ? <Tag color="purple">Resale</Tag> : <Tag color="blue">Installment</Tag>),
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => (record.isResale ? record.listingPrice ?? "—" : record.basePrice).toLocaleString(),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        Available Plots
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        These plots have been opened up to you by the society. Use them to find prospective clients.
      </Typography.Paragraph>
      <Table<PlotResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={columns}
        locale={{ emptyText: "No plots are currently available to you." }}
      />
    </div>
  );
}

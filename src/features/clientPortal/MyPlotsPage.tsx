import { Button, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMyPlots } from "../../api/clientPortal";
import type { PlotResponse } from "../../types/plot";

const STATUS_COLORS: Record<string, string> = {
  Available: "default",
  Booked: "processing",
  Sold: "success",
  Overdue: "warning",
  Repossessed: "error",
};

export default function MyPlotsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["client-portal", "plots"], queryFn: getMyPlots });

  const columns: TableColumnsType<PlotResponse> = [
    { title: "Plot #", dataIndex: "plotNumber", key: "plotNumber" },
    { title: "Size", key: "size", render: (_, record) => `${record.size} ${record.sizeUnit}` },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Base Price",
      dataIndex: "basePrice",
      key: "basePrice",
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color={STATUS_COLORS[status] ?? "default"}>{status}</Tag>,
    },
    {
      title: "Possession",
      dataIndex: "possessionStatus",
      key: "possessionStatus",
      render: (status: string) => (
        <Tag color={status === "PossessionGiven" ? "success" : "default"}>
          {status === "PossessionGiven" ? "Possession Given" : "Not Handed Over"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<RightOutlined />}
          onClick={() => navigate(`/client-portal/plots/${record.id}`)}
        >
          View Installments &amp; Payments
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        My Plots
      </Typography.Title>
      <Table<PlotResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={columns}
        onRow={(record) => ({
          style: { cursor: "pointer" },
          onClick: () => navigate(`/client-portal/plots/${record.id}`),
        })}
        locale={{ emptyText: "You do not have any plots yet." }}
      />
    </div>
  );
}

import { Button, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMyResalePurchases } from "../../api/clientPortal";
import type { PlotResponse } from "../../types/plot";

export default function MyResalePurchasesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["client-portal", "resale-purchases"],
    queryFn: getMyResalePurchases,
  });

  const columns: TableColumnsType<PlotResponse> = [
    { title: "Plot #", dataIndex: "plotNumber", key: "plotNumber" },
    { title: "Size", key: "size", render: (_, record) => `${record.size} ${record.sizeUnit}` },
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Sold Price",
      dataIndex: "soldPrice",
      key: "soldPrice",
      render: (value: number | null) => (value === null ? "-" : value.toLocaleString()),
    },
    {
      title: "Sold Date",
      dataIndex: "soldDate",
      key: "soldDate",
      render: (value: string | null) => (value ? new Date(value).toLocaleDateString() : "-"),
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
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        My Resale Purchases
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
        locale={{ emptyText: "You have not purchased any resale plots." }}
      />
    </div>
  );
}

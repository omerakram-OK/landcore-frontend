import { Statistic, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getMyCommissions } from "../../api/agentPortal";
import type { AgentCommissionRecordResponse } from "../../types/agent";

export default function MyCommissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-portal", "commissions"],
    queryFn: getMyCommissions,
  });

  const records = data ?? [];
  const totalEarned = records.reduce((sum, record) => sum + record.amount, 0);

  const columns: TableColumnsType<AgentCommissionRecordResponse> = [
    {
      title: "Earned",
      dataIndex: "earnedAt",
      key: "earnedAt",
      render: (value: string) => dayjs(value).format("DD MMM YYYY"),
    },
    { title: "Plot", dataIndex: "plotNumber", key: "plotNumber" },
    {
      title: "Source",
      dataIndex: "sourceType",
      key: "sourceType",
      render: (value: string) => <Tag color={value === "Resale" ? "purple" : "blue"}>{value}</Tag>,
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, record) =>
        record.commissionType === "Percentage"
          ? `PKR ${record.amount.toLocaleString()} (${record.commissionValue}%)`
          : `PKR ${record.amount.toLocaleString()}`,
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        My Commissions
      </Typography.Title>
      <Statistic
        title="Total Earned"
        value={totalEarned}
        precision={2}
        prefix="PKR"
        style={{ marginBottom: 16 }}
      />
      <Table<AgentCommissionRecordResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={records}
        columns={columns}
        locale={{ emptyText: "You have not earned any commissions yet." }}
      />
    </div>
  );
}

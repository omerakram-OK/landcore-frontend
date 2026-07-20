import { Alert, Card, Descriptions, Skeleton, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getPlatformSummary } from "../../api/reports";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(amount: number): string {
  return `PKR ${numberFormatter.format(amount)}`;
}

export default function PlatformReportsPage() {
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["reports", "platform-summary"],
    queryFn: getPlatformSummary,
  });

  const monthLabel = data
    ? new Date(data.year, data.month - 1, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })
    : undefined;

  return (
    <div>
      <Typography.Title level={4}>Platform Reports</Typography.Title>
      <Typography.Paragraph type="secondary">
        Consolidated, cross-tenant snapshot of the platform — every Admin/tenant, not scoped to
        any single one.
      </Typography.Paragraph>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load platform report"
          description={error instanceof Error ? error.message : "Please try again later."}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Card
        title="Platform Summary Report"
        extra={
          dataUpdatedAt ? (
            <Typography.Text type="secondary">
              Generated {dayjs(dataUpdatedAt).format("DD-MMM-YYYY HH:mm")}
            </Typography.Text>
          ) : null
        }
      >
        <Skeleton loading={isLoading} active paragraph={{ rows: 6 }}>
          {data ? (
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="Total Admins / Tenants">{data.totalAdmins}</Descriptions.Item>
              <Descriptions.Item label="Active Admins / Tenants">
                {data.totalActiveAdmins}
              </Descriptions.Item>
              <Descriptions.Item label="Total Plots (across all tenants)">
                {data.totalPlots}
              </Descriptions.Item>
              <Descriptions.Item label="Overdue Plots (across all tenants)">
                <span style={{ color: data.totalOverduePlots > 0 ? "#cf1322" : undefined }}>
                  {data.totalOverduePlots}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={`Payments Collected (${monthLabel ?? "this month"})`}>
                {formatCurrency(data.totalPaymentsCollectedThisMonth)}
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Skeleton>
      </Card>
    </div>
  );
}

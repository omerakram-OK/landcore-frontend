import { Alert, Card, Col, Row, Skeleton, Statistic, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getPlatformSummary } from "../../api/reports";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(amount: number): string {
  return `PKR ${numberFormatter.format(amount)}`;
}

export default function PlatformDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
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
      <Typography.Title level={4}>Platform Dashboard</Typography.Title>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load platform summary"
          description={error instanceof Error ? error.message : "Please try again later."}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={isLoading} active paragraph={false}>
              <Statistic
                title="Active Admins / Tenants"
                value={data ? `${data.totalActiveAdmins} / ${data.totalAdmins}` : undefined}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={isLoading} active paragraph={false}>
              <Statistic title="Total Plots" value={data?.totalPlots} />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={isLoading} active paragraph={false}>
              <Statistic
                title={monthLabel ? `Payments Collected (${monthLabel})` : "Payments Collected This Month"}
                value={data ? formatCurrency(data.totalPaymentsCollectedThisMonth) : undefined}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton loading={isLoading} active paragraph={false}>
              <Statistic
                title="Overdue Plots"
                value={data?.totalOverduePlots}
                valueStyle={data && data.totalOverduePlots > 0 ? { color: "#cf1322" } : undefined}
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

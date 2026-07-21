import { Alert, Card, Col, Row, Skeleton, Statistic, Tag, Typography } from "antd";
import {
  BankOutlined,
  ContainerOutlined,
  DollarOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useQueries, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { listPlots } from "../../api/plots";
import { listBookings } from "../../api/bookings";
import { listLeads } from "../../api/leads";
import { getAgingReport, getDailyCollectionReport } from "../../api/reports";
import type { PlotResponse, PlotStatus } from "../../types/plot";
import type { BookingResponse } from "../../types/booking";
import type { LeadResponse } from "../../types/lead";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(amount: number): string {
  return `PKR ${numberFormatter.format(amount)}`;
}

function countByStatus(plots: PlotResponse[] | undefined, status: PlotStatus): number {
  return plots ? plots.filter((plot) => plot.status === status).length : 0;
}

const PLOT_STATUSES: PlotStatus[] = ["Available", "Booked", "Sold", "Overdue", "Repossessed"];

const STATUS_COLORS: Record<PlotStatus, string> = {
  Available: "#14B8A6",
  Booked: "#3B82F6",
  Sold: "#0B1F3A",
  Overdue: "#F59E0B",
  Repossessed: "#EF4444",
};

function plotStatusTagColor(status: PlotStatus): string | undefined {
  if (status === "Overdue") return "orange";
  if (status === "Repossessed") return "red";
  if (status === "Available") return "green";
  return undefined;
}

const STAT_CARD_STYLE = { borderRadius: 12, height: "100%" } as const;

export default function DashboardPage() {
  const { claims } = useAuth();
  const today = dayjs().format("YYYY-MM-DD");

  const plotsQuery = useQuery({ queryKey: ["plots"], queryFn: listPlots });
  const bookingsQuery = useQuery({ queryKey: ["bookings"], queryFn: listBookings });
  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: listLeads });
  const dailyCollectionQuery = useQuery({
    queryKey: ["reports", "daily-collection", today] as const,
    queryFn: () => getDailyCollectionReport(today),
  });
  const agingQuery = useQuery({ queryKey: ["reports", "aging"] as const, queryFn: getAgingReport });

  const last7Days = Array.from({ length: 7 }, (_, index) => dayjs().subtract(6 - index, "day"));
  const trendQueries = useQueries({
    queries: last7Days.map((day) => ({
      queryKey: ["reports", "daily-collection", day.format("YYYY-MM-DD")] as const,
      queryFn: () => getDailyCollectionReport(day.format("YYYY-MM-DD")),
    })),
  });
  const trendLoading = trendQueries.some((query) => query.isLoading);
  const trendData = last7Days.map((day, index) => ({
    label: day.format("DD MMM"),
    amount: trendQueries[index]?.data?.totalAmount ?? 0,
  }));

  const failedQuery = [plotsQuery, bookingsQuery, leadsQuery, dailyCollectionQuery, agingQuery].find(
    (query) => query.isError,
  );

  const plots = plotsQuery.data;
  const activeBookingsCount = bookingsQuery.data
    ? bookingsQuery.data.filter((booking: BookingResponse) => booking.status === "Active").length
    : undefined;
  const newLeadsCount = leadsQuery.data
    ? leadsQuery.data.filter((lead: LeadResponse) => lead.status === "New").length
    : undefined;

  const plotStatusChartData = PLOT_STATUSES.map((status) => ({
    status,
    count: countByStatus(plots, status),
  })).filter((entry) => entry.count > 0);

  const agingChartData = (agingQuery.data?.buckets ?? []).map((bucket) => ({
    bucket: bucket.bucket,
    amount: bucket.outstandingAmount,
  }));

  return (
    <div>
      <Typography.Title level={4}>
        {claims?.email ? `Welcome back, ${claims.email}` : "Dashboard"}
      </Typography.Title>

      {failedQuery ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load some dashboard data"
          description={
            failedQuery.error instanceof Error ? failedQuery.error.message : "Please try again later."
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card style={STAT_CARD_STYLE}>
            <Skeleton loading={plotsQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Total Plots"
                value={plots?.length}
                prefix={<ContainerOutlined style={{ color: "#0B1F3A" }} />}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={STAT_CARD_STYLE}>
            <Skeleton loading={bookingsQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Active Bookings"
                value={activeBookingsCount}
                prefix={<ScheduleOutlined style={{ color: "#3B82F6" }} />}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={STAT_CARD_STYLE}>
            <Skeleton loading={leadsQuery.isLoading} active paragraph={false}>
              <Statistic
                title="New Leads"
                value={newLeadsCount}
                prefix={<SolutionOutlined style={{ color: "#14B8A6" }} />}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={STAT_CARD_STYLE}>
            <Skeleton loading={dailyCollectionQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Collected Today"
                value={
                  dailyCollectionQuery.data ? formatCurrency(dailyCollectionQuery.data.totalAmount) : undefined
                }
                prefix={<DollarOutlined style={{ color: "#14B8A6" }} />}
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={STAT_CARD_STYLE}>
            <Skeleton loading={agingQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Outstanding Installments"
                value={agingQuery.data?.totalOutstandingCount}
                prefix={<WarningOutlined style={{ color: "#F59E0B" }} />}
                valueStyle={
                  agingQuery.data && agingQuery.data.totalOutstandingCount > 0 ? { color: "#cf1322" } : undefined
                }
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={STAT_CARD_STYLE}>
            <Skeleton loading={agingQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Outstanding Amount"
                value={
                  agingQuery.data ? formatCurrency(agingQuery.data.totalOutstandingAmount) : undefined
                }
                prefix={<BankOutlined style={{ color: "#F59E0B" }} />}
                valueStyle={
                  agingQuery.data && agingQuery.data.totalOutstandingAmount > 0 ? { color: "#cf1322" } : undefined
                }
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Collections — Last 7 Days" style={{ borderRadius: 12 }}>
            <Skeleton loading={trendLoading} active>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => numberFormatter.format(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="amount" name="Collected" stroke="#14B8A6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Plots by Status" style={{ borderRadius: 12 }}>
            <Skeleton loading={plotsQuery.isLoading} active>
              {plotStatusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={plotStatusChartData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {plotStatusChartData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography.Text type="secondary">No plots yet.</Typography.Text>
              )}
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Outstanding by Age Bucket" style={{ borderRadius: 12 }}>
            <Skeleton loading={agingQuery.isLoading} active>
              {agingChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={agingChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => numberFormatter.format(value)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" name="Outstanding" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography.Text type="secondary">No outstanding installments — everything is up to date.</Typography.Text>
              )}
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Plot Status Breakdown" style={{ borderRadius: 12 }}>
            <Skeleton loading={plotsQuery.isLoading} active paragraph={{ rows: 3 }}>
              <Row gutter={[12, 12]}>
                {PLOT_STATUSES.map((status) => (
                  <Col xs={12} sm={8} key={status}>
                    <Card size="small" style={{ borderRadius: 10, textAlign: "center" }}>
                      <Tag color={plotStatusTagColor(status)} style={{ marginBottom: 6 }}>
                        {status}
                      </Tag>
                      <Statistic value={countByStatus(plots, status)} />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

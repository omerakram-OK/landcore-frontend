import { Alert, Card, Col, Row, Skeleton, Statistic, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
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

function plotStatusTagColor(status: PlotStatus): string | undefined {
  if (status === "Overdue") return "red";
  if (status === "Repossessed") return "volcano";
  if (status === "Available") return "green";
  return undefined;
}

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
          <Card>
            <Skeleton loading={plotsQuery.isLoading} active paragraph={false}>
              <Statistic title="Total Plots" value={plots?.length} />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Skeleton loading={bookingsQuery.isLoading} active paragraph={false}>
              <Statistic title="Active Bookings" value={activeBookingsCount} />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Skeleton loading={leadsQuery.isLoading} active paragraph={false}>
              <Statistic title="New Leads" value={newLeadsCount} />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Skeleton loading={dailyCollectionQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Collected Today"
                value={
                  dailyCollectionQuery.data ? formatCurrency(dailyCollectionQuery.data.totalAmount) : undefined
                }
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Skeleton loading={agingQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Outstanding Installments"
                value={agingQuery.data?.totalOutstandingCount}
                valueStyle={
                  agingQuery.data && agingQuery.data.totalOutstandingCount > 0 ? { color: "#cf1322" } : undefined
                }
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Skeleton loading={agingQuery.isLoading} active paragraph={false}>
              <Statistic
                title="Outstanding Amount"
                value={
                  agingQuery.data ? formatCurrency(agingQuery.data.totalOutstandingAmount) : undefined
                }
                valueStyle={
                  agingQuery.data && agingQuery.data.totalOutstandingAmount > 0 ? { color: "#cf1322" } : undefined
                }
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Plots by Status
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {PLOT_STATUSES.map((status) => (
          <Col xs={12} sm={8} lg={4} key={status}>
            <Card size="small">
              <Skeleton loading={plotsQuery.isLoading} active paragraph={false}>
                <Statistic
                  title={<Tag color={plotStatusTagColor(status)}>{status}</Tag>}
                  value={countByStatus(plots, status)}
                />
              </Skeleton>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

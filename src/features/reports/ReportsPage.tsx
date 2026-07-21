import { useState } from "react";
import { Alert, Card, Col, DatePicker, Empty, Row, Statistic, Table, Tabs, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAgingReport, getDailyCollectionReport, getMonthlyProfitReport } from "../../api/reports";
import type { AgingBucket, MonthlyProfitReport } from "../../types/report";
import type { PaymentModeBreakdown } from "../../types/bankAccount";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatCurrency(amount: number): string {
  return `PKR ${numberFormatter.format(amount)}`;
}

const CHART_COLORS = ["#14B8A6", "#3B82F6", "#0B1F3A", "#F59E0B", "#EF4444", "#8B5CF6"];

function agingBucketColor(bucket: string): string {
  if (bucket === "Current") return "green";
  if (bucket === "90+") return "red";
  return "orange";
}

const modeColumns: TableColumnsType<PaymentModeBreakdown> = [
  { title: "Mode", dataIndex: "mode", key: "mode", render: (mode: string) => <Tag>{mode}</Tag> },
  { title: "Count", dataIndex: "count", key: "count" },
  { title: "Amount", dataIndex: "amount", key: "amount", render: (amount: number) => formatCurrency(amount) },
];

const agingColumns: TableColumnsType<AgingBucket> = [
  {
    title: "Age Bucket",
    dataIndex: "bucket",
    key: "bucket",
    render: (bucket: string) => <Tag color={agingBucketColor(bucket)}>{bucket}</Tag>,
  },
  { title: "Installments", dataIndex: "count", key: "count" },
  {
    title: "Outstanding Amount",
    dataIndex: "outstandingAmount",
    key: "outstandingAmount",
    render: (amount: number) => formatCurrency(amount),
  },
];

function DailyCollectionTab() {
  const [date, setDate] = useState<Dayjs>(dayjs());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reports", "daily-collection", date.format("YYYY-MM-DD")] as const,
    queryFn: () => getDailyCollectionReport(date.format("YYYY-MM-DD")),
  });

  return (
    <div>
      <Typography.Paragraph type="secondary">
        Total Payments recorded on the selected date, broken down by payment mode.
      </Typography.Paragraph>

      <DatePicker
        value={date}
        onChange={(value) => value && setDate(value)}
        allowClear={false}
        style={{ marginBottom: 16 }}
      />

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load daily collection report"
          description={error instanceof Error ? error.message : "Please try again later."}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Total Payments" value={data?.totalCount} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Amount"
              value={data ? formatCurrency(data.totalAmount) : undefined}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          {data && data.byMode.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.byMode} dataKey="amount" nameKey="mode" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.byMode.map((entry, index) => (
                    <Cell key={entry.mode} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No payments recorded on this date" style={{ marginTop: 40 }} />
          )}
        </Col>
        <Col xs={24} lg={14}>
          <Table<PaymentModeBreakdown>
            size="small"
            rowKey="mode"
            loading={isLoading}
            pagination={false}
            dataSource={data?.byMode}
            columns={modeColumns}
            locale={{ emptyText: <Empty description="No payments recorded on this date" /> }}
          />
        </Col>
      </Row>
    </div>
  );
}

function MonthlyProfitTab() {
  const [month, setMonth] = useState<Dayjs>(dayjs());

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reports", "monthly-profit", month.year(), month.month() + 1] as const,
    queryFn: () => getMonthlyProfitReport(month.year(), month.month() + 1),
  });

  const netProfitColor = (report: MonthlyProfitReport | undefined) =>
    report && report.netProfit < 0 ? "#cf1322" : undefined;

  const chartData = data
    ? [
        { label: "Collected", amount: data.totalCollected },
        { label: "Refund Share", amount: data.totalCompanyProfitShareFromRefunds },
        { label: "Net Profit", amount: data.netProfit },
      ]
    : [];

  return (
    <div>
      <Typography.Paragraph type="secondary">
        Net profit for the selected month: total Payments collected minus the company's retained
        profit share from Refunds issued in the same month.
      </Typography.Paragraph>

      <DatePicker
        picker="month"
        value={month}
        onChange={(value) => value && setMonth(value)}
        allowClear={false}
        style={{ marginBottom: 16 }}
      />

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load monthly profit report"
          description={error instanceof Error ? error.message : "Please try again later."}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Payment Count" value={data?.paymentCount} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Collected"
              value={data ? formatCurrency(data.totalCollected) : undefined}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Refund Count" value={data?.refundCount} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Company Profit Share From Refunds"
              value={data ? formatCurrency(data.totalCompanyProfitShareFromRefunds) : undefined}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Net Profit"
              value={data ? formatCurrency(data.netProfit) : undefined}
              loading={isLoading}
              valueStyle={{ color: netProfitColor(data) }}
            />
          </Card>
        </Col>
      </Row>

      {data ? (
        <Card style={{ borderRadius: 12 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => numberFormatter.format(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" name="Amount" fill="#14B8A6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ) : null}
    </div>
  );
}

function AgingReportTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reports", "aging"] as const,
    queryFn: getAgingReport,
  });

  return (
    <div>
      <Typography.Paragraph type="secondary">
        Every outstanding (unpaid) installment across all installment plans, bucketed by how
        overdue it is as of today.
      </Typography.Paragraph>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Failed to load aging report"
          description={error instanceof Error ? error.message : "Please try again later."}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Total Outstanding Installments" value={data?.totalOutstandingCount} loading={isLoading} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Outstanding Amount"
              value={data ? formatCurrency(data.totalOutstandingAmount) : undefined}
              loading={isLoading}
              valueStyle={data && data.totalOutstandingAmount > 0 ? { color: "#cf1322" } : undefined}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          {data && data.buckets.some((bucket) => bucket.outstandingAmount > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.buckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => numberFormatter.format(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="outstandingAmount" name="Outstanding" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Nothing outstanding" style={{ marginTop: 40 }} />
          )}
        </Col>
        <Col xs={24} lg={14}>
          <Table<AgingBucket>
            size="small"
            rowKey="bucket"
            loading={isLoading}
            pagination={false}
            dataSource={data?.buckets}
            columns={agingColumns}
          />
        </Col>
      </Row>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div>
      <Typography.Title level={4}>Reports</Typography.Title>
      <Tabs
        defaultActiveKey="daily-collection"
        items={[
          { key: "daily-collection", label: "Daily Collection", children: <DailyCollectionTab /> },
          { key: "monthly-profit", label: "Monthly Profit", children: <MonthlyProfitTab /> },
          { key: "aging", label: "Aging Report", children: <AgingReportTab /> },
        ]}
      />
    </div>
  );
}

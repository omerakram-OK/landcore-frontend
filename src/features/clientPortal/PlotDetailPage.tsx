import { Alert, Button, Card, Empty, List, Progress, Space, Tag, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  DownloadOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { downloadMyDocument, getMyPlotDetail } from "../../api/clientPortal";
import type { InstallmentDto } from "../../types/installment";
import { getApiErrorMessage } from "../../utils/errors";

const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  Pending: "Upcoming",
  PartiallyPaid: "Partially Paid",
  Paid: "Paid",
  Late: "Overdue",
  Missed: "Overdue",
};

const INSTALLMENT_STATUS_COLOR: Record<string, string> = {
  Pending: "default",
  PartiallyPaid: "processing",
  Paid: "success",
  Late: "error",
  Missed: "error",
};

const PLOT_STATUS_COLORS: Record<string, string> = {
  Available: "default",
  Booked: "processing",
  Sold: "success",
  Overdue: "warning",
  Repossessed: "error",
};

function formatMoney(value: number): string {
  return `PKR ${value.toLocaleString()}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function PlotDetailPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-portal", "plot-detail", plotId],
    queryFn: () => getMyPlotDetail(plotId!),
    enabled: Boolean(plotId),
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => downloadMyDocument(id),
    onError: (mutationError) => message.error(getApiErrorMessage(mutationError, "Failed to download document.")),
  });

  if (isLoading) {
    return <Typography.Text>Loading plot details...</Typography.Text>;
  }

  if (error || !data) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load this plot"
        description="This plot may no longer be associated with your account."
      />
    );
  }

  const { plot, installmentPlan, payments, documents } = data;

  const nextInstallment = installmentPlan?.installments
    .filter((installment) => installment.status !== "Paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const isOverdue = nextInstallment
    ? new Date(nextInstallment.dueDate).getTime() < Date.now() && nextInstallment.status !== "Paid"
    : false;

  const totalScheduled = installmentPlan
    ? (installmentPlan.downPayment ?? 0) + installmentPlan.installments.reduce((sum, i) => sum + i.amount, 0)
    : 0;
  const totalPaid = installmentPlan
    ? (installmentPlan.downPayment ?? 0) + installmentPlan.installments.reduce((sum, i) => sum + i.paidAmount, 0)
    : 0;
  const progressPercent = totalScheduled > 0 ? Math.min(100, Math.round((totalPaid / totalScheduled) * 100)) : 0;

  const sortedInstallments: InstallmentDto[] = installmentPlan
    ? [...installmentPlan.installments].sort((a, b) => a.seqNo - b.seqNo)
    : [];

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 12, paddingLeft: 0 }}
      >
        Back
      </Button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Plot {plot.plotNumber}
        </Typography.Title>
        <Tag color={PLOT_STATUS_COLORS[plot.status] ?? "default"}>{plot.status}</Tag>
        <Tag color={plot.possessionStatus === "PossessionGiven" ? "success" : "default"}>
          {plot.possessionStatus === "PossessionGiven" ? "Possession Given" : "Not Handed Over"}
        </Tag>
        <Typography.Text type="secondary">
          {plot.size} {plot.sizeUnit} &middot; {plot.category}
        </Typography.Text>
      </div>

      {plot.isResale ? (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={4}>
            <Typography.Text strong style={{ fontSize: 16 }}>
              <CheckCircleFilled style={{ color: "#52c41a", marginRight: 8 }} />
              Purchased in full — {plot.soldPrice !== null ? formatMoney(plot.soldPrice) : "-"}
            </Typography.Text>
            {plot.soldDate ? (
              <Typography.Text type="secondary">Purchased on {formatDate(plot.soldDate)}</Typography.Text>
            ) : null}
          </Space>
        </Card>
      ) : installmentPlan ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">Payment Progress</Typography.Text>
            <Progress percent={progressPercent} status={progressPercent >= 100 ? "success" : "active"} />
            <Space size={32} wrap style={{ marginTop: 8 }}>
              <div>
                <Typography.Text type="secondary">Total Price</Typography.Text>
                <br />
                <Typography.Text strong>{formatMoney(totalScheduled)}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Paid So Far</Typography.Text>
                <br />
                <Typography.Text strong style={{ color: "#52c41a" }}>
                  {formatMoney(totalPaid)}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Remaining</Typography.Text>
                <br />
                <Typography.Text strong>{formatMoney(Math.max(0, totalScheduled - totalPaid))}</Typography.Text>
              </div>
            </Space>
          </Card>

          {nextInstallment ? (
            <Alert
              style={{ marginBottom: 16 }}
              type={isOverdue ? "error" : "info"}
              showIcon
              icon={isOverdue ? <ExclamationCircleFilled /> : undefined}
              message={isOverdue ? "Payment Overdue" : "Next Payment Due"}
              description={`${formatMoney(nextInstallment.amount - nextInstallment.paidAmount)} due on ${formatDate(nextInstallment.dueDate)}`}
            />
          ) : (
            <Alert
              style={{ marginBottom: 16 }}
              type="success"
              showIcon
              message="All installments paid"
              description="You have completed all scheduled payments for this plot."
            />
          )}

          <Card title="Installment Schedule" style={{ marginBottom: 16 }}>
            <List
              dataSource={sortedInstallments}
              renderItem={(installment) => (
                <List.Item>
                  <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>Installment #{installment.seqNo}</Typography.Text>
                      <Typography.Text type="secondary">Due {formatDate(installment.dueDate)}</Typography.Text>
                    </Space>
                    <Space direction="vertical" size={0} style={{ textAlign: "right" }}>
                      <Typography.Text strong>{formatMoney(installment.amount)}</Typography.Text>
                      {installment.paidAmount > 0 && installment.status !== "Paid" ? (
                        <Typography.Text type="secondary">Paid so far: {formatMoney(installment.paidAmount)}</Typography.Text>
                      ) : null}
                    </Space>
                    <Tag color={INSTALLMENT_STATUS_COLOR[installment.status] ?? "default"}>
                      {INSTALLMENT_STATUS_LABEL[installment.status] ?? installment.status}
                    </Tag>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Payment History" style={{ marginBottom: 16 }}>
            {payments.length === 0 ? (
              <Empty description="No payments recorded yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={payments}
                renderItem={(payment) => (
                  <List.Item>
                    <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
                      <Space direction="vertical" size={0}>
                        <Typography.Text strong>{formatMoney(payment.amount)}</Typography.Text>
                        <Typography.Text type="secondary">
                          {formatDate(payment.date)} &middot; {payment.mode}
                          {payment.receiptNumber ? ` · Receipt ${payment.receiptNumber}` : ""}
                        </Typography.Text>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </>
      ) : (
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="No installment plan on this plot yet"
        />
      )}

      <Card title="Documents">
        {documents.length === 0 ? (
          <Empty description="No documents have been generated for this plot yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            dataSource={documents}
            renderItem={(document) => (
              <List.Item
                actions={[
                  <Button
                    key="download"
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={downloadMutation.isPending}
                    onClick={() => downloadMutation.mutate(document.id)}
                  >
                    Download
                  </Button>,
                ]}
              >
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{document.documentType}</Typography.Text>
                  <Typography.Text type="secondary">Generated {formatDate(document.generatedAt)}</Typography.Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

import { Button, Card, Col, Descriptions, Empty, Row, Space, Statistic, Table, Tag, Timeline, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { getPlot } from "../../api/plots";
import { listClients } from "../../api/clients";
import { listAgents } from "../../api/agents";
import { listBlocks } from "../../api/blocks";
import { listSocieties } from "../../api/societies";
import type { ResaleAgentCommission } from "../../types/plot";

export default function ResalePlotDetailPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const navigate = useNavigate();

  const { data: plot, isLoading } = useQuery({
    queryKey: ["plots", plotId],
    queryFn: () => getPlot(plotId!),
    enabled: Boolean(plotId),
  });

  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const { data: agents } = useQuery({ queryKey: ["agents"], queryFn: listAgents });
  const { data: blocks } = useQuery({ queryKey: ["blocks"], queryFn: listBlocks });
  const { data: societies } = useQuery({ queryKey: ["societies"], queryFn: listSocieties });

  const clientNameById = new Map((clients ?? []).map((client) => [client.id, client.fullName]));
  const agentNameById = new Map((agents ?? []).map((agent) => [agent.id, agent.fullName]));
  const blockNameById = new Map((blocks ?? []).map((block) => [block.id, block.name]));
  const societyNameById = new Map((societies ?? []).map((society) => [society.id, society.name]));

  if (!plot && !isLoading) {
    return <Empty description="Resale plot not found" />;
  }

  const commission = plot?.resaleCommission;
  const profit = plot?.resaleProfit;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/resale-plots")} style={{ marginBottom: 16 }}>
        Back to Resale Plots
      </Button>

      <Typography.Title level={4} style={{ marginBottom: 4 }}>
        {plot ? `Plot ${plot.plotNumber}` : "Loading..."}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {plot ? `${societyNameById.get(plot.societyId) ?? "—"} · ${blockNameById.get(plot.blockId) ?? "—"}` : ""}
      </Typography.Paragraph>

      {plot ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Owner's Asking Price" value={plot.ownerAskingPrice ?? 0} precision={0} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Listing Price" value={plot.listingPrice ?? 0} precision={0} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Sold Price" value={plot.soldPrice ?? 0} precision={0} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Profit"
                  value={profit ?? 0}
                  precision={0}
                  valueStyle={{ color: (profit ?? 0) >= 0 ? "#3f8600" : "#cf1322" }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Listing Details" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Size">
                {plot.size} {plot.sizeUnit}
              </Descriptions.Item>
              <Descriptions.Item label="Category">{plot.category}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={plot.soldPrice !== null ? "purple" : "gold"}>
                  {plot.soldPrice !== null ? "Sold" : "Listed"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sold Date">
                {plot.soldDate ? dayjs(plot.soldDate).format("DD MMM YYYY") : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Buyer">
                {plot.buyerClientId ? clientNameById.get(plot.buyerClientId) ?? plot.buyerClientId : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Agent Visibility">
                {plot.openForAgents ? (
                  <Tag color="cyan">Open to all agents</Tag>
                ) : plot.assignedAgentIds.length > 0 ? (
                  <Tag color="geekblue">{plot.assignedAgentIds.length} assigned agent(s)</Tag>
                ) : (
                  <Tag>Not visible to agents</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Commission Breakdown" style={{ marginBottom: 16 }}>
            {commission ? (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col xs={12} md={6}>
                    <Statistic
                      title="From Buyer"
                      value={commission.buyerCommissionAmount}
                      precision={0}
                      suffix={
                        commission.buyerCommissionType === "Percentage" ? `(${commission.buyerCommissionValue}%)` : undefined
                      }
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic
                      title="From Owner"
                      value={commission.ownerCommissionAmount}
                      precision={0}
                      suffix={
                        commission.ownerCommissionType === "Percentage" ? `(${commission.ownerCommissionValue}%)` : undefined
                      }
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic title="Total Collected" value={commission.totalCommissionAmount} precision={0} />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic title="Admin Keeps" value={commission.adminNetCommissionAmount} precision={0} />
                  </Col>
                </Row>

                {commission.agentCommissions.length > 0 ? (
                  <Table<ResaleAgentCommission>
                    size="small"
                    rowKey="agentId"
                    pagination={false}
                    dataSource={commission.agentCommissions}
                    columns={[
                      {
                        title: "Agent",
                        dataIndex: "agentId",
                        key: "agentId",
                        render: (agentId: string) => agentNameById.get(agentId) ?? agentId,
                      },
                      {
                        title: "Rate",
                        key: "rate",
                        render: (_, record) =>
                          record.type === "Percentage" ? `${record.value}%` : `PKR ${record.value.toLocaleString()}`,
                      },
                      {
                        title: "Amount",
                        dataIndex: "amount",
                        key: "amount",
                        render: (value: number) => `PKR ${value.toLocaleString()}`,
                      },
                    ]}
                  />
                ) : (
                  <Typography.Text type="secondary">No agent was involved in this sale.</Typography.Text>
                )}
              </>
            ) : (
              <Empty description="No commission set for this plot" />
            )}
          </Card>

          <Card title="History">
            {plot.historyLog.length > 0 ? (
              <Timeline
                items={plot.historyLog.map((entry) => ({
                  children: (
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{entry.event}</Typography.Text>
                      <Typography.Text type="secondary">{entry.details}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(entry.at).format("DD MMM YYYY, HH:mm")}
                      </Typography.Text>
                    </Space>
                  ),
                }))}
              />
            ) : (
              <Empty description="No history yet" />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

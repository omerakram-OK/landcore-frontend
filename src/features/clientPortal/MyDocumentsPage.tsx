import { Button, Table, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { downloadMyDocument, getMyDocuments } from "../../api/clientPortal";
import type { DocumentResponse } from "../../types/document";
import { getApiErrorMessage } from "../../utils/errors";

export default function MyDocumentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["client-portal", "documents"], queryFn: getMyDocuments });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => downloadMyDocument(id),
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to download document.")),
  });

  const columns: TableColumnsType<DocumentResponse> = [
    { title: "Document Type", dataIndex: "documentType", key: "documentType" },
    {
      title: "Generated At",
      dataIndex: "generatedAt",
      key: "generatedAt",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          size="small"
          icon={<DownloadOutlined />}
          loading={downloadMutation.isPending}
          onClick={() => downloadMutation.mutate(record.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>
        My Documents
      </Typography.Title>
      <Table<DocumentResponse>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        columns={columns}
        locale={{ emptyText: "No documents have been generated for your plots yet." }}
      />
    </div>
  );
}

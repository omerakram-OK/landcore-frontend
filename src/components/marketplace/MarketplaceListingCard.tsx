import type { ReactNode } from "react";
import { Button, Card, Space, Typography } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import type { MarketplaceListingResponse } from "../../types/marketplace";

const { Text } = Typography;

interface MarketplaceListingCardProps {
  listing: MarketplaceListingResponse;
  canManagePhotos: boolean;
  onManagePhotos: () => void;
  statusTag?: ReactNode;
  extra?: ReactNode;
}

export default function MarketplaceListingCard({
  listing,
  canManagePhotos,
  onManagePhotos,
  statusTag,
  extra,
}: MarketplaceListingCardProps) {
  const coverPhoto = listing.photos[0];

  return (
    <Card
      hoverable
      style={{ width: "100%", height: "100%" }}
      styles={{ body: { padding: 14 } }}
      cover={
        coverPhoto ? (
          <img
            alt={listing.plotNumber}
            src={`data:${coverPhoto.contentType};base64,${coverPhoto.base64}`}
            style={{ height: 170, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              height: 170,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #0B1F3A, #14B8A6)",
            }}
          >
            <Typography.Title level={2} style={{ color: "#fff", margin: 0, letterSpacing: 1 }}>
              {listing.plotNumber}
            </Typography.Title>
          </div>
        )
      }
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Text strong>Plot {listing.plotNumber}</Text>
          {statusTag}
        </Space>
        <Text type="secondary">
          {listing.plotType} • {listing.size} {listing.sizeUnit}
        </Text>
        <Text strong style={{ fontSize: 16 }}>
          {listing.price.toLocaleString()}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          By {listing.publishedByName} ({listing.publishedByRole})
        </Text>
        {listing.notes ? (
          <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
            {listing.notes}
          </Text>
        ) : null}
      </Space>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        {canManagePhotos ? (
          <Button size="small" icon={<PictureOutlined />} onClick={onManagePhotos}>
            Photos ({listing.photos.length}/10)
          </Button>
        ) : (
          <span />
        )}
        {extra}
      </div>
    </Card>
  );
}

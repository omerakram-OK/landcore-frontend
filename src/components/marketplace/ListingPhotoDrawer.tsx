import { Button, Drawer, Empty, Popconfirm, Space, Upload, message } from "antd";
import type { UploadProps } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import type { MarketplaceListingResponse } from "../../types/marketplace";

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 1 * 1024 * 1024;

interface ListingPhotoDrawerProps {
  listing: MarketplaceListingResponse | null;
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onRemove: (photoId: string) => void;
  uploading: boolean;
  removingPhotoId: string | null;
}

export default function ListingPhotoDrawer({
  listing,
  open,
  onClose,
  onUpload,
  onRemove,
  uploading,
  removingPhotoId,
}: ListingPhotoDrawerProps) {
  const photoCount = listing?.photos.length ?? 0;
  const atLimit = photoCount >= MAX_PHOTOS;

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    if (atLimit) {
      message.error(`A listing can have at most ${MAX_PHOTOS} photos.`);
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      message.error("Each photo must be 1 MB or smaller.");
      return Upload.LIST_IGNORE;
    }

    onUpload(file);
    return false;
  };

  return (
    <Drawer
      title={listing ? `Photos — Plot ${listing.plotNumber}` : "Photos"}
      open={open}
      onClose={onClose}
      width={420}
      destroyOnHidden
    >
      {listing ? (
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Upload
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept="image/png,image/jpeg,image/webp"
            disabled={atLimit || uploading}
          >
            <Button icon={<UploadOutlined />} loading={uploading} disabled={atLimit}>
              {atLimit ? "Limit reached (10/10)" : `Upload Photo (${photoCount}/${MAX_PHOTOS})`}
            </Button>
          </Upload>

          {listing.photos.length === 0 ? (
            <Empty description="No photos yet — the plot number is shown as the default picture." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
              {listing.photos.map((photo) => (
                <div key={photo.id} style={{ position: "relative" }}>
                  <img
                    src={`data:${photo.contentType};base64,${photo.base64}`}
                    alt="Listing"
                    style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
                  />
                  <Popconfirm title="Remove this photo?" onConfirm={() => onRemove(photo.id)}>
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removingPhotoId === photo.id}
                      style={{ position: "absolute", top: 4, right: 4 }}
                    />
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        </Space>
      ) : null}
    </Drawer>
  );
}

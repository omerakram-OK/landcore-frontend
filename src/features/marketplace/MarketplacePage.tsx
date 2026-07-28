import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Col, Drawer, Empty, Input, Row, Space, Table, Tabs, Tag, Typography, message } from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  listMarketplaceConversations,
  listMarketplaceListings,
  removeMarketplaceListingPhoto,
  sendMarketplaceMessage,
  unpublishMarketplaceListing,
  uploadMarketplaceListingPhoto,
} from "../../api/marketplace";
import { getApiErrorMessage } from "../../utils/errors";
import { HubConnectionState, useMarketplaceChatHub } from "../../hooks/useMarketplaceChatHub";
import MarketplaceListingCard from "../../components/marketplace/MarketplaceListingCard";
import ListingPhotoDrawer from "../../components/marketplace/ListingPhotoDrawer";
import type { MarketplaceConversationResponse, MarketplaceMessage } from "../../types/marketplace";

const LISTINGS_QUERY_KEY = ["marketplace", "listings"] as const;
const CONVERSATIONS_QUERY_KEY = ["marketplace", "conversations"] as const;

export default function MarketplacePage() {
  const queryClient = useQueryClient();

  const [activeConversation, setActiveConversation] = useState<MarketplaceConversationResponse | null>(null);
  const [replyText, setReplyText] = useState("");
  const { connection, setActiveConversationId, clearUnread } = useMarketplaceChatHub();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeConversation?.id, activeConversation?.messages.length]);

  useEffect(() => {
    if (!connection) {
      return undefined;
    }

    const handleReceiveMessage = (conversationId: string, payload: MarketplaceMessage) => {
      setActiveConversation((current) =>
        current && current.id === conversationId ? { ...current, messages: [...current.messages, payload] } : current,
      );
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    return () => connection.off("ReceiveMessage", handleReceiveMessage);
  }, [connection, queryClient]);

  useEffect(() => {
    if (!connection || !activeConversation) {
      return undefined;
    }

    const conversationId = activeConversation.id;
    setActiveConversationId(conversationId);
    clearUnread(conversationId);

    if (connection.state === HubConnectionState.Connected) {
      void connection.invoke("JoinConversation", conversationId);
    }

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        void connection.invoke("LeaveConversation", conversationId);
      }
      setActiveConversationId(null);
    };
  }, [connection, activeConversation?.id, setActiveConversationId, clearUnread]);

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: LISTINGS_QUERY_KEY,
    queryFn: listMarketplaceListings,
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: listMarketplaceConversations,
  });

  const [photoDrawerListingId, setPhotoDrawerListingId] = useState<string | null>(null);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const photoDrawerListing = listings?.find((listing) => listing.id === photoDrawerListingId) ?? null;

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => unpublishMarketplaceListing(id),
    onSuccess: () => {
      message.success("Listing unpublished.");
      void queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to unpublish listing.")),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ listingId, file }: { listingId: string; file: File }) => uploadMarketplaceListingPhoto(listingId, file),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY }),
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to upload photo.")),
  });

  const removePhotoMutation = useMutation({
    mutationFn: ({ listingId, photoId }: { listingId: string; photoId: string }) => {
      setRemovingPhotoId(photoId);
      return removeMarketplaceListingPhoto(listingId, photoId);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY }),
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to remove photo.")),
    onSettled: () => setRemovingPhotoId(null),
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      sendMarketplaceMessage(conversationId, { text }),
    onSuccess: (updated) => {
      setActiveConversation(updated);
      setReplyText("");
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
    onError: (error) => message.error(getApiErrorMessage(error, "Failed to send message.")),
  });

  const conversationColumns: TableColumnsType<MarketplaceConversationResponse> = useMemo(
    () => [
      { title: "Plot", dataIndex: "plotNumber", key: "plotNumber" },
      { title: "Initiator", dataIndex: "initiatorName", key: "initiatorName" },
      { title: "Role", dataIndex: "initiatorRole", key: "initiatorRole" },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: string) => <Tag color={status === "Open" ? "blue" : "default"}>{status}</Tag>,
      },
      {
        title: "Last Update",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (updatedAt: string) => dayjs(updatedAt).format("DD-MMM-YYYY HH:mm"),
      },
      {
        title: "Messages",
        key: "messages",
        render: (_, record) => record.messages.length,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Button size="small" onClick={() => setActiveConversation(record)}>
            Open Chat
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <Typography.Title level={4} style={{ margin: 0, marginBottom: 16 }}>
        Marketplace
      </Typography.Title>

      <Tabs
        defaultActiveKey="listings"
        items={[
          {
            key: "listings",
            label: "Listings",
            children: listingsLoading ? (
              <Typography.Text type="secondary">Loading listings...</Typography.Text>
            ) : (listings ?? []).length === 0 ? (
              <Empty description="No marketplace listings yet." />
            ) : (
              <Row gutter={[16, 16]}>
                {(listings ?? []).map((listing) => (
                  <Col key={listing.id} xs={24} sm={12} md={8} lg={6}>
                    <MarketplaceListingCard
                      listing={listing}
                      canManagePhotos
                      onManagePhotos={() => setPhotoDrawerListingId(listing.id)}
                      statusTag={<Tag color={listing.isActive ? "green" : "default"}>{listing.isActive ? "Active" : "Unpublished"}</Tag>}
                      extra={
                        listing.isActive ? (
                          <Button size="small" danger onClick={() => unpublishMutation.mutate(listing.id)} loading={unpublishMutation.isPending}>
                            Unpublish
                          </Button>
                        ) : null
                      }
                    />
                  </Col>
                ))}
              </Row>
            ),
          },
          {
            key: "conversations",
            label: "Conversations",
            children: (
              <Table<MarketplaceConversationResponse>
                rowKey="id"
                loading={conversationsLoading}
                dataSource={conversations ?? []}
                columns={conversationColumns}
              />
            ),
          },
        ]}
      />

      <Drawer
        title={activeConversation ? `Conversation — Plot ${activeConversation.plotNumber}` : "Conversation"}
        open={activeConversation !== null}
        onClose={() => setActiveConversation(null)}
        destroyOnHidden
        width={480}
        styles={{ body: { display: "flex", flexDirection: "column", padding: 0 } }}
        footer={
          activeConversation ? (
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="Type a reply..."
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onPressEnter={() => {
                  if (replyText.trim() && activeConversation) {
                    sendMessageMutation.mutate({ conversationId: activeConversation.id, text: replyText.trim() });
                  }
                }}
              />
              <Button
                type="primary"
                loading={sendMessageMutation.isPending}
                onClick={() => {
                  if (replyText.trim() && activeConversation) {
                    sendMessageMutation.mutate({ conversationId: activeConversation.id, text: replyText.trim() });
                  }
                }}
              >
                Send
              </Button>
            </Space.Compact>
          ) : null
        }
      >
        {activeConversation ? (
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
            {activeConversation.messages.length === 0 ? (
              <Empty description="No messages yet" />
            ) : (
              activeConversation.messages.map((entry, index) => {
                const isStaff = entry.senderRole === "Admin" || entry.senderRole === "Employee";
                return (
                  <div
                    key={index}
                    style={{
                      alignSelf: isStaff ? "flex-end" : "flex-start",
                      background: isStaff ? "#14B8A6" : "#f0f2f5",
                      color: isStaff ? "#fff" : "#000",
                      borderRadius: 8,
                      padding: "8px 12px",
                      maxWidth: "80%",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {entry.senderName} ({entry.senderRole})
                    </div>
                    <div>{entry.text}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{dayjs(entry.sentAt).format("DD-MMM HH:mm")}</div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : null}
      </Drawer>

      <ListingPhotoDrawer
        listing={photoDrawerListing}
        open={photoDrawerListingId !== null}
        onClose={() => setPhotoDrawerListingId(null)}
        onUpload={(file) => {
          if (photoDrawerListingId) {
            uploadPhotoMutation.mutate({ listingId: photoDrawerListingId, file });
          }
        }}
        onRemove={(photoId) => {
          if (photoDrawerListingId) {
            removePhotoMutation.mutate({ listingId: photoDrawerListingId, photoId });
          }
        }}
        uploading={uploadPhotoMutation.isPending}
        removingPhotoId={removingPhotoId}
      />
    </div>
  );
}

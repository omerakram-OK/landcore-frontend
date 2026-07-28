import { useMemo, useState } from "react";
import { Avatar, Badge, Dropdown, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import {
  ContainerOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  ShopOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useMarketplaceChatHub } from "../hooks/useMarketplaceChatHub";
import { getMyProfile } from "../api/clientPortal";

const { Header, Sider, Content } = Layout;

function buildNavItems(marketplaceUnread: number): MenuProps["items"] {
  return [
    { key: "/client-portal", icon: <ContainerOutlined />, label: <Link to="/client-portal">My Plots</Link> },
    {
      key: "/client-portal/resale-purchases",
      icon: <ShoppingOutlined />,
      label: <Link to="/client-portal/resale-purchases">My Resale Purchases</Link>,
    },
    {
      key: "/client-portal/documents",
      icon: <FileDoneOutlined />,
      label: <Link to="/client-portal/documents">My Documents</Link>,
    },
    {
      key: "/client-portal/marketplace",
      icon: <ShopOutlined />,
      label: (
        <Link
          to="/client-portal/marketplace"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
        >
          <span>Marketplace</span>
          {marketplaceUnread > 0 ? <Badge count={marketplaceUnread} size="small" /> : null}
        </Link>
      ),
    },
  ];
}

export default function ClientPortalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, logout } = useAuth();
  const { unreadTotal } = useMarketplaceChatHub();
  const { data: profile } = useQuery({ queryKey: ["client-portal", "profile"], queryFn: getMyProfile });

  const navItems = useMemo(() => buildNavItems(unreadTotal), [unreadTotal]);

  const selectedKey = useMemo(() => {
    const match = navItems?.find(
      (item) =>
        item &&
        "key" in item &&
        typeof item.key === "string" &&
        (item.key === location.pathname || (item.key !== "/client-portal" && location.pathname.startsWith(item.key))),
    );
    return match && "key" in match ? String(match.key) : "/client-portal";
  }, [location.pathname, navItems]);

  const userMenu: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "Profile" },
    { key: "logout", icon: <LogoutOutlined />, label: "Log out" },
  ];

  const onUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "profile") {
      navigate("/client-portal/profile");
      return;
    }

    if (key === "logout") {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={228}>
        <div
          style={{
            height: 56,
            margin: "16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <Typography.Text
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: collapsed ? 16 : 20,
              letterSpacing: 0.3,
            }}
          >
            {collapsed ? "LC" : "Landcore Portal"}
          </Typography.Text>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={navItems} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 20px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            boxShadow: "0 1px 2px rgba(11, 31, 58, 0.06)",
          }}
        >
          <Dropdown menu={{ items: userMenu, onClick: onUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              {profile?.photoDataUrl ? (
                <Avatar src={profile.photoDataUrl} />
              ) : (
                <Avatar icon={<UserOutlined />} style={{ background: "#14B8A6" }} />
              )}
              <Typography.Text>{claims?.name ?? claims?.email}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

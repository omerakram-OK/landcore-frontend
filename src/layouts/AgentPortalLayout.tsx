import { useMemo, useState } from "react";
import { Avatar, Badge, Dropdown, Layout, Menu, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { DollarOutlined, LogoutOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useMarketplaceChatHub } from "../hooks/useMarketplaceChatHub";
import { getMyAgentProfile } from "../api/agentPortal";

const { Header, Sider, Content } = Layout;

function buildNavItems(marketplaceUnread: number): MenuProps["items"] {
  return [
    { key: "/agent-portal", icon: <ShopOutlined />, label: <Link to="/agent-portal">Available Plots</Link> },
    {
      key: "/agent-portal/commissions",
      icon: <DollarOutlined />,
      label: <Link to="/agent-portal/commissions">My Commissions</Link>,
    },
    {
      key: "/agent-portal/marketplace",
      icon: <ShopOutlined />,
      label: (
        <Link
          to="/agent-portal/marketplace"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
        >
          <span>Marketplace</span>
          {marketplaceUnread > 0 ? <Badge count={marketplaceUnread} size="small" /> : null}
        </Link>
      ),
    },
  ];
}

export default function AgentPortalLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { claims, logout } = useAuth();
  const { unreadTotal } = useMarketplaceChatHub();
  const { data: profile } = useQuery({ queryKey: ["agent-portal", "profile"], queryFn: getMyAgentProfile });

  const navItems = useMemo(() => buildNavItems(unreadTotal), [unreadTotal]);

  const selectedKey = useMemo(() => {
    const match = navItems?.find(
      (item) =>
        item &&
        "key" in item &&
        typeof item.key === "string" &&
        (item.key === location.pathname || (item.key !== "/agent-portal" && location.pathname.startsWith(item.key))),
    );
    return match && "key" in match ? String(match.key) : "/agent-portal";
  }, [location.pathname, navItems]);

  const userMenu: MenuProps["items"] = [
    { key: "profile", icon: <UserOutlined />, label: "Profile" },
    { key: "logout", icon: <LogoutOutlined />, label: "Log out" },
  ];

  const onUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "profile") {
      navigate("/agent-portal/profile");
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
            {collapsed ? "LC" : "Agent Portal"}
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
              {profile?.photoUrl ? (
                <Avatar src={profile.photoUrl} />
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

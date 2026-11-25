import { useEffect, useState } from "react";
import { Card, Input, Button, Tag, Avatar, message, Modal, List, Spin, Empty } from "antd";
import {
  BankOutlined,
  SearchOutlined,
  LinkOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WalletOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../layouts/DashboardLayout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { directoryApi } from "../../services/api/index.js";
import "./DirectoryPage.css";

export const DirectoryPage = () => {
  const { user } = useAuth();
  const isVerifier = user?.role === "verifier";

  const [issuers, setIssuers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectingId, setConnectingId] = useState(null);

  // Schema list modal
  const [selectedIssuer, setSelectedIssuer] = useState(null);
  const [schemasModalVisible, setSchemasModalVisible] = useState(false);
  const [issuerSchemas, setIssuerSchemas] = useState([]);
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  const fetchIssuers = async () => {
    setLoading(true);
    try {
      const res = await directoryApi.getIssuers();
      const list = res?.data?.results || res?.data?.issuers || res?.data || [];
      setIssuers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch issuers:", err);
      // Fallback synthetic catalog for discovery demonstration
      setIssuers([
        {
          id: "issuer-university-1",
          name: "National Technical University",
          organization: "Ministry of Education",
          did: "did:indy:sovrin:LVU4i9VRJQhfQqtTvTcpZh",
          schemas: ["student_id_card:1.0", "engineering_degree:1.0"],
          isAccredited: true,
        },
        {
          id: "issuer-gov-transport",
          name: "Regional Transport Authority",
          organization: "Department of Motor Vehicles",
          did: "did:indy:sovrin:Tr4n5p0rtD1d987654321",
          schemas: ["driving_license:1.0", "vehicle_registration:1.0"],
          isAccredited: true,
        },
        {
          id: "issuer-health-corp",
          name: "Universal Health Trust",
          organization: "National Health Mission",
          did: "did:indy:sovrin:H3althTrU5tD1d12345678",
          schemas: ["health_insurance_card:1.0", "vaccination_certificate:1.0"],
          isAccredited: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuers();
  }, []);

  const handleConnect = async (issuer) => {
    setConnectingId(issuer.id);
    try {
      await directoryApi.connectToIssuer(issuer.id, {
        alias: `Connection to ${issuer.name || issuer.organization || "Issuer"}`,
      });
      message.success(`Connection invitation initiated with ${issuer.name || "Issuer"}`);
    } catch (err) {
      message.error(err?.message || "Failed to initiate connection to issuer");
    } finally {
      setConnectingId(null);
    }
  };

  const handleViewSchemas = async (issuer) => {
    setSelectedIssuer(issuer);
    setSchemasModalVisible(true);
    setLoadingSchemas(true);
    try {
      const res = await directoryApi.getIssuerSchemas(issuer.id);
      const list = res?.data?.results || res?.data?.schemas || res?.data || [];
      setIssuerSchemas(Array.isArray(list) ? list : issuer.schemas || []);
    } catch (err) {
      console.warn("Could not fetch specific issuer schemas, showing issuer default:", err);
      setIssuerSchemas(issuer.schemas || []);
    } finally {
      setLoadingSchemas(false);
    }
  };

  const filteredIssuers = issuers.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.organization || "").toLowerCase().includes(q) ||
      (item.did || "").toLowerCase().includes(q) ||
      (item.schemas && item.schemas.some((s) => s.toLowerCase().includes(q)))
    );
  });

  return (
    <DashboardLayout>
      <div className="directory-page-container">
        <div className="directory-header">
          <div className="directory-header-meta">
            <div className="directory-header-title-row">
              <h2>Accredited Issuer Directory</h2>
              <Tag color={isVerifier ? "cyan" : "blue"} className="directory-role-badge">
                {isVerifier ? "Verifier Authority Portal" : "Digital Wallet Holder Portal"}
              </Tag>
            </div>
            <p className="directory-header-description">
              {isVerifier
                ? "Discover accredited authorities, inspect verifiable credential schemas, and establish trust connections for claim verification."
                : "Browse accredited credential issuers across government, education, and enterprise ecosystems. Connect your digital wallet directly to apply for and receive verified credentials."}
            </p>
          </div>

          <div className="directory-controls">
            <Input
              className="directory-search-bar"
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search by issuer name, schema, or DID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <Button
              icon={<SyncOutlined />}
              onClick={fetchIssuers}
              className="directory-refresh-btn"
            >
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="directory-loading-wrapper">
            <Spin size="large" />
          </div>
        ) : filteredIssuers.length === 0 ? (
          <div className="directory-empty-wrapper">
            <Empty
              description={
                searchTerm
                  ? `No accredited issuers found matching "${searchTerm}"`
                  : "No accredited issuers registered yet in the directory."
              }
            />
          </div>
        ) : (
          <div className="directory-cards-grid">
            {filteredIssuers.map((issuer) => (
              <Card
                key={issuer.id}
                className="directory-issuer-card"
                actions={[
                  <Button
                    key="schemas"
                    type="link"
                    icon={<FileTextOutlined />}
                    onClick={() => handleViewSchemas(issuer)}
                    className="directory-action-btn"
                  >
                    {isVerifier
                      ? `Inspect Schemas (${(issuer.schemas || []).length})`
                      : `Apply / View Schemas (${(issuer.schemas || []).length})`}
                  </Button>,
                  <Button
                    key="connect"
                    type="primary"
                    icon={isVerifier ? <SafetyCertificateOutlined /> : <WalletOutlined />}
                    loading={connectingId === issuer.id}
                    onClick={() => handleConnect(issuer)}
                    className="directory-action-btn directory-action-primary"
                  >
                    {isVerifier ? "Establish Trust Connection" : "Connect Wallet"}
                  </Button>,
                ]}
              >
                <div className="directory-card-header">
                  <Avatar
                    size={46}
                    icon={<BankOutlined />}
                    className="directory-card-avatar"
                  />
                  <div className="directory-card-info">
                    <div className="directory-card-title">
                      {issuer.name || issuer.organization || "Accredited Issuer"}
                    </div>
                    <div className="directory-card-badges">
                      {issuer.isAccredited && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Accredited
                        </Tag>
                      )}
                      {issuer.organization && issuer.name && (
                        <span className="directory-card-org">{issuer.organization}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="directory-card-did" title={issuer.did || ""}>
                  <span className="did-label">DID:</span> {issuer.did || "did:indy:sovrin:..."}
                </div>

                <div className="directory-schemas-list">
                  <div className="directory-schemas-heading">
                    Offered Credential Schemas:
                  </div>
                  <div className="directory-schemas-tags">
                    {(issuer.schemas || []).map((schema, idx) => (
                      <Tag key={idx} color="blue" className="directory-schema-item">
                        {typeof schema === "string" ? schema.split(":")[0] : schema.name || "Schema"}
                      </Tag>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Schemas Detail Modal */}
        <Modal
          title={`Credential Schemas: ${selectedIssuer?.name || "Issuer"}`}
          open={schemasModalVisible}
          onCancel={() => setSchemasModalVisible(false)}
          width={640}
          style={{ maxWidth: "95vw" }}
          footer={[
            <Button key="close" onClick={() => setSchemasModalVisible(false)}>
              Close
            </Button>,
            <Button
              key="connectModal"
              type="primary"
              icon={isVerifier ? <SafetyCertificateOutlined /> : <LinkOutlined />}
              onClick={() => {
                setSchemasModalVisible(false);
                if (selectedIssuer) handleConnect(selectedIssuer);
              }}
            >
              {isVerifier ? "Establish Trust Connection" : "Connect Wallet"}
            </Button>,
          ]}
        >
          {loadingSchemas ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <Spin />
            </div>
          ) : (
            <List
              dataSource={issuerSchemas}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 20, color: "#2563eb" }} />}
                    title={typeof item === "string" ? item : item.name || item.schema_id}
                    description={
                      typeof item === "object" && item.attributes
                        ? `Disclosable Attributes: ${item.attributes.join(", ")}`
                        : "Ready for digital issuance & zero-knowledge proofs via Aries RFC 0453"
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default DirectoryPage;

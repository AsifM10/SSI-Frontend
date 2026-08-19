import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { message } from "antd";
import { CloseOutlined, DesktopOutlined } from "@ant-design/icons";
import { getMachineById } from "../../../services/machineService";

import "./MachineDetailsModal.css";

const Field = ({ label, value, full }) => (
  <div className={`machine-detail-field ${full ? "machine-detail-full" : ""}`}>
    <span className="machine-detail-label">{label}</span>
    <span className="machine-detail-value">{value || "—"}</span>
  </div>
);

const MachineDetailsModal = ({ open, machineId, onClose }) => {
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !machineId) return;

    let cancelled = false;
    setLoading(true);

    getMachineById(machineId)
      .then((data) => {
        if (!cancelled) setMachine(data);
      })
      .catch((err) => {
        console.error("Failed to load machine details:", err);
        if (!cancelled) message.error("Failed to load machine details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, machineId]);

  if (!open) return null;

  const statusLabel = machine?.status || "—";
  const statusClass =
    statusLabel === "HEALTHY"
      ? "machine-detail-status healthy"
      : "machine-detail-status";

  return createPortal(
    <div className="machine-detail-overlay">
      <div className="machine-detail-modal">
        {/* HEADER */}

        <div className="machine-detail-header">
          <div>
            <h2>Machine Details</h2>
            <p>
              {machine
                ? machine.hostname || "Machine"
                : "Loading machine information"}
            </p>
          </div>

          <button className="machine-detail-close" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>

        {/* BODY */}

        <div className="machine-detail-body">
          {loading && !machine ? (
            <div className="machine-detail-loading">Loading machine details...</div>
          ) : machine ? (
            <>
              <div className="machine-detail-grid">
                <Field label="Hostname" value={machine.hostname} />
                <Field label="IP Address" value={machine.ipAddress} />
                <Field label="CPU Cores" value={machine.cpuCores} />
                <Field label="Memory (GB)" value={machine.memoryGb} />
                <Field label="Storage (GB)" value={machine.storageGb} />
                <Field label="OS Type" value={machine.osType} />
                <Field
                  label="GPU"
                  value={
                    Number(machine.gpuCount) > 0
                      ? `${machine.gpuModel || "N/A"} × ${machine.gpuCount}`
                      : "Not Available"
                  }
                />
                <Field label="SSH Port" value={machine.sshport} />
                <Field label="Username" value={machine.username} />
                <Field
                  label="Project"
                  value={machine.projectName || machine.projectId}
                />
                <Field label="Department" value={machine.deptName} />
                <Field
                  label="Created At"
                  value={
                    machine.createdAt
                      ? new Date(machine.createdAt).toLocaleString()
                      : null
                  }
                />
                <Field
                  label="Updated At"
                  value={
                    machine.updatedAt
                      ? new Date(machine.updatedAt).toLocaleString()
                      : null
                  }
                />
                <Field
                  label="Status"
                  value={
                    <span className={statusClass}>{statusLabel}</span>
                  }
                />
              </div>

              <div className="machine-detail-grid machine-detail-grid--tags">
                <Field
                  label="Tags"
                  value={(machine.tags || []).join(", ")}
                  full
                />
              </div>
            </>
          ) : (
            <div className="machine-detail-loading">No machine data found.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MachineDetailsModal;

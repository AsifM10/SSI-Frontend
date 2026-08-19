import { useEffect, useState } from "react";
import { message } from "antd";
import {
  createMachine,
  updateMachine,
} from "../../../services/machineService";

import {
  CloseOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  HddOutlined,
  CloudServerOutlined,
  AppstoreOutlined,
  DownOutlined,
  DeploymentUnitOutlined,
  LockOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ArrowLeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

import "./AddMachineModal.css";

const AddMachineModal = ({
  open,
  onClose,
  projectId,
  onMachineCreated,
  machine,
}) => {
  const [hostname, setHostname] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const [cpuCores, setCpuCores] = useState("");
  const [memoryGb, setMemoryGb] = useState("");
  const [storageGb, setStorageGb] = useState("");

  const [gpuModel, setGpuModel] = useState("");
  const [gpuCount, setGpuCount] = useState("");
  const [gpuAvailable, setGpuAvailable] = useState(false);

  const [osType, setOsType] = useState("");

  const [status, setStatus] = useState("HEALTHY");

  const [tags, setTags] = useState("");
  const [sshport, setSshport] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

useEffect(() => {
  setStep(1);
  setShowPassword(false);

  if (machine) {
    setHostname(machine.hostname || "");
    setIpAddress(machine.ipAddress || "");
    setCpuCores(machine.cpuCores || "");
    setMemoryGb(machine.memoryGb || "");
    setStorageGb(machine.storageGb || "");
    setGpuModel(machine.gpuModel || "");
    setGpuCount(machine.gpuCount || "");
    setGpuAvailable(
      Number(machine.gpuCount) > 0 ||
        (machine.gpuModel &&
          machine.gpuModel.trim() !== "" &&
          machine.gpuModel !== "None" &&
          machine.gpuModel !== "N/A")
    );
    setOsType(machine.osType || "");
    setStatus(machine.status || "HEALTHY");
    setTags((machine.tags || []).join(", "));
    setSshport(machine.sshport || "");
    setUsername(machine.username || "");
    setPassword(machine.password || "");

  } else {
    setHostname("");
    setIpAddress("");
    setCpuCores("");
    setMemoryGb("");
    setStorageGb("");
    setGpuModel("");
    setGpuCount("");
    setGpuAvailable(false);
    setOsType("");
    setStatus("HEALTHY");
    setTags("");
    setSshport("");
    setUsername("");
    setPassword("");

  }
}, [machine]);

  const handleSubmit = async () => {
  try {
    const payload = {
      hostname,
      ipAddress,
      cpuCores: Number(cpuCores),
      memoryGb: Number(memoryGb),
      storageGb: Number(storageGb),
      gpuModel: gpuAvailable ? gpuModel : "",
      gpuCount: gpuAvailable ? Number(gpuCount) : 0,
      osType,
      status,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      projectId: Number(projectId),
      sshport, 
      username,
      password,
    };

    if (machine) {
      await updateMachine(machine.machineId, payload);

      message.success("Machine updated successfully!");
    } else {
      await createMachine(payload);

      message.success("Machine created successfully!");
    }

    if (onMachineCreated) {
      await onMachineCreated();
    }

    onClose();
  } catch (err) {
    console.error(err);
    console.error(err.response?.data);

    const errorMessage =
      err.response?.data?.message ||
      (machine
        ? "Failed to update machine."
        : "Failed to create machine.");

    message.error(errorMessage);
  }
};

  if (!open) return null;

 return (
  <div className="machine-modal-overlay">
    <div className="machine-create-modal">

      {/* HEADER */}

      <div className="machine-create-header">
        <div>
          <h2>{machine ? "Edit Machine" : "Add New Machine"}</h2>
          <p>Provision a machine and assign it to a project</p>
        </div>

        <button
          className="machine-create-close"
          onClick={onClose}
        >
          <CloseOutlined />
        </button>
      </div>

      {/* STEPPER */}

      <div className="machine-stepper">
        <div className={`machine-step ${step === 1 ? "active" : ""} ${step === 2 ? "done" : ""}`}>
          <span className="machine-step-num">{step === 2 ? <CheckCircleOutlined /> : "1"}</span>
          <span className="machine-step-label">System Details</span>
        </div>

        <div className="machine-stepper-line" />

        <div className={`machine-step ${step === 2 ? "active" : ""}`}>
          <span className="machine-step-num">2</span>
          <span className="machine-step-label">Access & Credentials</span>
        </div>
      </div>

      {/* BODY */}

      <div className="machine-create-body">

        {step === 1 ? (
          <>
        {/* HOSTNAME */}

        <div className="machine-create-field">
          <label>Hostname</label>

          <div className="machine-create-input">
            <CloudServerOutlined className="machine-create-icon" />

            <input
              type="text"
              placeholder="e.g. fabric-node-02"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
        </div>

        {/* IP */}

        <div className="machine-create-field">
          <label>IP Address</label>

          <div className="machine-create-input">
            <DeploymentUnitOutlined className="machine-create-icon" />

            <input
              type="text"
              placeholder="e.g. 10.10.10.29"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>
        </div>

        {/* CPU */}

        <div className="machine-create-field machine-create-third">
          <label>CPU Cores</label>

          <div className="machine-create-input">
            <DesktopOutlined className="machine-create-icon" />

            <input
              type="number"
              placeholder="e.g. 16"
              value={cpuCores}
              onChange={(e) => setCpuCores(e.target.value)}
            />
          </div>
        </div>

        {/* MEMORY */}

        <div className="machine-create-field machine-create-third">
          <label>Memory (GB)</label>

          <div className="machine-create-input">
            <DatabaseOutlined className="machine-create-icon" />

            <input
              type="number"
              placeholder="e.g. 64"
              value={memoryGb}
              onChange={(e) => setMemoryGb(e.target.value)}
            />
          </div>
        </div>

        {/* STORAGE */}

        <div className="machine-create-field machine-create-third">
          <label>Storage (GB)</label>

          <div className="machine-create-input">
            <HddOutlined className="machine-create-icon" />

            <input
              type="number"
              placeholder="e.g. 1000"
              value={storageGb}
              onChange={(e) => setStorageGb(e.target.value)}
            />
          </div>
        </div>

        {/* OS */}

        <div className="machine-create-field machine-create-third">
          <label>OS</label>

          <div className="machine-create-input">
            <DesktopOutlined className="machine-create-icon" />

            <input
              type="text"
              placeholder="e.g. Ubuntu"
              value={osType}
              onChange={(e) => setOsType(e.target.value)}
            />
          </div>
        </div>

        {/* GPU AVAILABLE */}

        <div className="machine-create-field machine-create-third">
          <label>GPU Available?</label>

          <div className="machine-create-select">
            <select
              className="machine-create-dropdown"
              value={gpuAvailable ? "yes" : "no"}
              onChange={(e) => setGpuAvailable(e.target.value === "yes")}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <DownOutlined className="machine-create-select-arrow" />
          </div>
        </div>

        {gpuAvailable && (
          <>
            {/* GPU MODEL */}

            <div className="machine-create-field machine-create-third">
              <label>GPU Model</label>

              <div className="machine-create-input">
                <DatabaseOutlined className="machine-create-icon" />

                <input
                  type="text"
                  placeholder="e.g. A100"
                  value={gpuModel}
                  onChange={(e) => setGpuModel(e.target.value)}
                />
              </div>
            </div>

            {/* GPU COUNT */}

            <div className="machine-create-field machine-create-third">
              <label>GPU Count</label>

              <div className="machine-create-input">
                <AppstoreOutlined className="machine-create-icon" />

                <input
                  type="number"
                  placeholder="e.g. 2"
                  value={gpuCount}
                  onChange={(e) => setGpuCount(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* STATUS */}

        <div className="machine-create-field">
          <label>Status</label>

          <div className="machine-create-select">
            <span>{status}</span>
            <DownOutlined />
          </div>
        </div>

        {/* PROJECT */}

        <div className="machine-create-field">
          <label>Project</label>

          <div className="machine-create-select">
            <span>Current Project</span>
            <DownOutlined />
          </div>
        </div>
          </>
        ) : (
          <>
        {/* SSH PORT */}

        <div className="machine-create-field machine-create-third">
          <label>SSH PORT</label>

          <div className="machine-create-input">
            <ApartmentOutlined className="machine-create-icon" />

            <input
              type="text"
              placeholder="e.g. 22"
              value={sshport}
              onChange={(e) => setSshport(e.target.value)}
            />
          </div>
        </div>

        {/* Username */}

        <div className="machine-create-field machine-create-third">
          <label>Username</label>

          <div className="machine-create-input">
            <CloudServerOutlined className="machine-create-icon" />

            <input
              type="text"
              placeholder="e.g. user1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}

        <div className="machine-create-field machine-create-third">
          <label>Password</label>

          <div className="machine-create-input">
            <LockOutlined className="machine-create-icon" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password should not contain # Symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="machine-create-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </span>
          </div>
        </div>

        {/* TAGS */}

        <div className="machine-create-field machine-create-full">
          <label>Tags</label>

          <input
            className="machine-create-tags"
            type="text"
            placeholder="e.g. gpu, production, ml"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
          </>
        )}

      </div>

      {/* FOOTER */}

      <div className="machine-create-footer">
        <button
          className="machine-create-cancel"
          onClick={onClose}
        >
          Cancel
        </button>

        {step === 2 && (
          <button
            className="machine-create-back"
            onClick={() => setStep(1)}
          >
            <ArrowLeftOutlined /> Back
          </button>
        )}

        <button
          className="machine-create-submit"
          onClick={() => (step === 1 ? setStep(2) : handleSubmit())}
        >
          {step === 1 ? (
            <>Continue <RightOutlined /></>
          ) : machine ? (
            "Update Machine"
          ) : (
            "Provision Machine"
          )}
        </button>
      </div>

    </div>
  </div>
);
};

export default AddMachineModal;
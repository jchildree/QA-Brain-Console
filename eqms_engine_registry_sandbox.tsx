import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Clipboard, 
  GraduationCap, 
  Settings, 
  Plus, 
  Check, 
  Clock, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Key, 
  Database, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  XCircle, 
  Info, 
  Download, 
  Trash, 
  Eye, 
  EyeOff, 
  Search,
  Lock,
  BookOpen
} from 'lucide-react';

// --- INITIAL STATE & SCHEMAS-AS-DATA BLUEPRINTS ---
const INITIAL_BLUEPRINTS = [
  {
    id: "metals-deviation-spec",
    name: "ICP-MS Metals Deviation Model",
    module: "cap",
    version: 1,
    active: true,
    description: "Captures instrument calibration drift and limits exceeding standard safety specs for heavy metals.",
    fields: [
      { id: "sampleId", label: "Sample ID / ID Batch", type: "text", required: true, placeholder: "e.g., PB-2026-0715A" },
      { id: "metalType", label: "Target Metal Assay", type: "select", options: ["Lead (Pb)", "Arsenic (As)", "Mercury (Hg)", "Cadmium (Cd)"], required: true },
      { id: "concentrationPPM", label: "Concentration (PPM)", type: "number", required: true, validation: { min: 0, max: 1000 }, placeholder: "0.000" },
      { id: "icpMsSerial", label: "ICP-MS Instrument Serial", type: "text", required: true, placeholder: "Agilent-7900-ICPMS-441" },
      { id: "actionLimit", label: "Regulatory Limit (PPM)", type: "number", required: true, placeholder: "0.015" }
    ]
  },
  {
    id: "water-quality-spec",
    name: "Water Matrix Excursion Model",
    module: "cap",
    version: 1,
    active: true,
    description: "Monitors source and municipal water validation criteria (pH, turbidity, and chemical balance).",
    fields: [
      { id: "sourceId", label: "Water Source Identification", type: "text", required: true, placeholder: "e.g., Aquifer-3B-Inlet" },
      { id: "turbidityNTU", label: "Turbidity (NTU)", type: "number", required: true, placeholder: "0.1" },
      { id: "phLevel", label: "pH Level", type: "number", required: true, validation: { min: 0, max: 14 }, placeholder: "7.0" },
      { id: "coordinates", label: "Sampling GPS Coordinates", type: "text", required: false, placeholder: "39.7392° N, 104.9903° W" }
    ]
  },
  {
    id: "animal-welfare-spec",
    name: "IACUC Animal Cohort Event Model",
    module: "cap",
    version: 1,
    active: true,
    description: "Tracks physiological anomalies, environmental temperature excursions, or safety events under IACUC protocols.",
    fields: [
      { id: "iacucProtocolId", label: "IACUC Protocol ID", type: "text", required: true, placeholder: "e.g., PROTO-2026-ANIM-45" },
      { id: "speciesCohort", label: "Species / Cohort identifier", type: "select", options: ["Mus musculus (Mice)", "Rattus norvegicus (Rats)", "Oryctolagus cuniculus (Rabbits)"], required: true },
      { id: "anomalyType", label: "Observed Anomaly", type: "text", required: true, placeholder: "e.g., Temperature spike in housing unit 4" },
      { id: "vetContacted", label: "Attending Veterinarian Notified", type: "select", options: ["Yes", "No"], required: true }
    ]
  }
];

const INITIAL_DOCUMENTS = [
  {
    id: "DOC-2026-001",
    title: "Standard Operating Procedure for ICP-MS Calibration (SOP-MET-402)",
    version: "v2.1",
    status: "Approved",
    module: "Document Control",
    createdBy: "Dr. Sarah Jenkins (Lead Chemist)",
    effectiveDate: "2026-03-12",
    description: "This document establishes operating and calibration protocols for all Agilent Inductively Coupled Plasma Mass Spectrometers.",
    signatures: [
      { role: "Author", user: "Dr. Sarah Jenkins", timestamp: "2026-03-01 10:14", hash: "SHA256:8f4b...12a4", reason: "Initial Draft Release" },
      { role: "Quality Assurance Approval", user: "Marcus Vance", timestamp: "2026-03-02 14:30", hash: "SHA256:d8a2...ff09", reason: "Reviewed compliance calibration metrics" }
    ]
  },
  {
    id: "DOC-2026-002",
    title: "IACUC Animal Exposure Guidelines & Lead Ingestion Limits",
    version: "v1.0",
    status: "Draft",
    module: "Document Control",
    createdBy: "Dr. Charles Xavier (Head Vet)",
    effectiveDate: "Pending",
    description: "Defines ethical exposure frameworks and reporting rules for heavy metals bio-assays in rodents.",
    signatures: []
  },
  {
    id: "DOC-2026-003",
    title: "Municipal Source Water Testing Protocols for Toxic Metals",
    version: "v3.0",
    status: "Effective",
    module: "Document Control",
    createdBy: "Emily Watson (Env. Quality Director)",
    effectiveDate: "2026-01-05",
    description: "Defines testing cadences for incoming industrial water feeds before chemical processing occurs.",
    signatures: [
      { role: "Author", user: "Emily Watson", timestamp: "2026-01-01 09:00", hash: "SHA256:72ef...11a0", reason: "Regulatory alignment updates" },
      { role: "Lab Manager Authorization", user: "Director Dave", timestamp: "2026-01-02 11:22", hash: "SHA256:ee01...fa43", reason: "Approved for laboratory integration" },
      { role: "Quality Assurance Approval", user: "Marcus Vance", timestamp: "2026-01-04 16:15", hash: "SHA256:990a...b772", reason: "Final quality release signoff" }
    ]
  }
];

const INITIAL_QUIZ = {
  documentId: "DOC-2026-001",
  title: "Competency Assessment: ICP-MS Calibration (SOP-MET-402)",
  passingThreshold: 80,
  questions: [
    {
      id: "q1",
      question: "Which of the following standards must be used for initial tuning of the ICP-MS?",
      options: [
        "Single-element high concentration lead solution",
        "Multi-element tuning solution containing Li, Y, Ce, Tl, and Co",
        "Deionized municipal water bypass sample",
        "Buffered saline matrix control"
      ],
      correctAnswer: 1
    },
    {
      id: "q2",
      question: "If calibration drift exceeds the Action Threshold limit (>10%), what immediate step is mandated?",
      options: [
        "Manually overwrite the raw instrument log in Excel",
        "File a Deviation / Quality Event in the EQMS and trigger an instrument lock",
        "Ignore if animal welfare tests are active",
        "Proceed with testing and mark as 'adjusted'"
      ],
      correctAnswer: 1
    },
    {
      id: "q3",
      question: "What is the primary role of an Internal Standard (e.g., Indium or Bismuth) in metals digestion?",
      options: [
        "To color-code the samples for the autosampler",
        "To compensate for matrix suppression and physical instrument drift",
        "To sterilize potential pathogens in the water matrix",
        "To bind with animal tissue proteins directly"
      ],
      correctAnswer: 1
    }
  ]
};

export default function App() {
  // Navigation & Viewport control
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // App State Database simulation
  const [blueprints, setBlueprints] = useState(INITIAL_BLUEPRINTS);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [instances, setInstances] = useState([
    {
      id: "CAP-2026-0001",
      blueprintId: "metals-deviation-spec",
      blueprintVersion: 1,
      status: "Triggered",
      createdAt: "2026-07-14 15:30",
      data: {
        sampleId: "PB-2026-0714-X1",
        metalType: "Lead (Pb)",
        concentrationPPM: 45.2,
        icpMsSerial: "Agilent-7900-ICPMS-441",
        actionLimit: 0.015
      },
      auditReason: "Automated trigger from Agilent instrument API"
    }
  ]);
  const [auditLogs, setAuditLogs] = useState([
    { id: "AUD-101", timestamp: "2026-07-15 08:30:12", user: "Dr. Sarah Jenkins", action: "READ_DOCUMENT", details: "Accessed SOP-MET-402 v2.1", hash: "SHA256:f72a...890a" },
    { id: "AUD-102", timestamp: "2026-07-15 08:45:00", user: "Admin (Self)", action: "INITIALIZE_EQMS", details: "Isolated Schema Registry mounted into Bounded Context.", hash: "SHA256:33ab...bc41" }
  ]);
  const [outbox, setOutbox] = useState([
    { id: "OUT-001", timestamp: "2026-07-14 15:30:05", status: "ACKNOWLEDGED", eventType: "METAL_CONCENTRATION_CRITICAL_EXCURSION", payload: { sampleId: "PB-2026-0714-X1", concentrationPPM: 45.2, flag: "LOCK_ASSOCIATED_ANIMAL_BATCH" } }
  ]);

  // Modals and Active Workflows
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signAction, setSignAction] = useState(null); // { type: 'APPROVE_DOC'/'TRANSITION_CAP', targetId: string, currentStatus: string, nextStatus: string }
  const [signaturePin, setSignaturePin] = useState("");
  const [signatureReason, setSignatureReason] = useState("");
  const [signatureError, setSignatureError] = useState("");

  // Dynamic CAP Form states
  const [selectedBlueprintId, setSelectedBlueprintId] = useState("metals-deviation-spec");
  const [capFormValues, setCapFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Training state
  const [trainingAnswers, setTrainingAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [competencyUpload, setCompetencyUpload] = useState(null);
  const [competencyVerified, setCompetencyVerified] = useState(false);

  // Admin Schema Builder States (Using robust string ID references instead of stale objects)
  const [selectedAdminBlueprintId, setSelectedAdminBlueprintId] = useState("metals-deviation-spec");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const activeAdminBlueprint = blueprints.find(b => b.id === selectedAdminBlueprintId) || blueprints[0];

  // Custom User Session Context
  const currentSessionUser = {
    uid: "USR-CH-99432",
    name: "Dr. Catherine Halsey",
    role: "Senior Lab Director / Quality Manager",
    authorizedApps: ["EQMS", "LIMS-Core", "IACUC-Portal"]
  };

  // --- COMPLIANCE NAVIGATION SYNC ---
  // Guard selector state when administrators modify or deactivate blueprints
  useEffect(() => {
    const activeBlueprints = blueprints.filter(b => b.active);
    if (activeBlueprints.length > 0 && !activeBlueprints.some(b => b.id === selectedBlueprintId)) {
      setSelectedBlueprintId(activeBlueprints[0].id);
    }
  }, [blueprints, selectedBlueprintId]);

  // Append new entry to simulated immutable Audit Log (ALCOA+ criteria)
  const writeAuditLog = (action, details) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const id = `AUD-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Simple mock of a cryptographic Action Hash
    const rawData = `${timestamp}|${currentSessionUser.uid}|${action}|${details}`;
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      hash = (hash << 5) - hash + rawData.charCodeAt(i);
      hash |= 0;
    }
    const actionHash = `SHA256:${Math.abs(hash).toString(16).padEnd(8, 'f').substring(0, 8)}...sig`;

    const logEntry = { id, timestamp, user: currentSessionUser.name, action, details, hash: actionHash };
    setAuditLogs(prev => [logEntry, ...prev]);
  };

  // Publish event to Outbox to decouple EQMS from parent system (Outbox Pattern)
  const publishOutboxEvent = (eventType, payload) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const id = `OUT-${Math.floor(100 + Math.random() * 900)}`;
    const newEvent = {
      id,
      timestamp,
      status: "PENDING_BRIDGE",
      eventType,
      payload
    };

    setOutbox(prev => [newEvent, ...prev]);

    // Simulate parent system dispatcher polling and acknowledging the outbox
    setTimeout(() => {
      setOutbox(currentOutbox => 
        currentOutbox.map(evt => 
          evt.id === id ? { ...evt, status: "ACKNOWLEDGED" } : evt
        )
      );
      writeAuditLog("OUTBOX_DISPATCH", `Parent system acknowledged bridge event '${eventType}' for ${payload.sampleId || payload.sourceId || 'System ID'}`);
    }, 2500);
  };

  // Handle Double-Key Signatory Control Approval
  const executeSignedWorkflow = () => {
    if (!signaturePin || signaturePin !== "1234") {
      setSignatureError("Authentication Failure: PIN incorrect. Standard system security required.");
      return;
    }
    if (!signatureReason.trim()) {
      setSignatureError("Compliance Failure: A reason for change is mandatory for GxP signatory trails.");
      return;
    }

    const { type, targetId, nextStatus } = signAction;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const actionHash = `SHA256:${Math.floor(10000000 + Math.random() * 90000000).toString(16)}...sign`;

    if (type === 'APPROVE_DOC') {
      setDocuments(prevDocs => 
        prevDocs.map(doc => {
          if (doc.id === targetId) {
            const updatedSigs = [...doc.signatures, {
              role: `${currentSessionUser.role} Signatory`,
              user: currentSessionUser.name,
              timestamp,
              hash: actionHash,
              reason: signatureReason
            }];
            return { ...doc, status: nextStatus, signatures: updatedSigs };
          }
          return doc;
        })
      );
      writeAuditLog("DOCUMENT_WORKFLOW_SIGN", `Document ${targetId} changed status to ${nextStatus}. Reason: ${signatureReason}`);
    } else if (type === 'TRANSITION_CAP') {
      setInstances(prevInstances =>
        prevInstances.map(inst => {
          if (inst.id === targetId) {
            return { ...inst, status: nextStatus, auditReason: signatureReason };
          }
          return inst;
        })
      );
      writeAuditLog("CAP_WORKFLOW_SIGN", `Quality incident ${targetId} updated to state [${nextStatus}]. Reason: ${signatureReason}`);
    }

    // Reset signatory modal
    setSignaturePin("");
    setSignatureReason("");
    setSignatureError("");
    setSignModalOpen(false);
    setSignAction(null);
  };

  // Dynamic CAP Form processing
  const handleDynamicInput = (fieldId, val) => {
    setCapFormValues(prev => ({ ...prev, [fieldId]: val }));
    if (formErrors[fieldId]) {
      setFormErrors(prev => ({ ...prev, [fieldId]: null }));
    }
  };

  const submitDynamicCAP = (e) => {
    e.preventDefault();
    const activeBlueprint = blueprints.find(b => b.id === selectedBlueprintId);
    if (!activeBlueprint) return;
    
    let errors = {};
    activeBlueprint.fields.forEach(f => {
      if (f.required && !capFormValues[f.id]) {
        errors[f.id] = `${f.label} is required for schema ${activeBlueprint.name}`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      writeAuditLog("FORM_VALIDATION_FAILURE", `User failed dynamic constraint validation for ${activeBlueprint.id}`);
      return;
    }

    const newId = `CAP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const newInstance = {
      id: newId,
      blueprintId: activeBlueprint.id,
      blueprintVersion: activeBlueprint.version,
      status: "Triggered",
      createdAt: timestamp,
      data: capFormValues,
      auditReason: "Initial dynamic form data submission."
    };

    setInstances(prev => [newInstance, ...prev]);
    writeAuditLog("CAP_INSTANCE_COMMITTED", `Committed dynamic payload for ${activeBlueprint.id} (v${activeBlueprint.version}) as ${newId}.`);

    evaluateExcursionLimits(activeBlueprint, capFormValues);

    setCapFormValues({});
    setFormErrors({});
  };

  const evaluateExcursionLimits = (blueprint, data) => {
    if (blueprint.id === "metals-deviation-spec") {
      const ppmVal = parseFloat(data.concentrationPPM);
      const limitVal = parseFloat(data.actionLimit || 0.015);
      if (ppmVal > limitVal) {
        publishOutboxEvent("METAL_CONCENTRATION_CRITICAL_EXCURSION", {
          sampleId: data.sampleId || "UNKNOWN_BATCH",
          metalAssay: data.metalType,
          concentrationPPM: ppmVal,
          limitExceeded: limitVal,
          flag: "LOCK_ASSOCIATED_ANIMAL_BATCH"
        });
      }
    } else if (blueprint.id === "water-quality-spec") {
      const turbidity = parseFloat(data.turbidityNTU);
      if (turbidity > 5.0) {
        publishOutboxEvent("WATER_TURBIDITY_EXCURSION", {
          sourceId: data.sourceId || "MAIN_INLET",
          turbidityNTU: turbidity,
          flag: "BYPASS_TREATMENT_COHORT"
        });
      }
    }
  };

  const evaluateQuiz = () => {
    let score = 0;
    INITIAL_QUIZ.questions.forEach((q) => {
      if (trainingAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });

    const percent = Math.round((score / INITIAL_QUIZ.questions.length) * 100);
    setQuizScore(percent);
    
    if (percent >= INITIAL_QUIZ.passingThreshold) {
      setQuizFeedback(`PASS: Core SOP-MET-402 standards validated at ${percent}%. Supervisor competency verification required next.`);
      writeAuditLog("TRAINING_COMPLETED", `User scored ${percent}% on SOP-MET-402 Assessment. PASS.`);
    } else {
      setQuizFeedback(`FAIL: SOP knowledge measured at ${percent}%. Standard passing limit is ${INITIAL_QUIZ.passingThreshold}%. Re-reading mandated.`);
      writeAuditLog("TRAINING_FAILED", `User failed competency assessment with ${percent}% score.`);
    }
  };

  const triggerMockUpload = (fileName) => {
    setCompetencyUpload(fileName);
    writeAuditLog("COMPETENCY_EVIDENCE_ATTACHED", `Uploaded verification evidence file: ${fileName}`);
    
    setTimeout(() => {
      setCompetencyVerified(true);
      writeAuditLog("COMPETENCY_VERIFIED", `Supervisor validated competency certification for SOP-MET-402.`);
    }, 2000);
  };

  const addFieldToBlueprint = () => {
    if (!newFieldName || !newFieldLabel) return;
    
    const formattedId = newFieldName.replace(/\s+/g, '').toLowerCase();
    const newField = {
      id: formattedId,
      label: newFieldLabel,
      type: newFieldType,
      required: newFieldRequired,
      placeholder: `Dynamic ${newFieldLabel}`
    };

    const updatedBlueprints = blueprints.map(b => {
      if (b.id === selectedAdminBlueprintId) {
        const nextVersion = b.version + 1;
        const updatedFields = [...b.fields, newField];
        
        return { 
          ...b, 
          version: nextVersion, 
          fields: updatedFields,
          description: b.description.includes("Extended schema") 
            ? b.description.replace(/Extended schema v\d+/, `Extended schema v${nextVersion}`)
            : b.description + ` (Extended schema v${nextVersion})`
        };
      }
      return b;
    });

    setBlueprints(updatedBlueprints);
    writeAuditLog("SCHEMA_BLUEPRINT_UPGRADED", `Upgraded ${selectedAdminBlueprintId} schema definition to version ${activeAdminBlueprint.version + 1}`);
    
    setNewFieldName("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
  };

  const toggleBlueprintActive = (id) => {
    setBlueprints(prev => 
      prev.map(b => b.id === id ? { ...b, active: !b.active } : b)
    );
    const target = blueprints.find(b => b.id === id);
    writeAuditLog("SCHEMA_STATUS_TOGGLED", `Toggled schema status for ${id}. New state: ${!target?.active ? 'Active' : 'Retired'}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col antialiased">
      
      {/* SYSTEM HEADER BANNER */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center shadow-lg gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-500/10 border border-teal-500/30 p-2.5 rounded-xl">
            <Shield className="h-6 w-6 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                EQMS LabSuite
              </span>
              <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                v2.6-Beta
              </span>
            </div>
            <p className="text-xs text-slate-400">Analytical Chemistry Quality Engine</p>
          </div>
        </div>

        {/* CONTAINER CONTEXT */}
        <div className="flex items-center space-x-6">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs text-slate-500">Parent Auth Context</span>
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 justify-end">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              {currentSessionUser.name} ({currentSessionUser.role.split(' ')[0]})
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-3">
            <Database className="h-4 w-4 text-indigo-400" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-mono text-slate-500">MSSQL Registry</p>
              <p className="text-xs font-semibold text-indigo-300">NVARCHAR(MAX) JSON</p>
            </div>
          </div>
        </div>
      </header>

      {/* SUB-HEADER STATUS INDICATORS */}
      <section className="bg-slate-950/40 border-b border-slate-800/60 py-2 px-6 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            Isolated Registry: Active
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Outbox Loop: Listening
          </span>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Alchemical Matrix: Animals/Water/Metals Enabled
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-[11px]">
          <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">
            Audit Security: Strict Log File State
          </span>
        </div>
      </section>

      {/* CORE WORKFLOW AREA */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFTSIDE NAVIGATION TAB SYSTEM */}
        <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800/80 p-4 space-y-2 flex-shrink-0">
          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 py-2">Modules & Workflows</p>
          
          <button 
            onClick={() => { setActiveTab("dashboard"); writeAuditLog("MENU_NAVIGATION", "Switched view to Dashboard Overview"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition ${activeTab === 'dashboard' ? 'bg-teal-500/10 text-teal-300 font-medium border border-teal-500/30' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}`}
          >
            <Shield className="h-5 w-5" />
            <span>Dashboard Overview</span>
          </button>

          <button 
            onClick={() => { setActiveTab("docs"); writeAuditLog("MENU_NAVIGATION", "Switched view to Document Control"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition ${activeTab === 'docs' ? 'bg-teal-500/10 text-teal-300 font-medium border border-teal-500/30' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}`}
          >
            <FileText className="h-5 w-5" />
            <span>Document Control</span>
          </button>

          <button 
            onClick={() => { setActiveTab("cap"); writeAuditLog("MENU_NAVIGATION", "Switched view to CAP Quality Events"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition ${activeTab === 'cap' ? 'bg-teal-500/10 text-teal-300 font-medium border border-teal-500/30' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}`}
          >
            <Clipboard className="h-5 w-5" />
            <span>CAP & Deviations</span>
          </button>

          <button 
            onClick={() => { setActiveTab("training"); writeAuditLog("MENU_NAVIGATION", "Switched view to Employee Training"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition ${activeTab === 'training' ? 'bg-teal-500/10 text-teal-300 font-medium border border-teal-500/30' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}`}
          >
            <GraduationCap className="h-5 w-5" />
            <span>Employee Training</span>
          </button>

          <div className="pt-4 border-t border-slate-800/80 my-4"></div>
          <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 py-2">Control Plane</p>

          <button 
            onClick={() => { setActiveTab("admin"); writeAuditLog("MENU_NAVIGATION", "Switched view to Schema Registry Administration"); }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm transition ${activeTab === 'admin' ? 'bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'}`}
          >
            <Settings className="h-5 w-5 text-indigo-400" />
            <span>Schema Registry (Admin)</span>
          </button>

          {/* QUICK ALERTS BOX */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 mt-6">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Safety Outbox Guard</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Exceeding spec triggers auto-notifications to LIMS to quarantine target animal cohorts.
            </p>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* TOP HERO ANNOUNCEMENT */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-100">Lab Suite System Health Matrix</h1>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    Isolated registry control over specialized chemistry samples. Outbox bridging prevents hazardous waste or out-of-spec chemical release instantly.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Dynamic Schemas</p>
                    <p className="text-lg font-bold text-teal-400">{blueprints.length}</p>
                  </div>
                  <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-mono">Unresolved CAPs</p>
                    <p className="text-lg font-bold text-amber-400">{instances.filter(i => i.status !== 'Approved').length}</p>
                  </div>
                </div>
              </div>

              {/* THREE COLUMN SUMMARY METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* MATRICS ASSAY CONTROLS */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase font-mono tracking-wider text-teal-400">Metal Assay Matrices</span>
                      <Shield className="h-4 w-4 text-teal-400" />
                    </div>
                    <p className="text-2xl font-bold">ICP-MS Protocol</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Active threshold set: <span className="text-teal-300 font-mono">Lead &gt; 0.015 PPM</span>. Automatic bridge is connected and listening to analytical instruments.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Form Definition Version</span>
                    <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-teal-400">v{blueprints.find(b => b.id === 'metals-deviation-spec')?.version || 1}.0</span>
                  </div>
                </div>

                {/* WATER FLOW METRIC */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase font-mono tracking-wider text-blue-400">Water Infiltration</span>
                      <Database className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">Turbidity & pH</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Active compliance values monitored over municipal and aquifer inlet bypasses. Real-time safety state checks.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Outbox Status</span>
                    <span className="font-semibold text-blue-400 uppercase">Live Intercept</span>
                  </div>
                </div>

                {/* ANIMAL EXCURSIONS */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase font-mono tracking-wider text-indigo-400">IACUC Controls</span>
                      <AlertTriangle className="h-4 w-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold">Animal Biosafety</p>
                    <p className="text-xs text-slate-400 mt-2">
                      Cohort surveillance tracks heat excursions or protocol limits breaches, and locks feed matrices dynamically.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Audit Compliance</span>
                    <span className="text-indigo-400 font-semibold uppercase">Double-Key</span>
                  </div>
                </div>

              </div>

              {/* LIVE EVENTS OUTBOX BRIDGE SIMULATOR */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4 text-teal-400" />
                    <span className="font-bold text-sm">System Outbox & Parent Container Event Bridge</span>
                  </div>
                  <span className="text-[11px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded uppercase font-mono">
                    Pattern: Transactional Outbox
                  </span>
                </div>
                <div className="p-4 space-y-3 max-h-60 overflow-y-auto font-mono text-xs text-slate-300">
                  {outbox.map(evt => (
                    <div key={evt.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-indigo-400 font-semibold">{evt.eventType}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${evt.status === 'ACKNOWLEDGED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border-amber-500/20 animate-pulse'}`}>
                          {evt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Transaction ID: {evt.id} | Timestamp: {evt.timestamp}</p>
                      <pre className="bg-slate-950 p-2 rounded text-[10px] text-slate-300 overflow-x-auto">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DOCUMENT CONTROL SOP VAULT */}
          {activeTab === "docs" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold">Laboratory SOP Vault & Change Control</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Signatory-controlled Standard Operating Procedures (SOPs). Fully isolated document lineage storage.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const id = `DOC-2026-0${documents.length + 1}`;
                    const newDoc = {
                      id,
                      title: "New Dynamic Laboratory Guideline Specification",
                      version: "v1.0",
                      status: "Draft",
                      module: "Document Control",
                      createdBy: currentSessionUser.name,
                      effectiveDate: "Pending Draft Review",
                      description: "Enter procedural guidance parameter descriptions.",
                      signatures: []
                    };
                    setDocuments([...documents, newDoc]);
                    writeAuditLog("DOCUMENT_CREATION", `Created draft document template ${id}`);
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Draft New Document</span>
                </button>
              </div>

              {/* DOCUMENT INDEX CARDS */}
              <div className="grid grid-cols-1 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-indigo-400 font-mono uppercase tracking-wider">{doc.id}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-400">Owner: {doc.createdBy}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-200">{doc.title}</h3>
                      </div>
                      
                      {/* STATUS PILL */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                        doc.status === 'Effective' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        doc.status === 'Approved' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{doc.description}</p>

                    {/* METADATA BLOCK */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs flex flex-wrap justify-between gap-4">
                      <div>
                        <span className="text-slate-500 block">Version Link</span>
                        <span className="font-mono text-indigo-300">{doc.version}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Effective Date</span>
                        <span className="font-semibold text-slate-300">{doc.effectiveDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Signatures Affixed</span>
                        <span className="font-mono text-teal-400 font-semibold">{doc.signatures.length} Legal Signs</span>
                      </div>
                    </div>

                    {/* IMMUTABLE SIGNATURE LOGS IN ACCORDION STYLE */}
                    {doc.signatures.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cryptographic Signature Manifest</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {doc.signatures.map((sig, i) => (
                            <div key={i} className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80 text-[11px] space-y-1">
                              <div className="flex justify-between text-slate-300 font-semibold">
                                <span>{sig.user}</span>
                                <span className="text-teal-400">{sig.role}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Timestamp: {sig.timestamp}</p>
                              {sig.reason && <p className="text-[10px] italic text-slate-400">Reason: "{sig.reason}"</p>}
                              <p className="text-[9px] font-mono text-indigo-400 overflow-x-auto select-all">{sig.hash}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ACTION TRIGGERS */}
                    <div className="flex justify-end space-x-2 pt-2 border-t border-slate-900/80">
                      {doc.status === 'Draft' && (
                        <button 
                          onClick={() => {
                            setSignAction({
                              type: 'APPROVE_DOC',
                              targetId: doc.id,
                              currentStatus: 'Draft',
                              nextStatus: 'Approved'
                            });
                            setSignModalOpen(true);
                          }}
                          className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <Key className="h-3 w-3" />
                          <span>Approve Version (SOP)</span>
                        </button>
                      )}
                      {doc.status === 'Approved' && (
                        <button 
                          onClick={() => {
                            setSignAction({
                              type: 'APPROVE_DOC',
                              targetId: doc.id,
                              currentStatus: 'Approved',
                              nextStatus: 'Effective'
                            });
                            setSignModalOpen(true);
                          }}
                          className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                        >
                          <Check className="h-3 w-3" />
                          <span>Release to Effective SOP</span>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          writeAuditLog("DOCUMENT_DOWNLOAD", `Exported offline PDF record wrapper for SOP ${doc.id}`);
                        }}
                        className="bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 flex items-center space-x-1 transition"
                      >
                        <Download className="h-3 w-3" />
                        <span>Export PDF COA</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: CAP & DEV WORKFLOWS */}
          {activeTab === "cap" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold">Corrective & Preventive Action (CAP)</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Matrix-specific quality occurrences mapped directly to your active JSONB models (Animals, Water, Metals).
                  </p>
                </div>
              </div>

              {/* DYNAMIC FORM INTAKE SHEATH */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 font-mono mb-2">
                    Select Active Schema Definition (From Isolated Registry)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {blueprints.filter(b => b.active).map(bp => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => {
                          setSelectedBlueprintId(bp.id);
                          setCapFormValues({});
                          setFormErrors({});
                          writeAuditLog("DYNAMIC_FORM_SWITCHED", `Selected dynamic entry model: ${bp.id}`);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${selectedBlueprintId === bp.id ? 'bg-teal-500/10 text-teal-300 border-teal-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'}`}
                      >
                        {bp.name} <span className="bg-slate-950 text-[10px] font-mono px-1 py-0.5 rounded text-indigo-400">v{bp.version}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* THE DYNAMIC RENDERING INTERPRETER (SCHEMA-AS-DATA) */}
                <form onSubmit={submitDynamicCAP} className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold mb-2">
                    <Database className="h-3.5 w-3.5" />
                    <span>Dynamic JSON Compiler: Rendering Model ID "{selectedBlueprintId}"</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {blueprints.find(b => b.id === selectedBlueprintId)?.fields.map(field => (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-xs font-medium text-slate-300">
                          {field.label} {field.required && <span className="text-red-400">*</span>}
                        </label>
                        
                        {field.type === 'select' ? (
                          <select
                            value={capFormValues[field.id] || ""}
                            onChange={(e) => handleDynamicInput(field.id, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 text-slate-200"
                          >
                            <option value="">-- Select Option --</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={capFormValues[field.id] || ""}
                            onChange={(e) => handleDynamicInput(field.id, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 text-slate-200"
                          />
                        )}

                        {formErrors[field.id] && (
                          <span className="text-[10px] text-red-400 block">{formErrors[field.id]}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center flex-wrap gap-2">
                    <p className="text-[10px] text-slate-500">
                      Submitting writes values to SQL Server 2016 JSON-NVARCHAR storage. Constraint checks evaluate limits.
                    </p>
                    <button
                      type="submit"
                      className="bg-teal-500 hover:bg-teal-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Log Compliance Incident</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* INSTANCES / SUBMISSIONS LOG TABLE */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Committed Incidents Ledger (NVARCHAR Column Parser)</h3>
                
                <div className="space-y-3">
                  {instances.map(inst => {
                    const matchedBP = blueprints.find(b => b.id === inst.blueprintId);
                    return (
                      <div key={inst.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold font-mono text-indigo-400">{inst.id}</span>
                            <span className="text-slate-700">|</span>
                            <span className="text-xs text-slate-400">Schema: {matchedBP?.name || inst.blueprintId} (v{inst.blueprintVersion})</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                            inst.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {inst.status}
                          </span>
                        </div>

                        {/* RENDER DUMP OF THE SUBMITTED DYNAMIC DATA */}
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                          {Object.entries(inst.data).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-slate-500 block text-[10px] uppercase font-sans tracking-wide">{k}</span>
                              <span className="text-slate-200">{v?.toString() || 'NULL'}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs flex-wrap gap-2 text-slate-500">
                          <p>Created: <span className="text-slate-400">{inst.createdAt}</span> | Audit Trail Note: <span className="text-slate-400 font-sans italic">"{inst.auditReason}"</span></p>
                          
                          {inst.status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSignAction({
                                  type: 'TRANSITION_CAP',
                                  targetId: inst.id,
                                  currentStatus: inst.status,
                                  nextStatus: 'Approved'
                                });
                                setSignModalOpen(true);
                              }}
                              className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-indigo-500/25 transition"
                            >
                              Double-Sign Closure
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: EMPLOYEE TRAINING COMPETENCY */}
          {activeTab === "training" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold">Employee SOP Training & Competency Verification</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    GxP-mandated competency metrics tracking. Completed quizzes and uploaded supervisor evaluations are indexed dynamically.
                  </p>
                </div>
              </div>

              {/* TWO PANEL TRAINING MODULE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SOP READING AND WRITTEN ASSESSMENT */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Step 1: Calibration Quiz</span>
                    <span className="text-xs text-indigo-400 font-mono">Linked to SOP-MET-402</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-2">
                    <h3 className="text-xs font-bold text-slate-200">{INITIAL_QUIZ.title}</h3>
                    <p className="text-[11px] text-slate-400">Passing score requires {INITIAL_QUIZ.passingThreshold}% proficiency to unlock hands-on laboratory operation.</p>
                  </div>

                  <div className="space-y-4">
                    {INITIAL_QUIZ.questions.map((q, qidx) => (
                      <div key={q.id} className="space-y-2">
                        <p className="text-xs font-semibold text-slate-300">{qidx + 1}. {q.question}</p>
                        <div className="space-y-1">
                          {q.options.map((opt, oidx) => (
                            <label key={oidx} className="flex items-center space-x-2 text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-800/60 cursor-pointer hover:bg-slate-850/60 transition">
                              <input
                                type="radio"
                                name={q.id}
                                checked={trainingAnswers[q.id] === oidx}
                                onChange={() => setTrainingAnswers(prev => ({ ...prev, [q.id]: oidx }))}
                                className="text-teal-500 focus:ring-0"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={evaluateQuiz}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Submit Calibration Assessment</span>
                  </button>

                  {quizScore !== null && (
                    <div className={`p-3 rounded-xl border text-xs font-sans space-y-1 ${quizScore >= INITIAL_QUIZ.passingThreshold ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      <p className="font-bold">Assessment Score: {quizScore}%</p>
                      <p className="text-[11px] leading-relaxed">{quizFeedback}</p>
                    </div>
                  )}
                </div>

                {/* STEP 2: HANDS-ON SUPERVISOR EVALUATION */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Step 2: Practical Competency Checklist</span>
                    <span className="text-xs text-slate-400 mt-1">A physical or video validation upload must be completed by an authorized reviewer.</span>
                  </div>

                  <div className="border border-dashed border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                    <BookOpen className="h-8 w-8 text-indigo-400" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-300">Practical Assay Demonstration Record</p>
                      <p className="text-[10px] text-slate-500">Provide proof of calibration execution (PDF report, trace output, or video walkthrough)</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => triggerMockUpload("Calibration_Run_Pb_Excursion_Proof.pdf")}
                        className="bg-slate-900 hover:bg-slate-850 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                      >
                        Mock Upload: Calibration_Run.pdf
                      </button>
                    </div>

                    {competencyUpload && (
                      <p className="text-[10px] text-teal-400 font-mono">Attachment verified: {competencyUpload}</p>
                    )}
                  </div>

                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Supervisor Attestation status</span>
                    <div className="flex items-center space-x-2">
                      {competencyVerified ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                          <div className="text-left text-xs">
                            <p className="font-bold text-emerald-400">Certified Qualified User</p>
                            <p className="text-[10px] text-slate-500">Signed off by Supervisor: Director Dave</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Clock className="h-5 w-5 text-slate-500" />
                          <div className="text-left text-xs">
                            <p className="font-bold text-slate-400">Awaiting Practical Evidence</p>
                            <p className="text-[10px] text-slate-500">Upload evidence file to trigger automated validator signature.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 5: ADMIN / SCHEMA REGISTRY */}
          {activeTab === "admin" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-indigo-400">Isolated EQMS Schema Registry Control Panel</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    The control center of the Schema-as-Data architecture. Add or retire inputs, and compile schemas directly without touching backend files.
                  </p>
                </div>
              </div>

              {/* ACTIVE BLUEPRINTS MANAGER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COL 1: SCHEMAS LIST */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400">Blueprint Dictionary</h3>
                  <div className="space-y-2">
                    {blueprints.map(bp => (
                      <div 
                        key={bp.id}
                        onClick={() => {
                          setSelectedAdminBlueprintId(bp.id);
                          writeAuditLog("ADMIN_BLUEPRINT_SELECT", `Inspecting blueprint schema data structure for ${bp.id}`);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${selectedAdminBlueprintId === bp.id ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-850'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold">{bp.name}</span>
                          <span className={`w-2 h-2 rounded-full ${bp.active ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                          <span>Version: {bp.version}</span>
                          <span>Fields: {bp.fields.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COL 2: LIVE FIELD BUILDER */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Dynamic Form Field Synthesizer</span>
                    <div className="flex space-x-2">
                      <button 
                        type="button"
                        onClick={() => toggleBlueprintActive(activeAdminBlueprint.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${activeAdminBlueprint.active ? 'bg-red-500/15 text-red-400 border-red-500/20' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'}`}
                      >
                        {activeAdminBlueprint.active ? 'Retire Schema' : 'Reactivate Schema'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-850">
                    <p className="text-xs text-slate-300 font-semibold mb-1">Targeting Definition Model ID: <span className="font-mono text-indigo-300">{activeAdminBlueprint.id} (v{activeAdminBlueprint.version})</span></p>
                    <p className="text-[11px] text-slate-400">Adding a field will automatically increment the schema version. This allows existing dynamic results to remain immutable against old field blueprints.</p>
                  </div>

                  {/* SCHEMA ADD FIELD INPUTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-400">Database Field ID (NVARCHAR key)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., icpMsCoolingTemp" 
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-400">User Interface UI Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g., ICP-MS Cooling Temperature" 
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-400">Field Data Type</label>
                      <select 
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="text">Alphanumeric String (text)</option>
                        <option value="number">Numeric Decimal (number)</option>
                        <option value="date">Calibrated Date Picker (date)</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input 
                        type="checkbox" 
                        id="newFieldRequired"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded text-indigo-500 focus:ring-0"
                      />
                      <label htmlFor="newFieldRequired" className="text-xs font-medium text-slate-400 cursor-pointer">GxP Strict Mandated Input (Required)</label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addFieldToBlueprint}
                    disabled={!newFieldName || !newFieldLabel}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Compile Field Schema Addition (Triggers v{activeAdminBlueprint.version + 1})</span>
                  </button>
                </div>

              </div>

              {/* DYNAMIC COMPUTED COLUMN EXPOSURE */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <Database className="h-4 w-4" />
                    <span className="font-bold text-sm">MSSQL 2016+ Dynamic Performance Engine Optimizer</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded uppercase font-mono">
                    System Architecture Helper
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Because SQL Server 2016+ handles JSON via NVARCHAR(MAX), frequently searched fields must be promoted to <strong>Computed Columns with Non-Clustered Indexes</strong>. Based on your active schema selection (<span className="text-slate-300 font-mono font-bold">{activeAdminBlueprint.id}</span>), here is the optimized SQL required for database parity:
                </p>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-3 font-mono text-xs">
                  <pre className="text-indigo-300 text-[11px] overflow-x-auto select-all p-2 bg-slate-950 rounded leading-relaxed">
{`-- SQL Server 2016+ JSON-NVARCHAR Optimization Pipeline
-- Targets Schema: ${activeAdminBlueprint.id} (Current Blueprint v${activeAdminBlueprint.version})

ALTER TABLE EQMS_Submissions
ADD [${activeAdminBlueprint.fields[0]?.id || 'SampleID'}_Computed] AS CAST(
    JSON_VALUE([Payload], '$.${activeAdminBlueprint.fields[0]?.id || 'sampleId'}') 
    AS VARCHAR(100)
) PERSISTED;

CREATE NONCLUSTERED INDEX [IX_EQMS_Submissions_${activeAdminBlueprint.fields[0]?.id || 'SampleID'}]
ON EQMS_Submissions ([${activeAdminBlueprint.fields[0]?.id || 'SampleID'}_Computed])
WITH (ONLINE = ON, DATA_COMPRESSION = PAGE);`}
                  </pre>
                  <p className="text-[10px] text-slate-500 italic font-sans">
                    Note: Using PERSISTED index optimization guarantees that your analytical laboratory trend charts bypass heavy full-table scanning.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* CENTRAL IMMUTABLE AUDIT LOG VIEWER */}
          <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-teal-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Immutable ALCOA+ System Audit Ledger</span>
              </div>
              <span className="text-[10px] bg-slate-950 px-2.5 py-1 rounded text-slate-500 border border-slate-850">
                Authorized Session: USR-CH-99432
              </span>
            </div>
            <div className="divide-y divide-slate-900 max-h-60 overflow-y-auto text-xs font-mono">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 hover:bg-slate-900/30 transition flex flex-col md:flex-row justify-between gap-2 items-start md:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-teal-400 font-semibold">[{log.action}]</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{log.details}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Operator: <span className="text-slate-400">{log.user}</span> | Logged At: <span className="text-slate-400">{log.timestamp}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-indigo-400 bg-slate-900 px-2 py-1 rounded border border-slate-850 w-full md:w-auto text-left select-all">
                    {log.hash}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      {/* DOUBLE-KEY COMPLIANCE SIGNATURE MODAL */}
      {signModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            
            <div className="p-5 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
              <Key className="h-5 w-5 text-indigo-400 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">Electronic Signatory Signature Intention</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Authorizing state changes inside isolated registry boundaries.</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Target ID:</span>
                  <span className="text-indigo-300 font-bold">{signAction?.targetId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transition Phase:</span>
                  <span className="text-amber-400 font-semibold">{signAction?.currentStatus} ➔ {signAction?.nextStatus}</span>
                </div>
              </div>

              {/* DOUBLE SIGNATURE REQUIREMENT */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold">Authorized Legal Pin</label>
                  <input
                    type="password"
                    placeholder="Enter PIN (Demo PIN is 1234)"
                    value={signaturePin}
                    onChange={(e) => setSignaturePin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-slate-400 font-semibold">Reason for Structural Change</label>
                  <textarea
                    placeholder="Specify justification details for this GxP record modification."
                    value={signatureReason}
                    onChange={(e) => setSignatureReason(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {signatureError && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {signatureError}
                  </p>
                )}
              </div>

            </div>

            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setSignModalOpen(false);
                  setSignaturePin("");
                  setSignatureReason("");
                  setSignatureError("");
                }}
                className="bg-slate-900 hover:bg-slate-850 text-slate-400 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
              >
                Cancel Authorization
              </button>
              <button
                type="button"
                onClick={executeSignedWorkflow}
                className="bg-indigo-500 hover:bg-indigo-600 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-bold"
              >
                Validate Signature Intent
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPLIANCE FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-850 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-500 font-mono">
        <p>© 2026 Analytical Chemistry Laboratory Inc. Bounded Quality Namespace Sandbox.</p>
        <div className="flex space-x-4">
          <span className="text-teal-400">ISO 17025 Compliant</span>
          <span>•</span>
          <span className="text-indigo-400">Double-Key Ledger Certified</span>
        </div>
      </footer>

    </div>
  );
}
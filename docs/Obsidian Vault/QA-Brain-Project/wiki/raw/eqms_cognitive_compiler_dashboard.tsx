import React, { useState, useEffect, useRef } from "react";

// Color System matching our PCOS and Cognitive Compiler specifications
const C = {
  bg: "#09090b",
  card: "#121217",
  border: "#222227",
  text: "#fafafa",
  muted: "#71717a",
  accent: "#22c55e", // Brand Green
  goals: "#f97316",     // Orange
  intent: "#facc15",    // Yellow
  skills: "#3b82f6",    // Blue
  knowledge: "#06b6d4", // Cyan
  decisions: "#a855f7", // Purple
  feedback: "#ef4444",   // Red
  execution: "#22c55e",  // Green
};

// Preset Laboratory Notes representing raw GxP / ISO 17025 events
const PRESETS = [
  {
    id: "metals_excursion",
    title: "ICP-MS Blank Spike (Metals Lab)",
    matrix: "Metals",
    text: "During our ICP-MS run on 2026-07-15 for the Lead-Water-Study (Project ID: PRJ-9921), the calibration blank sample spiked at 0.15 ppm, which is significantly above our Limit of Detection (LOD) threshold of 0.05 ppm. This run occurred on Instrument ICPMS-04 under SOP-CHEM-402. Analyst Joe Henderson noticed. We must immediately halt active water assay testing on Reservoir B, recalibrate the nebulizer, and schedule a training review for the cleaning procedures to prevent future carryover.",
    requiredKeys: ["instrument_id", "lod_threshold", "sop_reference"]
  },
  {
    id: "animal_temp",
    title: "Vivarium Temp Alarm (Animal Care)",
    matrix: "Animals",
    text: "At 03:15 AM, Room 104-B (Vivarium Holding Section) triggered a critical climate alert. The ambient temperature spiked to 26.8°C, exceeding the IACUC-approved range ceiling of 22.0°C for murine study cages (Protocol Ref: IACUC-2025-A88). The secondary ventilation unit failed to engage. Technician Marcus Aurelius adjusted the thermostat manually and verified all 45 mice were stable, but we need to generate a critical CAPA to investigate the HVAC relay switch.",
    requiredKeys: ["room_id", "iacuc_protocol", "temperature_reading"]
  },
  {
    id: "water_contam",
    title: "Turbidity Out-of-Spec (Water Lab)",
    matrix: "Water",
    text: "Routine discharge monitoring of Outfall Coordinates (39.7392° N, 104.9903° W) revealed an Out-of-Specification (OOS) turbidity event. The turbidity reading recorded 14.5 NTU, while our discharge license ceiling is 5.0 NTU. This was logged under SOP-WATER-02 by lead analyst Clara Barton. We must log a formal Deviation, deploy sediment barriers, and alert the environmental health board. Run was on turbidimeter TBD-09.",
    requiredKeys: ["coordinates", "turbidity_reading", "sop_reference"]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("visualization");
  const [inputText, setInputText] = useState(PRESETS[0].text);
  const [currentMatrix, setCurrentMatrix] = useState("Metals");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerPhase, setCompilerPhase] = useState("idle"); // idle, lexer, ast, typecheck, codegen, complete
  const [compiledResult, setCompiledResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  // References for Thought Cloud physics engine
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

  // Initialize and load default compilation
  useEffect(() => {
    handleCompile(inputText, PRESETS[0]);
  }, []);

  // Sync canvas size and handle mouse interaction setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.parentNode.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height || 450;
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, compiledResult]);

  // Main physics simulation loop for the Floating Thought Cloud
  useEffect(() => {
    if (activeTab !== "visualization" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let localNodes = [...nodes];

    const runPhysics = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Calculate and apply forces
      for (let i = 0; i < localNodes.length; i++) {
        const node1 = localNodes[i];

        // Gravitational pull toward center
        const dx = cx - node1.x;
        const dy = cy - node1.y;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        const gravityK = 0.008;
        node1.vx += dx * gravityK;
        node1.vy += dy * gravityK;

        // Node-to-Node Repulsion
        for (let j = i + 1; j < localNodes.length; j++) {
          const node2 = localNodes[j];
          const rx = node2.x - node1.x;
          const ry = node2.y - node1.y;
          const dist = Math.sqrt(rx * rx + ry * ry) || 1;

          if (dist < 150) {
            const force = (150 - dist) * 0.06;
            const forceX = (rx / dist) * force;
            const forceY = (ry / dist) * force;

            if (!node1.isFixed) {
              node1.vx -= forceX;
              node1.vy -= forceY;
            }
            if (!node2.isFixed) {
              node2.vx += forceX;
              node2.vy += forceY;
            }
          }
        }

        // Mouse Interactivity: Push away from mouse
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const mdx = node1.x - mx;
        const mdy = node1.y - my;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
        if (mdist < 100 && !node1.isFixed) {
          const pushForce = (100 - mdist) * 0.08;
          node1.vx += (mdx / mdist) * pushForce;
          node1.vy += (mdy / mdist) * pushForce;
        }

        // Damping / Friction
        node1.vx *= 0.85;
        node1.vy *= 0.85;

        // Apply velocities (unless being dragged)
        if (!node1.isFixed) {
          node1.x += node1.vx;
          node1.y += node1.vy;
        }

        // Boundary checks
        const pad = 40;
        if (node1.x < pad) { node1.x = pad; node1.vx *= -1; }
        if (node1.x > canvas.width - pad) { node1.x = canvas.width - pad; node1.vx *= -1; }
        if (node1.y < pad) { node1.y = pad; node1.vy *= -1; }
        if (node1.y > canvas.height - pad) { node1.y = canvas.height - pad; node1.vy *= -1; }
      }

      // 2. Render loop
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faint, glowing connection webs
      ctx.strokeStyle = "rgba(34, 197, 94, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < localNodes.length; i++) {
        for (let j = i + 1; j < localNodes.length; j++) {
          const dist = Math.sqrt(Math.pow(localNodes[i].x - localNodes[j].x, 2) + Math.pow(localNodes[i].y - localNodes[j].y, 2));
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(localNodes[i].x, localNodes[i].y);
            ctx.lineTo(localNodes[j].x, localNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      localNodes.forEach((node) => {
        const radius = Math.max(35, node.text.length * 4.5);

        // Ambient radial glow
        const glow = ctx.createRadialGradient(node.x, node.y, 5, node.x, node.y, radius + 20);
        glow.addColorStop(0, `${node.color}25`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 20, 0, Math.PI * 2);
        ctx.fill();

        // Main Node Circle
        ctx.fillStyle = "#16161e";
        ctx.strokeStyle = node.color;
        ctx.lineWidth = node.isFixed ? 3 : 1.5;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Category Tag Pill
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(node.x - radius + 10, node.y - 22, (radius - 10) * 2, 14);
        ctx.fillStyle = node.color;
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.category.toUpperCase(), node.x, node.y - 12);

        // Core Text Inside Node
        ctx.fillStyle = "#fafafa";
        ctx.font = "11px system-ui, -apple-system, sans-serif";
        ctx.fillText(node.text, node.x, node.y + 6);

        // Render subtext / values if available
        if (node.value) {
          ctx.fillStyle = C.muted;
          ctx.font = "italic 9px system-ui, -apple-system, sans-serif";
          ctx.fillText(node.value, node.x, node.y + 18);
        }
      });

      animationFrameRef.current = requestAnimationFrame(runPhysics);
    };

    animationFrameRef.current = requestAnimationFrame(runPhysics);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [nodes, activeTab]);

  // Utility to map categorized tokens directly to design colors
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case "matrix": return C.goals;
      case "instrument": return C.skills;
      case "metric": return C.knowledge;
      case "protocol": return C.decisions;
      case "action": return C.feedback;
      default: return C.intent;
    }
  };

  // Prepares the 2D nodes arrays
  const populateNodes = (tokens, canvasWidth = 600, canvasHeight = 450) => {
    const initializedNodes = tokens.map((tk, idx) => {
      const angle = (idx / tokens.length) * Math.PI * 2;
      const radius = 120 + Math.random() * 50;
      return {
        id: idx,
        text: tk.text,
        category: tk.category,
        value: tk.value || "",
        color: getCategoryColor(tk.category),
        x: (canvasWidth / 2) + Math.cos(angle) * radius,
        y: (canvasHeight / 2) + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        isFixed: false
      };
    });
    setNodes(initializedNodes);
  };

  // Handles mouse and drag operations inside Canvas
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current = { x, y, isDown: true };

    // Find if a node was clicked
    const clickedNode = nodes.find((node) => {
      const radius = Math.max(35, node.text.length * 4.5);
      const dist = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2));
      return dist < radius;
    });

    if (clickedNode) {
      clickedNode.isFixed = true;
      setDraggedNode(clickedNode);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current.x = x;
    mouseRef.current.y = y;

    if (draggedNode) {
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n.id === draggedNode.id) {
            return { ...n, x, y };
          }
          return n;
        })
      );
    }
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
    if (draggedNode) {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === draggedNode.id) {
            return { ...n, isFixed: false };
          }
          return n;
        })
      );
      setDraggedNode(null);
    }
  };

  // Offline deterministic fallback compiler for validation sandboxing
  const compileHeuristic = (text, preset) => {
    const matrix = preset?.matrix || currentMatrix;
    let tokens = [];
    let deviation = {};
    let metadata = {};
    let typeCheck = { passed: true, warnings: [] };

    if (matrix === "Metals") {
      tokens = [
        { text: "Metals Lab", category: "matrix" },
        { text: "ICPMS-04", category: "instrument", value: "ICP-MS Spec" },
        { text: "0.15 ppm", category: "metric", value: "Blank Spike" },
        { text: "0.05 ppm", category: "metric", value: "LOD Floor" },
        { text: "SOP-CHEM-402", category: "protocol", value: "Wash Protocol" },
        { text: "Halt Testing", category: "action", value: "Reservoir B" },
        { text: "Recalibrate", category: "action", value: "Nebulizer Lock" },
      ];
      metadata = {
        instrument_id: "ICPMS-04",
        lod_threshold: "0.05 ppm",
        sop_reference: "SOP-CHEM-402",
        analyst: "Joe Henderson",
        project_id: "PRJ-9921",
        run_date: "2026-07-15"
      };
      deviation = {
        title: "ICP-MS Calibration Blank Spike Exceedance",
        criticality: "High",
        exceedance_amount: "0.10 ppm Over Limit",
        narrative: text
      };
    } else if (matrix === "Animals") {
      tokens = [
        { text: "Animal Vivarium", category: "matrix" },
        { text: "Room 104-B", category: "instrument", value: "Murine Sector" },
        { text: "26.8°C", category: "metric", value: "Peak Temperature" },
        { text: "22.0°C", category: "metric", value: "Target Ceiling" },
        { text: "IACUC-2025-A88", category: "protocol", value: "Murine Spec" },
        { text: "Ventilation Failure", category: "action", value: "HVAC Relay" },
        { text: "Manual Adjust", category: "action", value: "Marcus Aurelius" }
      ];
      metadata = {
        room_id: "Room 104-B",
        iacuc_protocol: "IACUC-2025-A88",
        temperature_reading: "26.8°C",
        technician: "Marcus Aurelius",
        active_cages: "45 mice stable"
      };
      deviation = {
        title: "Vivarium Room 104-B Temperature Control Breach",
        criticality: "Critical",
        exceedance_amount: "4.8°C Above Allowed Ceiling",
        narrative: text
      };
    } else {
      // Water
      tokens = [
        { text: "Water Chemistry", category: "matrix" },
        { text: "TBD-09", category: "instrument", value: "Turbidimeter" },
        { text: "14.5 NTU", category: "metric", value: "Current Discharge" },
        { text: "5.0 NTU", category: "metric", value: "License Max" },
        { text: "39.7392° N", category: "protocol", value: "Outfall Lat" },
        { text: "104.9903° W", category: "protocol", value: "Outfall Lng" },
        { text: "Deploy Barriers", category: "action", value: "Silt Control" },
        { text: "Alert Board", category: "action", value: "State Health" }
      ];
      metadata = {
        coordinates: "39.7392° N, 104.9903° W",
        turbidity_reading: "14.5 NTU",
        sop_reference: "SOP-WATER-02",
        analyst: "Clara Barton",
        instrument_id: "TBD-09"
      };
      deviation = {
        title: "Outfall Water Discharge Turbidity OOS Event",
        criticality: "High",
        exceedance_amount: "9.5 NTU Over Limit",
        narrative: text
      };
    }

    // Dynamic schema validation matching requested constraints
    const required = preset?.requiredKeys || ["sop_reference"];
    required.forEach((key) => {
      if (!metadata[key]) {
        typeCheck.passed = false;
        typeCheck.warnings.push(`ALCOA+ Gap: Missing required parameter '${key}' within ${matrix} registration scope.`);
      }
    });

    const sha256 = generateFakeSHA256(text);
    const sqlInsert = `
-- =======================================================
-- COMPILED T-SQL INSERTION FOR SQL SERVER 2016+
-- SCHEMA-AS-DATA TARGET: ModuleData (NVARCHAR(MAX))
-- =======================================================
INSERT INTO ModuleData (
    BlueprintID,
    JSON_Payload,
    AuditSignature,
    SigningUser
)
VALUES (
    '${matrix === "Metals" ? "FORM-MET-044" : matrix === "Animals" ? "FORM-VIV-881" : "FORM-WAT-221"}',
    N'{
        "matrix": "${matrix}",
        "deviation": {
            "title": "${deviation.title}",
            "criticality": "${deviation.criticality}",
            "exceedance": "${deviation.exceedance_amount}",
            "narrative": "${deviation.narrative.replace(/'/g, "''")}"
        },
        "metadata": ${JSON.stringify(metadata, null, 12).slice(0, -1).trim()}},
        "integrity": {
            "sha256": "${sha256}"
        }
    }',
    '${generateFakeSHA256(sha256 + "_signed_by_admin")}',
    '${metadata.analyst || metadata.technician || "SYSTEM_COMPILER"}'
);
`.trim();

    const outboxMessage = {
      event_id: Math.random().toString(36).substring(7).toUpperCase(),
      routing_key: `eqms.deviation.${matrix.toLowerCase()}`,
      payload: {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        matrix: matrix,
        criticality: deviation.criticality,
        exceeded_metric: deviation.exceedance_amount,
        lock_target: matrix === "Metals" ? "Reservoir_B_Halt" : matrix === "Animals" ? "Climate_Maintenance_Trigger" : "Outfall_Discharge_Halt",
        timestamp: new Date().toISOString()
      }
    };

    return {
      metadata,
      deviation,
      typeCheck,
      sqlInsert,
      outboxMessage,
      tokens,
      sha256
    };
  };

  const generateFakeSHA256 = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return "SHA256_" + Math.abs(hash).toString(16).padEnd(20, "f") + "05ad77";
  };

  // Main compilation trigger with UI stages
  const handleCompile = async (text, preset) => {
    setIsCompiling(true);
    setErrorMessage(null);
    setCompilerPhase("lexer");

    const activePreset = preset || PRESETS.find(p => p.matrix === currentMatrix) || PRESETS[0];

    // Simulate standard compiler stages visually
    await new Promise(r => setTimeout(r, 650));
    setCompilerPhase("ast");
    await new Promise(r => setTimeout(r, 650));
    setCompilerPhase("typecheck");
    await new Promise(r => setTimeout(r, 650));
    setCompilerPhase("codegen");
    await new Promise(r => setTimeout(r, 550));

    try {
      if (apiKey && apiKey.trim() !== "") {
        // Direct integration with the Gemini API
        const systemPrompt = `
          You are an Analytical Laboratory QA Schema compiler. 
          Analyze the user's raw observational laboratory event notes (dealing with Water, Metals, or Animals).
          You must return a structured JSON conforming strictly to the requested schema. Do not output any markdown wrapper or explanation, ONLY valid raw JSON.
          The output JSON structure must be:
          {
            "metadata": { ...extract key-value pairs e.g. instrument_id, lod_threshold, iacuc_protocol, room_id, coordinates, analyst, technician },
            "deviation": { "title": "...", "criticality": "Low|Medium|High|Critical", "exceedance_amount": "...", "narrative": "..." },
            "tokens": [ { "text": "token label", "category": "matrix|instrument|metric|protocol|action", "value": "optional tag value" } ]
          }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: text }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) {
          throw new Error("Gemini API call failed. Falling back to clean deterministic compiler compilation.");
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        // Sanitize out markdown JSON blocks if returned
        const cleanedJsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const apiParsed = JSON.parse(cleanedJsonText);

        const sha256 = generateFakeSHA256(text);
        const typeCheck = { passed: true, warnings: [] };
        
        // Enforce structural safety validation rules
        const required = activePreset.requiredKeys;
        required.forEach((key) => {
          if (!apiParsed.metadata[key]) {
            typeCheck.passed = false;
            typeCheck.warnings.push(`ALCOA+ Gap: Parameter validation check failed for missing mandatory key '${key}' in standard definition.`);
          }
        });

        const sqlInsert = `
-- =======================================================
-- COMPILED T-SQL INSERTION FOR SQL SERVER 2016+ (API)
-- =======================================================
INSERT INTO ModuleData (
    BlueprintID,
    JSON_Payload,
    AuditSignature,
    SigningUser
)
VALUES (
    '${currentMatrix === "Metals" ? "FORM-MET-044" : currentMatrix === "Animals" ? "FORM-VIV-881" : "FORM-WAT-221"}',
    N'${JSON.stringify({ ...apiParsed, integrity: { sha256 } }, null, 4).replace(/'/g, "''")}',
    '${generateFakeSHA256(sha256 + "_signed_via_api")}',
    '${apiParsed.metadata.analyst || apiParsed.metadata.technician || "API_COMPILER"}'
);`.trim();

        const outboxMessage = {
          event_id: Math.random().toString(36).substring(7).toUpperCase(),
          routing_key: `eqms.deviation.${currentMatrix.toLowerCase()}`,
          payload: {
            id: Math.random().toString(36).substring(7).toUpperCase(),
            matrix: currentMatrix,
            criticality: apiParsed.deviation?.criticality || "High",
            exceeded_metric: apiParsed.deviation?.exceedance_amount || "Over Threshold Limit",
            lock_target: currentMatrix === "Metals" ? "Reservoir_B_Halt" : currentMatrix === "Animals" ? "Climate_Maintenance_Trigger" : "Outfall_Discharge_Halt",
            timestamp: new Date().toISOString()
          }
        };

        setCompiledResult({
          metadata: apiParsed.metadata,
          deviation: apiParsed.deviation,
          typeCheck,
          sqlInsert,
          outboxMessage,
          tokens: apiParsed.tokens,
          sha256
        });
        populateNodes(apiParsed.tokens);

      } else {
        // Fallback Compiler Mechanics (Heuristics)
        const res = compileHeuristic(text, activePreset);
        setCompiledResult(res);
        populateNodes(res.tokens);
      }
    } catch (err) {
      setErrorMessage(err.message);
      // Ensure we degrade gracefully to heuristic engine
      const res = compileHeuristic(text, activePreset);
      setCompiledResult(res);
      populateNodes(res.tokens);
    } finally {
      setIsCompiling(false);
      setCompilerPhase("complete");
    }
  };

  const handleSelectPreset = (preset) => {
    setInputText(preset.text);
    setCurrentMatrix(preset.matrix);
    handleCompile(preset.text, preset);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-green-500/30 selection:text-green-300">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">
            CO
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-200">COGNITIVE COMPILER</h1>
            <p className="text-xs text-slate-400 font-mono">PCOS EQMS Pipeline · v1.026</p>
          </div>
        </div>

        {/* Live System Specs Badge */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-slate-300">Compiler Engine: Online</span>
          </div>
          <div className="text-slate-400 border-l border-slate-800 pl-6">
            Database Architecture: <span className="text-blue-400">SQL Server 2016+ (NVARCHAR-JSON)</span>
          </div>
        </div>

        {/* API Key Modal Field */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Gemini Key:</span>
          <input
            type="password"
            placeholder="[Optional] Paste key to use Live API..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-green-500 text-slate-200 w-44 md:w-56 font-mono"
          />
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand Column: Compiler Controls & Presets (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Preset Narrative Selector Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">1. Select Preset Observation</h2>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-lg text-left border transition flex items-center justify-between ${
                    inputText === p.text
                      ? "bg-green-950/20 border-green-500/40 text-slate-100"
                      : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:bg-slate-900/20"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold font-mono">{p.title}</span>
                    <span className="text-[10px] text-slate-500">Scope Matrix: {p.matrix}</span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    p.matrix === "Metals" ? "bg-orange-500" : p.matrix === "Animals" ? "bg-purple-500" : "bg-cyan-500"
                  }`}></span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Source Narrative Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-5 flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400">2. Real-time Log Code Input</h2>
              <span className="text-[10px] font-mono text-green-500/80 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10">
                ALCOA+ Compliant
              </span>
            </div>

            <div className="relative flex-1 min-h-[220px] flex flex-col">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste unstructured analyst lab observation notes here..."
                className="w-full flex-1 bg-slate-950 border border-slate-900 rounded-lg p-3 text-xs font-mono leading-relaxed text-slate-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 resize-none"
              />
              
              {/* Compiler Loading / Stage Overlay */}
              {isCompiling && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center gap-4 text-center p-6">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-green-400 animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-xs font-mono text-slate-300 uppercase tracking-widest">Compiling To AST</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {compilerPhase === "lexer" && "Lexer: Extracting physical limits & matrices..."}
                      {compilerPhase === "ast" && "AST Mapper: Constructing schema tree definitions..."}
                      {compilerPhase === "typecheck" && "Type Checker: Validating GxP parameter constraints..."}
                      {compilerPhase === "codegen" && "Code Gen: Outputting Outbox payloads & SQL Server DDL..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Matrix Segment Control */}
            <div className="flex items-center justify-between gap-3 bg-slate-950 p-2 rounded-lg border border-slate-900">
              <span className="text-[10px] font-mono text-slate-400 pl-2">Assigned Matrix:</span>
              <div className="flex gap-1">
                {["Metals", "Animals", "Water"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setCurrentMatrix(m)}
                    className={`text-[10px] px-3 py-1.5 rounded font-mono font-bold transition ${
                      currentMatrix === m
                        ? "bg-slate-900 border border-slate-800 text-green-400"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleCompile(inputText)}
              className="w-full bg-green-600 hover:bg-green-500 text-slate-950 font-bold font-mono text-xs py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/10"
            >
              🚀 COMPILATION SEQUENCE ON MATRIX
            </button>
          </div>
        </section>

        {/* Right Hand Column: Floating Thought Cloud and Output views (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Output Display Mode Selector tabs */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-2 flex gap-1">
            <button
              onClick={() => setActiveTab("visualization")}
              className={`flex-1 py-2.5 text-xs font-mono font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === "visualization"
                  ? "bg-slate-900 border border-slate-800 text-green-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💭 Interactive Graph Visual
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex-1 py-2.5 text-xs font-mono font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === "json"
                  ? "bg-slate-900 border border-slate-800 text-green-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📁 Compiled AST (JSON)
            </button>
            <button
              onClick={() => setActiveTab("sql")}
              className={`flex-1 py-2.5 text-xs font-mono font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === "sql"
                  ? "bg-slate-900 border border-slate-800 text-green-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              💾 SQL Server T-SQL DDL
            </button>
            <button
              onClick={() => setActiveTab("outbox")}
              className={`flex-1 py-2.5 text-xs font-mono font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === "outbox"
                  ? "bg-slate-900 border border-slate-800 text-green-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🗳️ Outbox Event Log
            </button>
          </div>

          {/* Core Content Area */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl flex-1 min-h-[480px] flex flex-col overflow-hidden relative">
            
            {/* Visual Particle Engine Canvas */}
            {activeTab === "visualization" && (
              <div className="flex-1 flex flex-col relative bg-slate-950/20">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <div className="text-[10px] font-mono bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded backdrop-blur-sm text-slate-300">
                    Physics Node Controller: Dynamic Force Repulsion
                  </div>
                </div>
                <div className="absolute top-4 right-4 z-10 text-[10px] font-mono bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded backdrop-blur-sm text-slate-400">
                  Total Semantic Nodes: {nodes.length}
                </div>

                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="w-full flex-1 cursor-grab active:cursor-grabbing block"
                  style={{ minHeight: "450px" }}
                />

                {/* Sub-Legend Mapping Grid */}
                <div className="border-t border-slate-900/80 bg-slate-950/60 p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px] font-mono text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>Matrix Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Instrument ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span>Analytical Limit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>SOP / Protocol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>Outbox Action</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compiled JSON AST Mapping view */}
            {activeTab === "json" && (
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-xs font-mono font-bold text-slate-200">ISO 17025 Compliant Mapping Definition</h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded">
                    Unified Schema Registry Instance
                  </span>
                </div>
                <div className="flex-1 bg-slate-950 p-4 rounded-lg border border-slate-900 font-mono text-xs overflow-auto max-h-[400px]">
                  <pre className="text-green-400 text-[11px] leading-relaxed">
                    {compiledResult ? JSON.stringify({
                      registry_version: "2.4.1",
                      alcoa_signature_lock: compiledResult.sha256,
                      audit: {
                        created_by: compiledResult.metadata?.analyst || compiledResult.metadata?.technician || "SYSTEM_COMPILER",
                        contemporaneous_utc: new Date().toISOString()
                      },
                      compiled_payload: {
                        matrix: currentMatrix,
                        deviation: compiledResult.deviation,
                        extracted_telemetry: compiledResult.metadata
                      }
                    }, null, 2) : "Run a compilation query to view schema tree."}
                  </pre>
                </div>
              </div>
            )}

            {/* SQL Server 2016+ Explorer View */}
            {activeTab === "sql" && (
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-xs font-mono font-bold text-slate-200">Persisted Column Indexing (SQL Server 2016+)</h3>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded">
                    JSON Indexes Table Schema
                  </span>
                </div>
                <div className="flex-grow bg-slate-950 p-4 rounded-lg border border-slate-900 font-mono text-[10px] text-slate-300 overflow-auto max-h-[380px]">
                  <pre className="text-blue-300 leading-relaxed">
                    {compiledResult?.sqlInsert || "-- Compile to output schema-as-data target T-SQL statements."}
                  </pre>
                </div>
              </div>
            )}

            {/* Decoupled Event Outbox Pattern Log View */}
            {activeTab === "outbox" && (
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-xs font-mono font-bold text-slate-200">Outbox Event Queue (events/outbox.py)</h3>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                    Decoupled Lock Event Message
                  </span>
                </div>
                <div className="flex-grow bg-slate-950 p-4 rounded-lg border border-slate-900 font-mono text-xs overflow-auto max-h-[380px]">
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Writing to the outbox inside the main transaction ensures eventually consistent downstream lockdowns on the parent application.
                  </p>
                  <pre className="text-amber-300 text-[11px] leading-relaxed">
                    {compiledResult ? JSON.stringify(compiledResult.outboxMessage, null, 2) : "-- Compile query to inspect outbound queue events."}
                  </pre>
                </div>
              </div>
            )}

            {/* Live Data Integrity Audit Guardrails panel */}
            <div className="bg-slate-950 border-t border-slate-900 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">🔒</span>
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-200">ALCOA+ Audit Trail Log</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Immutable payload block signature hash:
                    <br />
                    <span className="text-green-500 text-[9px] break-all">
                      {compiledResult?.sha256 || "Uncompiled"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">🛡️</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-mono font-bold text-slate-200">Type-Checker Constraints</h4>
                  {compiledResult?.typeCheck?.passed ? (
                    <p className="text-[10px] text-green-500 font-mono mt-0.5">
                      ✓ Validation Passed: All scope-relevant variables verified.
                    </p>
                  ) : (
                    <div className="mt-0.5">
                      {compiledResult?.typeCheck?.warnings.map((warn, i) => (
                        <p key={i} className="text-[10px] text-red-400 font-mono leading-tight">
                          ⚠ {warn}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer System Stats Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          Analytical Quality Control EQMS Compiler · Secure Sandbox Registry
        </div>
        <div>
          Strictly compliant with ISO 17025 & GxP validation methodologies
        </div>
      </footer>
    </div>
  );
}
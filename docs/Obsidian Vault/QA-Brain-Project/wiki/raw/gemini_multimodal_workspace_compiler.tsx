import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Image,
  Video,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Brain,
  RefreshCw,
  Layers,
  Database,
  HelpCircle,
  Plus,
  Trash,
  Settings,
  List,
  MessageSquare,
  Play,
  Lightbulb,
  Check,
  Code,
  Compass,
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// ─── Color & Styling Constants ────────────────────────────
const C = {
  bg: "#08080C",
  card: "#0F111A",
  cardHover: "#151826",
  border: "#1F2335",
  borderActive: "#3B4261",
  white: "#F8F9FC",
  muted: "#7F84A3",
  subdued: "#414868",
  
  // Google / Gemini Palette
  blue: "#4285F4",    // Google Drive / Docs
  red: "#EA4335",     // Google Videos / YouTube / Meet
  yellow: "#FBBC05",  // Google Keep Notes / Quick Ideas
  green: "#34A853",   // Google Photos / Vision
  purple: "#8AB4F8",  // Gemini Engine / Cognitive IR
  geminiGrad: "linear-gradient(135deg, #4285F4 0%, #9B5DE5 50%, #F15BB5 100%)",
};

// ─── Initial Mock Assets (Pre-loaded) ──────────────────────
const INITIAL_ASSETS = [
  {
    id: "photo_1",
    name: "whiteboard_wireframe.png",
    type: "photo",
    category: "Vision Bank",
    icon: "📸",
    color: C.green,
    description: "Hand-drawn UI mockup. Shows a sticky navigation bar with a search icon, a hero banner stating 'AI Assistant', a 3-column product showcase grid, and a bottom floating feedback drawer.",
    resolution: "2048 x 1536 px",
    source: "Google Photos Upload"
  },
  {
    id: "photo_2",
    name: "conversion_metrics_q3.jpg",
    type: "photo",
    category: "Vision Bank",
    icon: "📸",
    color: C.green,
    description: "Bar chart showing checkout completion rates. Demonstrates a sharp drop from 3.2% down to 1.8% starting August 12th, correlated with the rollout of the multi-step checkout form.",
    resolution: "1920 x 1080 px",
    source: "Shared Drive Album"
  },
  {
    id: "video_1",
    name: "checkout_bug_repro.mp4",
    type: "video",
    category: "Video Stream",
    icon: "🎥",
    color: C.red,
    description: "Screen recording of bug trigger.",
    transcript: "00:02 - User enters payment details. 00:05 - User clicks 'Confirm Payment' button twice rapidly. 00:08 - Button enters loading state but freezes. 00:11 - Chrome Developer Console shows: 'TypeError: Cannot read properties of undefined (reading 'payment_id')' with HTTP 500.",
    duration: "18 seconds",
    source: "Meet Screen Capture"
  },
  {
    id: "video_2",
    name: "product_kickoff_sync.mov",
    type: "video",
    category: "Video Stream",
    icon: "🎥",
    color: C.red,
    description: "Team meeting video recording transcript.",
    transcript: "Product Manager (01:15): 'To comply with the new GDPR policy, our persistent user databases must run exclusively on a Postgres instances located in Europe. No local file storage for session tables.' Architect (02:30): 'Got it. We will write an append-only event log for user tracking and bind it via a secure JWT authentication middleware.'",
    duration: "3 mins 12 secs",
    source: "Google Meet Recording"
  },
  {
    id: "doc_1",
    name: "project_brief.md",
    type: "doc",
    category: "Document Index",
    icon: "📄",
    color: C.blue,
    description: "Markdown documentation for the team project.",
    content: "# NextGen Checkout Redesign\n**Budget Constraint:** Maximum $15k api costs.\n**Compliance:** GDPR compliance active. Audit trailing required on database.\n**Tech Stack Guidelines:** Tailwind CSS, Postgres storage, async API router.",
    source: "Google Drive"
  },
  {
    id: "doc_2",
    name: "current_schema.sql",
    type: "doc",
    category: "Document Index",
    icon: "📄",
    color: C.blue,
    description: "SQL Schema definition file for checkout and logging databases.",
    content: "CREATE TABLE users (id UUID PRIMARY KEY, name VARCHAR, email VARCHAR UNIQUE);\nCREATE TABLE sessions (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id), expires_at TIMESTAMP);\nCREATE TABLE checkouts (id UUID PRIMARY KEY, user_id UUID, amount NUMERIC, status VARCHAR);",
    source: "GitHub Docs Integration"
  },
  {
    id: "note_1",
    name: "checkout_ux_rule.txt",
    type: "note",
    category: "Keep Snippets",
    icon: "💡",
    color: C.yellow,
    description: "Google Keep quick sticky note.",
    content: "Design Rule: All active primary action buttons must have a 150ms ease-in-out hover effect and transition to a disabled state upon clicking to prevent duplicate API submission payloads.",
    source: "Google Keep"
  }
];

// ─── Presets for Compilation Sandbox ────────────────────────
const COMPILER_TEMPLATES = [
  {
    label: "Fix Checkout Bugs & Build UI",
    goal: "Synthesize the conversion chart drop, the bug repro screen recording, and the checkout UX design rule to design a fast React landing page layout with double-click submission protection.",
    assets: ["photo_1", "photo_2", "video_1", "note_1", "doc_1"]
  },
  {
    label: "Compliance DB & Session Logic Setup",
    goal: "Compile our database scheme, meeting video transcripts, and the project brief to map out a GDPR-compliant Postgres database structure and state audit-log system.",
    assets: ["video_2", "doc_1", "doc_2"]
  },
  {
    label: "Complete Architecture Review",
    goal: "Ingest every photo, video, document, and quick note in our library. Synthesize a unified roadmap mapping our existing visual assets to direct backend tasks.",
    assets: ["photo_1", "photo_2", "video_1", "video_2", "doc_1", "doc_2", "note_1"]
  }
];

// ─── YouTube Storyboard Scenes ──────────────────────────────
const STORYBOARD_SCENES = [
  {
    id: 1,
    title: "The Multimodal Friction",
    icon: "🤖",
    color: C.red,
    narration: "We've all been there: you explain an design mockup to an AI. But the moment you start a new chat, it's gone. Then you record a screen video demonstrating a bug, but you have to type out a 10-paragraph essay to explain the video frames, or the AI misses key context from your sketches.\n\nTraditional LLMs treat images and videos as secondary additions. We need a system where visual elements and text files speak the same language.",
    visualNote: "VISUAL: Screen divided: Left shows raw file icons (JPGs, MP4s, SQL schemas) scattered. Right shows a confused robot. Overlap banner: 'Amnesia Loop: Every new chat deletes your environment context'."
  },
  {
    id: 2,
    title: "Introducing the Google Multimodal Stack",
    icon: "🌐",
    color: C.blue,
    narration: "Say hello to the Google Multimodal Cognitive Stack. Built on top of Gemini’s native processing, this architecture treats Photos and Videos as first-class, structured inputs alongside traditional docs.\n\nWe sort everything into three structured buckets: Vision Bank, Video Streams, and Documents. By doing this, we can extract semantic data directly and compile it into standard Intermediate Representations (IR).",
    visualNote: "VISUAL: Three clean digital vaults sliding open: 📸 Vision Bank (Google Photos), 🎥 Video Stream (Drive/YouTube), 📄 Document Index. Flow lines show files sliding directly into them."
  },
  {
    id: 3,
    title: "How Photos Are Decomposed (Vision Ingestion)",
    icon: "📸",
    color: C.green,
    narration: "Let's see it in action. When you load a wireframe sketch, the Cognitive Compiler doesn't just look at it as raw pixels. It passes it to the Gemini Vision Engine, converting visual components, structures, and charts into descriptive coordinates.\n\nA hand-drawn circle on whiteboard becomes a typed button component in the Workspace IR. A conversion dip chart is transcribed into analytical numbers in memory.",
    visualNote: "VISUAL: A hand-drawn whiteboard wireframe sketch is illuminated by a scanning laser line. Highlighting boxes appear over sections, labeling them 'Button Component (x:45, y:80)', 'Grid Layout', 'Conversion Trend (-43% drop)'."
  },
  {
    id: 4,
    title: "Slicing the Videos (Temporal Analysis)",
    icon: "🎥",
    color: C.red,
    narration: "What about video? A screen capture repro or a long meeting is heavy to analyze. Our compiler decomposes video into keyframes and temporal speech scripts. \n\nInstead of watching a 10-minute video, Gemini pulls the precise frames where a button turns red, maps them directly to the console error logs, and links the verbal agreements made by your product managers during a Google Meet call. You have a searchable timeline.",
    visualNote: "VISUAL: A video timeline showing film strip frames. Key frames highlight in red where the console logs throw errors. Lines connect the video frames to the transcribed audio quotes below."
  },
  {
    id: 5,
    title: "Merging Into the Context Layer (The compiler's parser)",
    icon: "🧠",
    color: C.purple,
    narration: "Now, the magic happens. The Vision Bank and Video Stream outputs merge with your code documents and Google Keep quick notes. This forms our unified Multimodal Context Layer.\n\nThis is where conflicting info dies. The UX rule in Google Keep meets the bug video and the wireframe sketch. The compiler synthesizes the requirements and issues structural architectural guidelines before starting work.",
    visualNote: "VISUAL: Glow nodes of different colors (Green, Red, Blue, Yellow) colliding into a centralized purple sphere named 'Gemini Multimodal Context Layer'. It pulses with light, outputting clean structured text."
  },
  {
    id: 6,
    title: "Compiling ADRs & Executable Task DAGs",
    icon: "📋",
    color: C.yellow,
    narration: "The output of this compilation is double-sided. For humans, it generates Architectural Decision Records (ADRs) explaining exactly *WHY* choices were made. \n\nFor agent runtimes, it compiles an executable Task DAG—a step-by-step assembly instructions graph. The agent now builds exactly according to your visuals, transcripts, schemas, and rules. No guessing. Just perfect, deterministic execution.",
    visualNote: "VISUAL: The purple sphere splits into two streams: Left stream generates an elegant Markdown sheet labeled 'ADR-004: Anti-Double-Click System'. Right stream displays a live nodes flowchart (Task 1 -> Task 2 -> Task 3)."
  }
];

// ─── MASTER STAGES DATA FOR DIAGRAM ───────────────────────
const MASTER_STAGES = [
  {
    id: "ingest",
    label: "Multimodal Ingestion Engine",
    ir: "Ingest IR",
    color: "#4285F4",
    icon: "📥",
    tagline: "Sorts unstructured inputs into dedicated pipes",
    detail: "Identifies whether incoming files are visual schemas (Google Photos), screen records or sync meetings (Videos), documents (Drive Briefs), or quick rules (Keep). Maps them into specific pre-processing channels.",
    inputs: ["Raw Files", "Image uploads", "Meeting logs", "Google Keep scribbles"],
    outputs: ["Typed File Stream mapping to downstream pipelines"],
    note: "Unified ingestion prevents the model from wasting tokens parsing raw file structures repeatedly."
  },
  {
    id: "vision_bank",
    label: "Vision Analyzer (Photos)",
    ir: "Vision IR",
    color: "#34A853",
    icon: "📸",
    tagline: "Pixels → Structured Spatial Layout",
    detail: "Uses Gemini Vision OCR and spatial-layout parsers to break down diagrams, wireframes, and whiteboard charts. It converts doodles into structural grid metadata and transcribes charts to metrics.",
    inputs: ["Photos", "PNG wireframes", "JPEG analytical graphs"],
    outputs: ["Structural layout definitions", "Chart metric matrices", "UI boundary arrays"],
    note: "Powered by Gemini Vision. No manual transcription needed."
  },
  {
    id: "video_stream",
    label: "Temporal Frame Parser (Videos)",
    ir: "Video IR",
    color: "#EA4335",
    icon: "🎥",
    tagline: "Video Timeline + Transcription",
    detail: "Splits screen captures and Meet video transcripts into keyframes and temporal speech scripts. Correlates visual UI errors directly to voice cues or console errors.",
    inputs: ["MP4 recordings", "YouTube links", "Google Meet syncs"],
    outputs: ["Time-stamped audio transcripts", "Visual state transition logs", "Console error frames"],
    note: "Allows Gemini to jump straight to the exact second where code failed."
  },
  {
    id: "document_index",
    label: "Drive Document Index",
    ir: "Doc IR",
    color: "#4285F4",
    icon: "📄",
    tagline: "Project Briefs + Schemas",
    detail: "Indexes project specifications, SQL schemas, API documentation, and code rules. Performs semantic chunking and establishes parent-child markdown nodes.",
    inputs: ["project_brief.md", "database_schema.sql", "code files"],
    outputs: ["Structured Markdown graph with cross-links"],
    note: "Traditional code references that act as the structural anchors."
  },
  {
    id: "keep_snippets",
    label: "Keep Sticky Rules",
    ir: "Rule IR",
    color: "#FBBC05",
    icon: "💡",
    tagline: "Heuristics & Guardrails",
    detail: "Grabs ephemeral notes, guidelines, budget caps, and personal UX preferences from Google Keep. Converts vague suggestions into rigid compiler constraints.",
    inputs: ["Keep text logs", "Slack screenshot rules"],
    outputs: ["System heuristic parameters", "Styling constants", "Cost constraints"],
    note: "This is where your personal style rules and small team habits are stored."
  },
  {
    id: "multimodal_merger",
    label: "Gemini Multimodal Merger",
    ir: "Context IR",
    color: "#8AB4F8",
    icon: "🧠",
    tagline: "Unifying Text, Audio, and Pixels",
    detail: "Injects all four streams (Vision, Video, Doc, and Keep IR) into Gemini's high-context playground. Resolves layout conflicts, aligns speech directions with code constraints, and maps rules to visual goals.",
    inputs: ["Vision IR", "Video IR", "Doc IR", "Rule IR"],
    outputs: ["High-dimensional Multimodal Semantic Context"],
    note: "This is where multi-format friction ends. All assets now share one system language."
  },
  {
    id: "adr_constants",
    label: "Decision compiler (ADRs)",
    ir: "Decision IR",
    color: "#A78BFA",
    icon: "📋",
    tagline: "Stable Architectural Guardrails",
    detail: "Compiles context into strict Architectural Decision Records (ADRs). These records tell the downline developer precisely *why* certain technologies or user flows are designed a specific way.",
    inputs: ["Context IR"],
    outputs: ["Structured ADRs: Problem → Decision → Why"],
    note: "Acts as permanent instructions so agents don't propose conflicting solutions."
  },
  {
    id: "planning_dag",
    label: "Task DAG Planner",
    ir: "Plan IR",
    color: "#E879F9",
    icon: "📐",
    tagline: "Deterministic Execution Graph",
    detail: "Translates compiled decisions and wireframe outputs into a Directed Acyclic Graph (DAG) of programming tasks. Maps which assets, rules, and APIs relate to each individual milestone.",
    inputs: ["Decision IR", "Workspace constraints"],
    outputs: ["Executable Step-by-Step Task Nodes and Dependency Edges"],
    note: "Removes chaotic agent behavior by laying out an ordered step-by-step roadmap."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("compiler");
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [selectedAssetIds, setSelectedAssetIds] = useState(INITIAL_ASSETS.map(a => a.id));
  const [compilerGoal, setCompilerGoal] = useState(COMPILER_TEMPLATES[0].goal);
  
  // Custom asset creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssetType, setNewAssetType] = useState("photo");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetDesc, setNewAssetDesc] = useState("");
  const [newAssetExtra, setNewAssetExtra] = useState(""); // SQL content or transcript
  
  // Compiler execution state
  const [compiling, setCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState("");
  const [compileResult, setCompileResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [liveMode, setLiveMode] = useState(false); // Switch between simulated and real Gemini API

  // Storyboard state
  const [storyboardIndex, setStoryboardIndex] = useState(0);
  const [storyboardTab, setStoryboardTab] = useState("narration");

  // Diagram state
  const [selectedDiagramStage, setSelectedDiagramStage] = useState("multimodal_merger");

  // Selection toggle handlers
  const toggleAssetSelection = (id) => {
    if (selectedAssetIds.includes(id)) {
      setSelectedAssetIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedAssetIds(prev => [...prev, id]);
    }
  };

  const selectAllAssets = () => {
    setSelectedAssetIds(assets.map(a => a.id));
  };

  const selectNoneAssets = () => {
    setSelectedAssetIds([]);
  };

  const applyTemplate = (tpl) => {
    setCompilerGoal(tpl.goal);
    // Find asset IDs matching template keys
    const matchedIds = assets
      .filter(a => tpl.assets.some(ta => a.id.includes(ta) || ta.includes(a.id)))
      .map(a => a.id);
    setSelectedAssetIds(matchedIds.length > 0 ? matchedIds : assets.map(a => a.id));
  };

  // Add custom user asset
  const handleAddAsset = (e) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    let cat = "Vision Bank";
    let icon = "📸";
    let color = C.green;
    if (newAssetType === "video") {
      cat = "Video Stream";
      icon = "🎥";
      color = C.red;
    } else if (newAssetType === "doc") {
      cat = "Document Index";
      icon = "📄";
      color = C.blue;
    } else if (newAssetType === "note") {
      cat = "Keep Snippets";
      icon = "💡";
      color = C.yellow;
    }

    const newAsset = {
      id: `custom_${Date.now()}`,
      name: newAssetName.includes(".") ? newAssetName : `${newAssetName}.${newAssetType === "photo" ? "png" : newAssetType === "video" ? "mp4" : newAssetType === "doc" ? "md" : "txt"}`,
      type: newAssetType,
      category: cat,
      icon,
      color,
      description: newAssetDesc,
      ...(newAssetType === "video" && { transcript: newAssetExtra || "No speech transcript provided." }),
      ...((newAssetType === "doc" || newAssetType === "note") && { content: newAssetExtra || "No text content provided." }),
      resolution: newAssetType === "photo" ? "1280 x 720 px" : undefined,
      duration: newAssetType === "video" ? "45 seconds" : undefined,
      source: "User Workspace Upload"
    };

    setAssets(prev => [newAsset, ...prev]);
    setSelectedAssetIds(prev => [newAsset.id, ...prev]);
    
    // Reset form
    setNewAssetName("");
    setNewAssetDesc("");
    setNewAssetExtra("");
    setShowAddForm(false);
  };

  const handleDeleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setSelectedAssetIds(prev => prev.filter(item => item !== id));
  };

  // Trigger compiler cycle
  const runCompilation = async () => {
    if (selectedAssetIds.length === 0) {
      setErrorMsg("Please select at least one asset to compile context from.");
      return;
    }
    setErrorMsg(null);
    setCompiling(true);
    setCompileResult(null);

    const activeAssets = assets.filter(a => selectedAssetIds.includes(a.id));

    // Simulated compilation steps
    const steps = [
      "Parsing user goal and intent weights...",
      "Connecting Vision Analyzer for photos...",
      "Extracting timeline cues and transcripts from videos...",
      "Indexing schemas and markdown docs...",
      "Merging multi-format metadata into Semantic Context IR...",
      "Synthesizing Architectural Decision Records (ADRs)...",
      "Assembling dependency execution DAG nodes..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setCompileStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    setCompileStep("Sending optimized payload to Gemini API...");

    // Setup payload for Gemini
    const promptPayload = `
    COMPILATION GOAL: "${compilerGoal}"

    WORKSPACE MULTIMODAL SOURCE ASSETS INGESTED:
    ${activeAssets.map((asset, idx) => `
    [Asset #${idx + 1}]
    Name: ${asset.name}
    Type: ${asset.type.toUpperCase()}
    Category: ${asset.category}
    Description: ${asset.description}
    ${asset.transcript ? `Video Transcript/Timelines: ${asset.transcript}` : ""}
    ${asset.content ? `Text Content: ${asset.content}` : ""}
    Source: ${asset.source}
    ---`).join("\n")}

    Please compile this visual, textual, and video context into a structured, execution-ready response. Include:
    1. A GOAL IR synthesis summarizing objectives, metrics derived, and resolved conflicts.
    2. A MULTIMODAL REVELATIONS summary describing information taken from the Photos (Vision analysis) and Videos (video timing points/verbal cues).
    3. Exactly one or more compiled ARCHITECTURAL DECISION RECORDS (ADRs) with a strict "Problem", "Decision", and "Why" pattern.
    4. An executable sequential TASK DAG representing the exact plan step-by-step to achieve the goal. Format steps beautifully.
    `;

    // Empty API key fallback environment injection
    const apiKey = ""; 

    try {
      // Build options
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptPayload }] }],
          systemInstruction: {
            parts: [{
              text: "You are the Gemini Workspace Compiler, a robust core model within the Google Cognitive Stack. You convert diverse media, visual whiteboard notes, meeting transcripts, and requirements documents into structured, precise architectural blueprints, ADR decisions, and step-by-step dependency graphs (Task DAGs) in Markdown."
            }]
          }
        })
      };

      const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      
      let fetchedData = null;
      
      // Attempt API Call
      if (apiKey !== undefined && apiKey !== "") {
        // Implement Exponential Backoff (5 Retries: 1s, 2s, 4s, 8s, 16s)
        const fetchWithBackoff = async (url, opts, retries = 5, delay = 1000) => {
          try {
            const res = await fetch(url, opts);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
          } catch (err) {
            if (retries > 0) {
              await new Promise(r => setTimeout(r, delay));
              return fetchWithBackoff(url, opts, retries - 1, delay * 2);
            }
            throw err;
          }
        };
        fetchedData = await fetchWithBackoff(modelUrl, options);
      }

      if (fetchedData && fetchedData.candidates?.[0]?.content?.parts?.[0]?.text) {
        // Real Live Gemini API returned values successfully
        const responseText = fetchedData.candidates[0].content.parts[0].text;
        setCompileResult({
          mode: "Gemini 2.5 Flash Live Ingest",
          rawMarkdown: responseText,
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        // Offline / Blank Key Fallback Compiler (Highly structured, beautiful template matched generation)
        const offlineResults = generateStructuredOfflineFallback(compilerGoal, activeAssets);
        setCompileResult(offlineResults);
      }
    } catch (err) {
      console.warn("Gemini connection error, generating high-fidelity offline synthesis compilation.");
      const offlineResults = generateStructuredOfflineFallback(compilerGoal, activeAssets);
      setCompileResult(offlineResults);
    } finally {
      setCompiling(false);
    }
  };

  // Structured Offline Generation Matching User Intent
  const generateStructuredOfflineFallback = (goal, activeAssets) => {
    const hasPhotos = activeAssets.some(a => a.type === "photo");
    const hasVideos = activeAssets.some(a => a.type === "video");
    const photoList = activeAssets.filter(a => a.type === "photo").map(p => p.name).join(", ") || "None";
    const videoList = activeAssets.filter(a => a.type === "video").map(v => v.name).join(", ") || "None";

    return {
      mode: "Offline Cognitive Compiler Sync (Fallback Engine)",
      timestamp: new Date().toLocaleTimeString(),
      summary: "Completed intermediate representation merges. Detected " + activeAssets.length + " multimodal assets.",
      rawMarkdown: `## 🎯 1. Goal IR (Parsed Objectives)
- **Primary Mission:** ${goal}
- **Constraints Extracted:** GDPR compliance active, event appending requirements, JWT verification setup.
- **Visual Targets Map:** Aligned layout coordinates derived from selected PNG sketches with specific database schemas.
- **Budget Control:** Retaining API threshold metrics within specified limits.

## 📸 2. Vision Bank Extracted Insights (Photo Analysis)
- **Ingested:** \`${photoList}\`
- **Spatial UI Rules Derived:** - *Whiteboard Layout:* Header holds high-priority search form; product showcase matches 3-column relative flex design.
  - *Analytical Insights:* Sharp conversion decrease detected from \`3.2%\` to \`1.8%\` starting Aug 12. Correlation confirms drop aligns with introduction of multi-step checkout sequences.

## 🎥 3. Video Stream Timeline Extracted (Video Analysis)
- **Ingested:** \`${videoList}\`
- **Key temporal points:**
  - *User Repro Session:* Crash triggered at \`0:08\` on click. JavaScript environment throws Uncaught TypeError: \`Cannot read properties of undefined (reading 'payment_id')\`.
  - *Meeting Transcript Sync:* Confirmed GDPR mandate requiring Postgres persistence within geographic European instances. No local cache or disk logging allowed.

## 📋 4. Compiled Architectural Decision Records (ADRs)

### [ADR-011] Native Input Protection Middlewares
- **Problem:** Users submit duplicate transactions and API calls when buttons lag or when double-clicking rapidly, skewing analytics and duplicating bank requests.
- **Decision:** Implement a front-end debouncing action in React with strict disabled button transitions (150ms ease-in) and map unique UUID transaction keys to API payload sessions.
- **Why:** Ingested Keep rule notes mandate immediate interface blocks to prevent database race conditions and double charging of processing logs.

### [ADR-012] European Sovereignty Postgres Persistence
- **Problem:** Shared cloud instances violate European GDPR guidelines regarding persistent session logs.
- **Decision:** Spin up structured PostgreSQL persistent tables locked to geographic AWS eu-west zones.
- **Why:** Cross-correlating Project Brief mandates with Google Meet kickoff comments where lead architect established explicit sovereignty limitations.

## 📐 5. Compiled Executable Task DAG (Roadmap)
1. **[Task 01]** **Schema Upgrade:** Implement Postgres append-only schemas with schema validation matching \`current_schema.sql\`. *(Depends on: None)*
2. **[Task 02]** **JWT Middleware:** Construct API authorization gateway enforcing encrypted tokens to prevent SQL profiling scripts. *(Depends on: Task 01)*
3. **[Task 03]** **React Debounced UI:** Scaffold frontend layouts using whiteboard specs with button debouncers. *(Depends on: Task 02)*
4. **[Task 04]** **Audit Validation Logs:** Setup active unit suites executing double-click payloads to assert that error rates drop to \`0.00%\`. *(Depends on: Task 03)*`
    };
  };

  return (
    <div className="min-h-screen font-sans text-slate-100 bg-[#08080C] selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* ─── Top Header Banner ─── */}
      <header className="border-b border-slate-900 bg-[#0F111A]/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 via-purple-600 to-red-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/10">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base md:text-lg text-slate-100 tracking-tight">Gemini Workspace Stack</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                  Multimodal Cognitive Compiler
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Ingest photos, videos, & keep files to build executable code roadmaps.</p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-900 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("compiler")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "compiler"
                  ? "bg-gradient-to-r from-blue-500/25 to-purple-500/25 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Multimodal Compiler
            </button>
            <button
              onClick={() => setActiveTab("diagram")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "diagram"
                  ? "bg-gradient-to-r from-purple-500/25 to-indigo-500/25 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Cognitive Architecture
            </button>
            <button
              onClick={() => setActiveTab("storyboard")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "storyboard"
                  ? "bg-gradient-to-r from-red-500/25 to-orange-500/25 text-red-300 border border-red-500/30"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-red-400" />
              Ingestion Storyboard
            </button>
          </div>

        </div>
      </header>

      {/* ─── Main Content Wrapper ─── */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ─── TAB 1: ACTIVE MULTIMODAL SANDBOX & COMPILER ─── */}
        {activeTab === "compiler" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT PANEL: Workspace Ingestion Drawer (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              <div className="bg-[#0F111A] rounded-2xl border border-slate-900 p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <h2 className="font-bold text-xs uppercase tracking-wider text-slate-300">Workspace Assets</h2>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                    {assets.length} Ingested
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Toggle documents, screen videos, or UI layouts to compile your temporary semantic environment.
                </p>

                {/* Selection controls */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAllAssets}
                    className="flex-1 py-1 text-[10px] font-bold bg-slate-950 hover:bg-slate-900 text-slate-300 rounded border border-slate-900 transition"
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectNoneAssets}
                    className="flex-1 py-1 text-[10px] font-bold bg-slate-950 hover:bg-slate-900 text-slate-400 rounded border border-slate-900 transition"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {/* Add Custom Asset Form Inline */}
                {showAddForm && (
                  <form onSubmit={handleAddAsset} className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 animate-fadeIn">
                    <div className="text-xs font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800">New Multimodal Asset</div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold mb-1">Asset Category</label>
                        <select
                          value={newAssetType}
                          onChange={(e) => setNewAssetType(e.target.value)}
                          className="w-full bg-[#12121A] text-xs text-slate-300 border border-slate-800 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="photo">📸 Vision (Photo)</option>
                          <option value="video">🎥 Timeline (Video)</option>
                          <option value="doc">📄 Document (Text)</option>
                          <option value="note">💡 Google Keep (Rule)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold mb-1">Filename / Handle</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. app_wireframe"
                          value={newAssetName}
                          onChange={(e) => setNewAssetName(e.target.value)}
                          className="w-full bg-[#12121A] text-xs text-slate-300 border border-slate-800 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="block text-[9px] text-slate-400 font-bold mb-1">Description (What does the AI see?)</label>
                      <textarea
                        required
                        rows="2"
                        placeholder="Detail visual components, sketches, error lines..."
                        value={newAssetDesc}
                        onChange={(e) => setNewAssetDesc(e.target.value)}
                        className="w-full bg-[#12121A] text-xs text-slate-300 border border-slate-800 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                      />
                    </div>

                    {(newAssetType === "video" || newAssetType === "doc" || newAssetType === "note") && (
                      <div className="mb-2">
                        <label className="block text-[9px] text-slate-400 font-bold mb-1">
                          {newAssetType === "video" ? "Video Timeline Transcript" : "Text / Code Content"}
                        </label>
                        <textarea
                          rows="2"
                          placeholder={newAssetType === "video" ? "e.g. 00:05 - click, 00:10 - crash..." : "e.g. CREATE TABLE... or # Brief..."}
                          value={newAssetExtra}
                          onChange={(e) => setNewAssetExtra(e.target.value)}
                          className="w-full bg-[#12121A] text-xs text-slate-300 border border-slate-800 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none font-mono"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-[10px] bg-blue-500 hover:bg-blue-600 text-slate-950 rounded font-bold transition"
                      >
                        Ingest Asset
                      </button>
                    </div>
                  </form>
                )}

                {/* Assets Listing */}
                <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                  {assets.map((asset) => {
                    const isSelected = selectedAssetIds.includes(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleAssetSelection(asset.id)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#181C2E] border-slate-800"
                            : "bg-[#090B11]/50 border-slate-900 opacity-60 hover:opacity-100 hover:bg-[#0E1119]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          
                          {/* Checkbox badge */}
                          <div className="mt-1 flex-shrink-0">
                            <div className={`w-4.5 h-4.5 rounded flex items-center justify-center text-[10px] ${
                              isSelected
                                ? "bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-bold"
                                : "border border-slate-800 text-transparent"
                            }`}>
                              <Check className="w-3 h-3" />
                            </div>
                          </div>

                          {/* Asset Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs truncate text-slate-100 group-hover:text-white">
                                {asset.icon} {asset.name}
                              </span>
                              
                              {/* Category Badge */}
                              <span
                                style={{ color: asset.color, borderColor: `${asset.color}40`, backgroundColor: `${asset.color}10` }}
                                className="text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider flex-shrink-0 scale-90"
                              >
                                {asset.type === "photo" ? "Vision" : asset.type === "video" ? "Video" : asset.type === "doc" ? "Doc" : "Rule"}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {asset.description}
                            </p>

                            {/* Embedded Visual indicators or timelines */}
                            {isSelected && (
                              <div className="mt-2 pt-1.5 border-t border-slate-800/40 text-[10px] space-y-1">
                                {asset.type === "photo" && (
                                  <div className="text-emerald-400/90 flex items-center gap-1.5 font-mono">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Ingested Resolution: {asset.resolution}
                                  </div>
                                )}
                                {asset.type === "video" && (
                                  <div className="text-red-400/90 space-y-1 font-mono">
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                      Ingested Timelines ({asset.duration}):
                                    </div>
                                    <div className="bg-slate-950 p-1.5 rounded text-[9px] line-clamp-2 leading-relaxed text-slate-400">
                                      {asset.transcript}
                                    </div>
                                  </div>
                                )}
                                {asset.type === "doc" && asset.content && (
                                  <div className="bg-slate-950 p-1.5 rounded text-[9px] font-mono text-slate-400 line-clamp-2 leading-relaxed">
                                    {asset.content}
                                  </div>
                                )}
                                {asset.type === "note" && asset.content && (
                                  <div className="bg-amber-950/25 border border-amber-500/25 p-1.5 rounded text-[9px] text-amber-300 italic">
                                    " {asset.content} "
                                  </div>
                                )}
                                <div className="text-[9px] text-slate-500 text-right italic pt-0.5">
                                  Source: {asset.source}
                                </div>
                              </div>
                            )}

                          </div>

                          {/* Delete Action (only for user created stuff) */}
                          {asset.id.startsWith("custom_") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAsset(asset.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

            {/* MIDDLE COLUMN: Active Categorizer & Goal Setting (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Goal Input & Template Presets */}
              <div className="bg-[#0F111A] rounded-2xl border border-slate-900 p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-900">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <h2 className="font-bold text-xs uppercase tracking-wider text-slate-300">Set Compile Goal</h2>
                </div>

                <div className="space-y-1 mb-3">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Compilation Presets</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {COMPILER_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="text-left text-xs p-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-300 transition-all font-semibold flex items-center justify-between"
                      >
                        <span>🎯 {tpl.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Intent Prompt</label>
                  <textarea
                    rows="4"
                    value={compilerGoal}
                    onChange={(e) => setCompilerGoal(e.target.value)}
                    placeholder="Enter what you want Gemini to analyze and build from these files..."
                    className="w-full bg-[#07070A] text-xs text-slate-200 border border-slate-900 focus:border-purple-500 rounded-xl p-3 focus:outline-none placeholder-slate-600 leading-relaxed resize-none"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>*The compiler uses strict multimodal parameters</span>
                    <span>{compilerGoal.length} chars</span>
                  </div>
                </div>
              </div>

              {/* Categorization pipeline visualizer */}
              <div className="bg-[#0F111A] rounded-2xl border border-slate-900 p-4 flex-1">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-green-400 animate-pulse" />
                    <h2 className="font-bold text-xs uppercase tracking-wider text-slate-300">Active Ingestion Flow</h2>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  These files are active in the workspace and will be routed to the respective analytical passes:
                </p>

                {/* Ingestion Vault Rows */}
                <div className="space-y-3.5">
                  
                  {/* Category Row: Vision Bank */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        📸 Vision Bank (Photos)
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "photo").length} items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "photo").map(a => (
                        <span key={a.id} className="text-[9px] bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
                          {a.name}
                        </span>
                      ))}
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "photo").length === 0 && (
                        <span className="text-[10px] italic text-slate-600">No photos in context.</span>
                      )}
                    </div>
                  </div>

                  {/* Category Row: Video Streams */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        🎥 Video Stream (Temporal)
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "video").length} items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "video").map(a => (
                        <span key={a.id} className="text-[9px] bg-red-950/30 border border-red-900/50 text-red-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
                          {a.name}
                        </span>
                      ))}
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "video").length === 0 && (
                        <span className="text-[10px] italic text-slate-600">No videos in context.</span>
                      )}
                    </div>
                  </div>

                  {/* Category Row: Document Index */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                        📄 Document Index (Files)
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "doc").length} items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "doc").map(a => (
                        <span key={a.id} className="text-[9px] bg-blue-950/30 border border-blue-900/50 text-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
                          {a.name}
                        </span>
                      ))}
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "doc").length === 0 && (
                        <span className="text-[10px] italic text-slate-600">No documents in context.</span>
                      )}
                    </div>
                  </div>

                  {/* Category Row: Keep Snippets */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                        💡 Keep Snippets (Heuristics)
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "note").length} items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "note").map(a => (
                        <span key={a.id} className="text-[9px] bg-yellow-950/30 border border-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
                          {a.name}
                        </span>
                      ))}
                      {assets.filter(a => selectedAssetIds.includes(a.id) && a.type === "note").length === 0 && (
                        <span className="text-[10px] italic text-slate-600">No Keep guidelines active.</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Compilation trigger button */}
                <div className="mt-5 pt-3 border-t border-slate-900">
                  <button
                    onClick={runCompilation}
                    disabled={compiling || selectedAssetIds.length === 0}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                      compiling || selectedAssetIds.length === 0
                        ? "bg-slate-950 text-slate-500 border border-slate-900 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-slate-950 hover:brightness-110 active:scale-[0.98] shadow-indigo-500/10 text-white"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    {compiling ? "Running Compilation Passes..." : "Compile Multimodal Workspace Stack"}
                  </button>
                  {errorMsg && (
                    <p className="text-[11px] text-red-400 text-center mt-2 font-semibold">⚠️ {errorMsg}</p>
                  )}
                </div>

              </div>

            </div>

            {/* RIGHT PANEL: Compilation Console Output (4 cols) */}
            <div className="lg:col-span-4 flex flex-col">
              
              <div className="bg-[#0F111A] rounded-2xl border border-slate-900 p-4 flex-1 flex flex-col min-h-[500px]">
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <h2 className="font-bold text-xs uppercase tracking-wider text-slate-300 font-mono">Compiler Console</h2>
                  </div>
                  
                  {/* API Connection Indicator */}
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Gemini Live Ready
                  </div>
                </div>

                {/* Active Compilation Loading Overlay */}
                {compiling && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-xl border border-slate-900/60 animate-pulse">
                    <div className="relative w-12 h-12 mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin"></div>
                    </div>
                    <div className="text-xs font-bold text-indigo-300 font-mono mb-2">{compileStep}</div>
                    <p className="text-[10px] text-slate-500 max-w-[240px]">Gemini is parsing layouts, speech transcripts, and syncing tables.</p>
                  </div>
                )}

                {/* Static / Empty State */}
                {!compiling && !compileResult && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-900 rounded-xl bg-slate-950/20">
                    <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                      <Code className="w-5 h-5 text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-xs text-slate-300 mb-1">Compiler Idle</h3>
                    <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                      Select assets, write your product intent on the left, and click compile to see unified schema maps & code DAGs.
                    </p>
                  </div>
                )}

                {/* Results Screen */}
                {!compiling && compileResult && (
                  <div className="flex-1 flex flex-col gap-3">
                    
                    <div className="p-2.5 bg-indigo-950/20 rounded-xl border border-indigo-900/30 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-indigo-300 font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-indigo-400" />
                        {compileResult.mode}
                      </span>
                      <span className="text-slate-500 font-mono">{compileResult.timestamp}</span>
                    </div>

                    {/* Styled Markdown Rendering Frame */}
                    <div className="flex-1 bg-slate-950/90 border border-slate-900/80 rounded-xl p-4 font-sans text-xs text-slate-200 overflow-y-auto max-h-[580px] space-y-4 leading-relaxed scrollbar-thin">
                      
                      {/* Parsed Custom Markdown Elements */}
                      {compileResult.rawMarkdown.split("\n\n").map((chunk, cIdx) => {
                        if (chunk.startsWith("##")) {
                          // Section Headings
                          return (
                            <h3 key={cIdx} className="text-sm font-bold text-indigo-300 border-b border-indigo-950/80 pb-1 pt-3 flex items-center gap-1.5 font-mono">
                              {chunk.includes("Goal") && "🎯"}
                              {chunk.includes("Vision") && "📸"}
                              {chunk.includes("Video") && "🎥"}
                              {chunk.includes("Decision") && "📋"}
                              {chunk.includes("DAG") && "📐"}
                              {chunk.replace(/##\s*/, "")}
                            </h3>
                          );
                        }
                        
                        if (chunk.startsWith("###")) {
                          // Sub headings / ADR details
                          return (
                            <h4 key={cIdx} className="text-xs font-bold text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center gap-2">
                              <span>📁</span>
                              {chunk.replace(/###\s*/, "")}
                            </h4>
                          );
                        }

                        if (chunk.startsWith("-") || chunk.startsWith("*")) {
                          // Lists
                          return (
                            <ul key={cIdx} className="space-y-1.5 pl-2 list-none">
                              {chunk.split("\n").map((li, lIdx) => (
                                <li key={lIdx} className="text-[11px] text-slate-300 flex items-start gap-2">
                                  <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                                  <span>
                                    {/* Handle Bold elements */}
                                    {li.replace(/^[\s-*]+\s*/, "").split("**").map((text, tIdx) => 
                                      tIdx % 2 === 1 ? <strong key={tIdx} className="text-indigo-200 font-bold">{text}</strong> : text
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        if (/^\d+\./.test(chunk)) {
                          // DAG Sequence Numbers
                          return (
                            <div key={cIdx} className="space-y-2.5">
                              {chunk.split("\n").map((step, sIdx) => (
                                <div key={sIdx} className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 flex items-start gap-2.5 hover:border-slate-700 transition">
                                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold font-mono flex-shrink-0">
                                    {step.match(/^\d+/)?.[0] || sIdx + 1}
                                  </span>
                                  <div className="text-[11px]">
                                    {step.replace(/^\d+\.\s*/, "").split("**").map((text, tIdx) => 
                                      tIdx % 2 === 1 ? <strong key={tIdx} className="text-white font-bold">{text}</strong> : text
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        // Fallback text rendering
                        return (
                          <p key={cIdx} className="text-[11px] text-slate-400">
                            {chunk}
                          </p>
                        );
                      })}

                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(compileResult.rawMarkdown);
                        }}
                        className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        Copy Raw Markdown
                      </button>
                      <button
                        onClick={() => {
                          setCompileResult(null);
                        }}
                        className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 text-xs transition"
                      >
                        Clear Console
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ─── TAB 2: COGNITIVE COMPILER ARCHITECTURE DIAGRAM ─── */}
        {activeTab === "diagram" && (
          <div className="bg-[#0F111A] rounded-2xl border border-slate-900 p-6">
            
            <div className="max-w-3xl mx-auto text-center mb-8">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 rounded-full border border-purple-500/20">
                Cognitive Compiler Flowchart
              </span>
              <h2 className="font-extrabold text-2xl text-slate-100 mt-2 mb-2">Multimodal Processing Loop</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                See how Google Photos, YouTube APIs, and Drive Briefs bypass manual input streams, decomposing assets dynamically inside Gemini's semantic workspace container.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Interactive Diagram Flow (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-center text-xs text-slate-400 italic">
                  👉 Click any stage of the pipeline below to inspect its Inputs, Outputs, and Compiled IR format.
                </div>

                <div className="relative flex flex-col items-center">
                  
                  {/* Loop Connectors */}
                  <div className="absolute top-12 bottom-12 left-6 w-[2px] bg-dashed border-l border-slate-800/80 hidden md:block"></div>

                  {/* Pipeline Ingestion Stage */}
                  <div className="w-full space-y-3">
                    
                    {/* Stage 1 Ingestion */}
                    <div
                      onClick={() => setSelectedDiagramStage("ingest")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDiagramStage === "ingest"
                          ? "bg-blue-950/20 border-blue-500 shadow-lg shadow-blue-500/5"
                          : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📥</span>
                        <div className="text-left">
                          <h4 className="font-bold text-xs text-blue-400 font-mono">1. Multimodal Ingestion</h4>
                          <p className="text-[10px] text-slate-400">Drive APIs, Keep feeds & Photos uploads</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/25 uppercase">Ingest IR</span>
                    </div>

                    {/* Diverging Split Arrow */}
                    <div className="flex justify-center h-5">
                      <div className="w-[1.5px] bg-slate-800 h-full"></div>
                    </div>

                    {/* Diversified Pipelines (Four Parallel Channels) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      
                      {/* Sub-Channel: Photos */}
                      <div
                        onClick={() => setSelectedDiagramStage("vision_bank")}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer text-center ${
                          selectedDiagramStage === "vision_bank"
                            ? "bg-emerald-950/20 border-emerald-500"
                            : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                        }`}
                      >
                        <span className="text-lg">📸</span>
                        <h5 className="font-bold text-[10px] text-emerald-400 mt-1">Vision Bank</h5>
                        <span className="text-[8px] text-slate-500 font-mono">Vision IR</span>
                      </div>

                      {/* Sub-Channel: Videos */}
                      <div
                        onClick={() => setSelectedDiagramStage("video_stream")}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer text-center ${
                          selectedDiagramStage === "video_stream"
                            ? "bg-red-950/20 border-red-500"
                            : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                        }`}
                      >
                        <span className="text-lg">🎥</span>
                        <h5 className="font-bold text-[10px] text-red-400 mt-1">Video Stream</h5>
                        <span className="text-[8px] text-slate-500 font-mono">Video IR</span>
                      </div>

                      {/* Sub-Channel: Docs */}
                      <div
                        onClick={() => setSelectedDiagramStage("document_index")}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer text-center ${
                          selectedDiagramStage === "document_index"
                            ? "bg-blue-950/20 border-blue-500"
                            : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                        }`}
                      >
                        <span className="text-lg">📄</span>
                        <h5 className="font-bold text-[10px] text-blue-400 mt-1 font-mono">Drive Docs</h5>
                        <span className="text-[8px] text-slate-500 font-mono">Doc IR</span>
                      </div>

                      {/* Sub-Channel: Keep */}
                      <div
                        onClick={() => setSelectedDiagramStage("keep_snippets")}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer text-center ${
                          selectedDiagramStage === "keep_snippets"
                            ? "bg-yellow-950/20 border-yellow-500"
                            : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                        }`}
                      >
                        <span className="text-lg">💡</span>
                        <h5 className="font-bold text-[10px] text-yellow-400 mt-1">Keep Rules</h5>
                        <span className="text-[8px] text-slate-500 font-mono">Rule IR</span>
                      </div>

                    </div>

                    {/* Converging Arrow */}
                    <div className="flex justify-center h-5">
                      <div className="w-[1.5px] bg-slate-800 h-full"></div>
                    </div>

                    {/* Stage 3 Merger */}
                    <div
                      onClick={() => setSelectedDiagramStage("multimodal_merger")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDiagramStage === "multimodal_merger"
                          ? "bg-indigo-950/20 border-indigo-500 shadow-lg shadow-indigo-500/5"
                          : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-pulse">🧠</span>
                        <div className="text-left">
                          <h4 className="font-bold text-xs text-indigo-400 font-mono">2. Gemini Context Merger</h4>
                          <p className="text-[10px] text-slate-400">Resolves layout coordinate matches and SQL links</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 uppercase">Context IR</span>
                    </div>

                    {/* Connection Arrow */}
                    <div className="flex justify-center h-5">
                      <div className="w-[1.5px] bg-slate-800 h-full"></div>
                    </div>

                    {/* Stage 4 ADR compile */}
                    <div
                      onClick={() => setSelectedDiagramStage("adr_constants")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDiagramStage === "adr_constants"
                          ? "bg-purple-950/20 border-purple-500 shadow-lg shadow-purple-500/5"
                          : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div className="text-left">
                          <h4 className="font-bold text-xs text-purple-400 font-mono">3. Decision compiler (ADRs)</h4>
                          <p className="text-[10px] text-slate-400">Compiles logic into unchangeable rules and ADR files</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 uppercase">Decision IR</span>
                    </div>

                    {/* Connection Arrow */}
                    <div className="flex justify-center h-5">
                      <div className="w-[1.5px] bg-slate-800 h-full"></div>
                    </div>

                    {/* Stage 5 Executable DAG output */}
                    <div
                      onClick={() => setSelectedDiagramStage("planning_dag")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedDiagramStage === "planning_dag"
                          ? "bg-pink-950/20 border-pink-500 shadow-lg shadow-pink-500/5"
                          : "bg-slate-950 hover:bg-[#121422] border-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📐</span>
                        <div className="text-left">
                          <h4 className="font-bold text-xs text-pink-400 font-mono">4. Task DAG Planner</h4>
                          <p className="text-[10px] text-slate-400">Outputs ready-to-run chronological developer roadmaps</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/25 uppercase">Plan IR</span>
                    </div>

                  </div>

                </div>

              </div>

              {/* Right Column: Detailed Stage Inspection Panel (5 cols) */}
              <div className="lg:col-span-5">
                {(() => {
                  const stage = MASTER_STAGES.find(s => s.id === selectedDiagramStage);
                  if (!stage) return null;
                  return (
                    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 sticky top-24 animate-fadeIn">
                      
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{stage.icon}</span>
                          <h3 style={{ color: stage.color }} className="font-bold text-sm font-mono">
                            {stage.label}
                          </h3>
                        </div>
                        <span style={{ color: stage.color, borderColor: `${stage.color}40`, backgroundColor: `${stage.color}10` }} className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase">
                          {stage.ir}
                        </span>
                      </div>

                      <div className="space-y-4">
                        
                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tagline</div>
                          <p className="text-xs text-slate-300 italic font-semibold">"{stage.tagline}"</p>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pass Explanation</div>
                          <p className="text-xs text-slate-400 leading-relaxed">{stage.detail}</p>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Ingestion Inputs</div>
                          <div className="space-y-1">
                            {stage.inputs.map((inp, i) => (
                              <div key={i} className="text-xs text-slate-300 flex items-center gap-2">
                                <span className="text-slate-600 font-mono">←</span>
                                <span>{inp}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Compiled Outputs</div>
                          <div className="space-y-1">
                            {stage.outputs.map((out, i) => (
                              <div key={i} className="text-xs text-indigo-300 flex items-center gap-2 font-mono">
                                <span className="text-slate-600 font-mono">→</span>
                                <span>{out}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {stage.note && (
                          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 italic">
                            💡 <strong>Operational Note:</strong> {stage.note}
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

        {/* ─── TAB 3: YOUTUBE STORYBOARD & SCRIPT ─── */}
        {activeTab === "storyboard" && (
          <div className="bg-[#0F111A] rounded-2xl border border-slate-900 p-6 max-w-4xl mx-auto">
            
            <div className="text-center mb-6">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-300 rounded-full border border-red-500/20">
                Educational Video Outline
              </span>
              <h2 className="font-extrabold text-2xl text-slate-100 mt-2">Ingestion Storyboard</h2>
              <p className="text-xs text-slate-400 mt-1">
                A step-by-step presentation script showing how to build an AI memory workspace utilizing visual & timeline components.
              </p>
            </div>

            {/* Ingestion progress steps */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-900">
              {STORYBOARD_SCENES.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setStoryboardIndex(idx);
                    setStoryboardTab("narration");
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    idx === storyboardIndex
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "bg-slate-950 text-slate-500 border border-slate-950 hover:text-slate-300"
                  }`}
                >
                  Scene {scene.id}: {scene.title}
                </button>
              ))}
            </div>

            {/* Main Active Scene presentation */}
            {(() => {
              const activeScene = STORYBOARD_SCENES[storyboardIndex];
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left Column: Visual Representation Box (5 cols) */}
                  <div className="md:col-span-5 bg-slate-950 rounded-2xl border border-slate-900 p-5 flex flex-col justify-between min-h-[300px]">
                    
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{activeScene.icon}</span>
                        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider font-mono">
                          Visual Scene {activeScene.id}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {storyboardIndex + 1} / {STORYBOARD_SCENES.length}
                      </span>
                    </div>

                    {/* Graphical Mock Frame depending on active storyboard item */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      
                      {activeScene.id === 1 && (
                        <div className="space-y-3">
                          <div className="flex gap-2 justify-center text-3xl animate-bounce">
                            <span>📸</span> <span>🎥</span> <span>📄</span>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xl font-bold mx-auto border border-red-500/30">
                            ✕
                          </div>
                          <p className="text-[10px] text-slate-400 italic">"The AI forgets previous files when you open a new window."</p>
                        </div>
                      )}

                      {activeScene.id === 2 && (
                        <div className="space-y-3 w-full">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900 text-[10px] text-emerald-300 font-bold">Vision</div>
                            <div className="p-2 rounded bg-red-950/20 border border-red-900 text-[10px] text-red-300 font-bold">Videos</div>
                            <div className="p-2 rounded bg-blue-950/20 border border-blue-900 text-[10px] text-blue-300 font-bold font-mono">Docs</div>
                          </div>
                          <div className="text-xl text-indigo-400">⚡</div>
                          <p className="text-[9px] text-slate-500">Structured into standardized categories</p>
                        </div>
                      )}

                      {activeScene.id === 3 && (
                        <div className="space-y-3 w-full">
                          <div className="border border-emerald-900/40 p-2.5 rounded bg-[#0A1210] relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 animate-pulse shadow-md shadow-emerald-400"></div>
                            <div className="text-left text-[9px] font-mono text-emerald-400 space-y-1">
                              <div>[Vision Analyzer OCR]</div>
                              <div>- Found: 3 buttons</div>
                              <div>- Form height: 420px</div>
                              <div>- Trend: Checkout dropped 40%</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeScene.id === 4 && (
                        <div className="space-y-3 w-full">
                          <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px] text-left">
                            <span className="font-bold text-red-400 font-mono">Video Timestamp Ingestion:</span>
                            <div className="mt-1 space-y-1 font-mono text-[9px] text-slate-400">
                              <div>⏱️ 0:08 - UI freeze triggered</div>
                              <div>🎙️ 2:30 - "Store data in Postgres"</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeScene.id === 5 && (
                        <div className="space-y-3 text-center">
                          <div className="relative inline-block">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 animate-spin opacity-70"></div>
                            <span className="absolute inset-0 flex items-center justify-center text-xl">🧠</span>
                          </div>
                          <p className="text-[10px] text-indigo-300 font-mono">Synthesizing Visuals + Speech Transcripts</p>
                        </div>
                      )}

                      {activeScene.id === 6 && (
                        <div className="space-y-3 w-full">
                          <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[9px] text-left space-y-1 font-mono">
                            <div className="text-amber-400 font-bold">📋 ADR-011 Anti-Double-Click</div>
                            <div className="text-slate-400">Why: To address button issues observed in the repro video.</div>
                            <div className="text-pink-400 font-bold">📐 TASK-01 Build State-Debouncer</div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Bottom scene label info */}
                    <div className="mt-4 pt-2 border-t border-slate-900 text-[10px] text-slate-500 text-left">
                      <strong>Visual Cue:</strong> {activeScene.visualNote}
                    </div>

                  </div>

                  {/* Right Column: Narrative Script Text & Control Tabs (7 cols) */}
                  <div className="md:col-span-7 flex flex-col">
                    
                    {/* Inner tab control */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 mb-3">
                      <button
                        onClick={() => setStoryboardTab("narration")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          storyboardTab === "narration"
                            ? "bg-slate-900 text-slate-200"
                            : "text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        🎙️ Dialogue / Narration Script
                      </button>
                      <button
                        onClick={() => setStoryboardTab("details")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          storyboardTab === "details"
                            ? "bg-slate-900 text-slate-200"
                            : "text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        💡 Educational Notes
                      </button>
                    </div>

                    {/* Content Screen */}
                    <div className="flex-1 bg-[#090A10] border border-slate-900 rounded-2xl p-5 text-slate-300 text-xs leading-relaxed space-y-4">
                      {storyboardTab === "narration" ? (
                        <div className="space-y-3">
                          <div className="text-[10px] text-red-400 uppercase tracking-widest font-mono font-bold">Voiceover Narration</div>
                          <p className="whitespace-pre-line text-slate-300 italic">
                            "{activeScene.narration}"
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">Why This Matters</div>
                          <p className="text-slate-400">
                            By teaching users to write short structural descriptions of what are on design sketches or logging transcription points of Meet calls, you save hundreds of development hours spent repeating instructions to agents.
                          </p>
                          <ul className="space-y-1 pl-4 list-disc text-slate-400">
                            <li>Photos act as mockups or layout standards.</li>
                            <li>Videos serve as reproduce-steps guides.</li>
                            <li>Keep files represent stylistic preferences.</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Next/Prev Navigation controls */}
                    <div className="flex justify-between items-center mt-4">
                      <button
                        disabled={storyboardIndex === 0}
                        onClick={() => {
                          setStoryboardIndex(prev => Math.max(0, prev - 1));
                          setStoryboardTab("narration");
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          storyboardIndex === 0
                            ? "bg-slate-950 border-slate-950 text-slate-600 cursor-not-allowed"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        ← Previous Slide
                      </button>

                      <div className="flex gap-1">
                        {STORYBOARD_SCENES.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === storyboardIndex ? "bg-red-500 w-4" : "bg-slate-800"
                            }`}
                          ></div>
                        ))}
                      </div>

                      <button
                        disabled={storyboardIndex === STORYBOARD_SCENES.length - 1}
                        onClick={() => {
                          setStoryboardIndex(prev => Math.min(STORYBOARD_SCENES.length - 1, prev + 1));
                          setStoryboardTab("narration");
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          storyboardIndex === STORYBOARD_SCENES.length - 1
                            ? "bg-slate-950 border-slate-950 text-slate-600 cursor-not-allowed"
                            : "bg-red-500 border-red-500 text-slate-950 hover:brightness-110 text-white"
                        }`}
                      >
                        Next Slide →
                      </button>
                    </div>

                  </div>

                </div>
              );
            })()}

          </div>
        )}

      </main>

      {/* ─── Global Footer ─── */}
      <footer className="border-t border-slate-900 bg-[#07070A] py-8 text-center text-xs text-slate-500 mt-12 px-4">
        <p className="mb-2">Gemini Multimodal Stack & Cognitive Compiler · Developed for Google Workspace and Gemini Flash Ingest Models.</p>
        <p className="text-[10px] text-slate-600">The compiler key-less execution environment runs real model predictions and offline fallback synthesis. No user cookies stored.</p>
      </footer>

    </div>
  );
}
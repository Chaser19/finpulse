export const missionFrameworkStepIcons = {
  focus: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="6"></circle>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path>
    </svg>
  `,
  signal: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 14c2-2.6 4-2.6 6 0s4 2.6 6 0 4-2.6 6 0"></path>
      <path d="M4 10c2-2.6 4-2.6 6 0s4 2.6 6 0 4-2.6 6 0"></path>
    </svg>
  `,
  indicators: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h16"></path>
      <path d="M7 20V12M12 20V8M17 20V5"></path>
    </svg>
  `,
  roadmap: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 21V4"></path>
      <path d="M6 5h9l-1.8 3L15 11H6"></path>
      <circle cx="16.5" cy="16.5" r="2.5"></circle>
    </svg>
  `
};

export const missionFrameworkSteps = [
  {
    id: "focus",
    kicker: "Pillar 01",
    count: "01 / 04",
    meter: 25,
    tabTitle: "Model Development Focus",
    tabSummary: "What we measure and why the feature space matters.",
    title: "Model Development Focus",
    summary: "FinPulse structures market attention into measurable components before any predictive interpretation is attempted.",
    items: [
      "Track <strong>intensity</strong>, <strong>velocity</strong>, and <strong>persistence</strong> of market-relevant engagement.",
      "Classify engagement by <strong>asset class</strong>, <strong>macro theme</strong>, and narrative structure.",
      "Evaluate relationships with <strong>price</strong>, <strong>volatility</strong>, <strong>volume</strong>, and <strong>liquidity</strong>."
    ]
  },
  {
    id: "signal",
    kicker: "Pillar 02",
    count: "02 / 04",
    meter: 50,
    tabTitle: "Why This Signal Matters",
    tabSummary: "How social flow can reflect and amplify positioning.",
    title: "Why This Signal Matters",
    summary: "Social media increasingly operates as a real-time transmission layer for macro releases, geopolitical developments, corporate events, and trader positioning.",
    items: [
      "Participation from analysts, journalists, policymakers, institutions, and retail cohorts expands narrative reach.",
      "Engagement can both <strong>reflect expectations</strong> and <strong>amplify them</strong>.",
      "Signal quality improves when narrative context is paired with market microstructure."
    ]
  },
  {
    id: "indicators",
    kicker: "Pillar 03",
    count: "03 / 04",
    meter: 75,
    tabTitle: "Structured Indicators",
    tabSummary: "The concrete outputs used to monitor regimes.",
    title: "Structured Indicators",
    summary: "The objective is to package noisy discourse into repeatable diagnostics that can be tracked over time.",
    items: [
      "Engagement surge flags and sentiment-adjusted momentum.",
      "Narrative persistence metrics for medium-term regime tracking.",
      "Cross-asset information-sensitivity diagnostics."
    ]
  },
  {
    id: "roadmap",
    kicker: "Pillar 04",
    count: "04 / 04",
    meter: 100,
    tabTitle: "Positioning & Roadmap",
    tabSummary: "Current status and intended extension path.",
    title: "Positioning & Roadmap",
    summary: "FinPulse is currently a research-driven, non-commercial initiative prioritising rigorous data handling, transparent assumptions, and analytical discipline.",
    items: [
      "Current emphasis remains on methodological quality and repeatability.",
      "Near-term work extends the framework into macro-thematic and cross-asset monitoring.",
      "Longer-term direction targets advanced alternative-data research applications."
    ]
  }
];

export const missionMarketSegmentIcons = {
  b2c: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 16c2-2.4 4-2.4 6 0s4 2.4 6 0 4-2.4 6 0"></path>
      <circle cx="8" cy="9" r="1.7"></circle>
      <circle cx="16" cy="9" r="1.7"></circle>
    </svg>
  `,
  b2b: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="8" width="5" height="8" rx="1.2"></rect>
      <rect x="10" y="5" width="5" height="11" rx="1.2"></rect>
      <rect x="16" y="10" width="4" height="6" rx="1.2"></rect>
      <path d="M3 19h18"></path>
    </svg>
  `
};

export const missionMarketSegments = [
  {
    id: "b2c",
    kicker: "B2C",
    meter: 50,
    tabTitle: "Clarity and speed",
    tabSummary: "Real-time monitoring for active investors and traders.",
    title: "Clarity and speed for active investors",
    audience: "Retail investors, traders, and finance prosumers",
    value: "FinPulse helps active investors cut through market noise by turning sentiment, narrative, and event data into clear, actionable monitoring tools.",
    painPoints: [
      "Too much noisy information.",
      "Fragmented workflow across multiple platforms.",
      "Difficulty identifying what actually matters.",
      "Late interpretation of market moves.",
      "Weak confidence distinguishing real shifts from hype."
    ],
    useCases: [
      "Understand what is moving and why.",
      "Monitor watchlists without constantly checking X or Twitter.",
      "Detect rising crowd attention early.",
      "Judge whether a move is noise or a genuine shift.",
      "Improve event-driven trading and investing workflow."
    ]
  },
  {
    id: "b2b",
    kicker: "B2B",
    meter: 100,
    tabTitle: "Workflow efficiency",
    tabSummary: "Explainable research support for lean professional teams.",
    title: "Workflow efficiency and repeatable team decisions",
    audience: "Funds, research teams, advisors, IR, risk, and intelligence desks",
    value: "FinPulse helps investment and research teams monitor market narratives, alternative signals, and event-driven shifts in one explainable workflow.",
    painPoints: [
      "Fragmented data sources.",
      "High integration and cleaning costs.",
      "Inefficient research workflows.",
      "Poor explainability and low transparency in alternative data.",
      "Collaboration friction across teams."
    ],
    useCases: [
      "Morning research triage.",
      "Narrative monitoring.",
      "Signal overlays on existing workflows.",
      "Event response across earnings, macro, policy, and geopolitical developments.",
      "Team dashboards and client-ready monitoring."
    ]
  }
];

export const roadmapPhases = [
  {
    id: "phase-1",
    navTitle: "Preliminary Tests & Planning",
    navMeta: "February",
    title: "Month 1 — Preliminary Tests & Planning",
    range: "Month 1",
    status: "Completed",
    summary: "Completed preliminary tests and aligned operating structure, priorities, and implementation sequence for the next four months.",
    sections: [
      {
        title: "Objectives",
        items: [
          "Confirm technical feasibility through preliminary testing.",
          "Align execution priorities and responsibilities.",
          "Define month-by-month operating cadence."
        ]
      },
      {
        title: "Key Workstreams",
        items: [
          "Run preliminary data and workflow tests on target sources.",
          "Define execution owners and handoff checkpoints.",
          "Document implementation plan for months 2 to 5."
        ]
      },
      {
        title: "Exit Criteria",
        items: [
          "Preliminary tests signed off by the team.",
          "Execution workflow documented and approved.",
          "Month 2 data layout scope confirmed."
        ]
      }
    ]
  },
  {
    id: "phase-2",
    navTitle: "Data Layout Blueprint",
    navMeta: "March",
    title: "Month 2 — Data Layout Blueprint",
    range: "Month 2",
    status: "Next Up",
    summary: "Finalize the shared data layout specification and lock the structure before downstream pipeline implementation.",
    sections: [
      {
        title: "Objectives",
        items: ["Design and approve the canonical data layout."]
      },
      {
        title: "Key Workstreams",
        items: [
          "Map entities, fields, and required relationships across core datasets.",
          "Define naming conventions, timestamps, and identifier standards.",
          "Review and sign off the Data Layout diagram with implementation owners."
        ]
      },
      {
        title: "Exit Criteria",
        items: [
          "Data layout specification approved.",
          "Schema contract shared with build owners.",
          "Implementation backlog sequenced for month 3."
        ]
      }
    ]
  },
  {
    id: "phase-3",
    navTitle: "Pipeline Build-Out",
    navMeta: "April",
    title: "Month 3 — Pipeline Build-Out (Operational Signal)",
    range: "Month 3",
    status: "Upcoming",
    summary: "Implement ingestion, transformation, and reproducible training/backtest runs against the approved schema.",
    sections: [
      {
        title: "Objectives",
        items: [
          "Convert the Month 2 model into a v1 candidate via systematic tuning and pruning.",
          "Make walk-forward evaluation the default and publish a single truth pack of results.",
          "Ensure model outputs are reproducible (dataset snapshot + feature version + model version) across reruns."
        ]
      },
      {
        title: "Key Workstreams",
        items: [
          "Source adapters + canonical schema: Finalise connectors (X/Reddit/news/macro) with idempotent loads, dedupe, and rate-limit handling.",
          "Transformation + feature layer: Normalisation, entity resolution (tickers, topics), timezone alignment, and missingness rules.",
          "Training + backtest harness: Walk-forward folds, baseline comparisons, leakage tests, and metrics suite.",
          "Model registry + versioning: Dataset version, feature version, model artefact version, and reproducible runs.",
          "Operational readiness: Scheduled runs, run logging, failure modes, fallbacks, and alert thresholds."
        ]
      },
      {
        title: "Exit Criteria",
        items: [
          "Core sources run end-to-end on schedule for >= 14 days with no critical failure.",
          "Feature set is stable and documented (definition + lineage + missingness handling).",
          "Walk-forward backtest produces consistent metrics vs baseline, with no leakage flags.",
          "Each run produces a versioned artefact (data snapshot + features + model output) that can be replayed."
        ]
      }
    ]
  },
  {
    id: "phase-4",
    navTitle: "Validation & QA",
    navMeta: "May",
    title: "Month 4 — Validation & QA",
    range: "Month 4",
    status: "Upcoming",
    summary: "Run four explicit go/no-go gates across data quality, pipeline resilience, signal credibility, and product readiness before Month 5 integration.",
    sections: [
      {
        title: "Objectives",
        items: [
          "Validate that core data, pipelines, and signals meet reliability thresholds.",
          "Find and resolve critical defects before integration work begins.",
          "Confirm product workflows and monitoring are production-ready."
        ]
      },
      {
        title: "Key Workstreams",
        items: [
          "Gate 1 (Data Contract): completeness, uniqueness, schema, and freshness checks.",
          "Gate 2 (Pipeline Reliability): reruns, retries, backfills, and recovery drills.",
          "Gate 3 (Signal Credibility): sanity checks, drift tests, and baseline comparisons.",
          "Gate 4 (Product Readiness): chart/filter/watchlist QA and empty/error states.",
          "Monitoring handoff: failure, stale data, and anomalous output alerts with escalation routing."
        ]
      },
      {
        title: "Exit Criteria",
        items: [
          "All four gates pass with evidence recorded in the QA log.",
          "No unresolved critical defects remain in core workflows.",
          "Monitoring, alerts, and escalation ownership are live and signed off."
        ]
      }
    ]
  },
  {
    id: "phase-5",
    navTitle: "Integration & Review Readiness",
    navMeta: "June",
    title: "Month 5 — Integration & Review Readiness",
    range: "Month 5",
    status: "Upcoming",
    summary: "Integrate validated systems into mission-facing workflows, run end-to-end release rehearsal, and complete a review-ready handoff pack for Month 6 decisions.",
    sections: [
      {
        title: "Objectives",
        items: [
          "Ship an integrated mission view backed by validated data and signal logic.",
          "Prove release readiness through a full dry run across core user and ops workflows.",
          "Deliver a concise review pack that drives clear Month 6 decisions."
        ]
      },
      {
        title: "Key Workstreams",
        items: [
          "Integration cutover: connect validated pipeline outputs to mission-facing views and APIs.",
          "Release rehearsal: execute full end-to-end runbook including rollback and incident paths.",
          "Readiness QA: verify core journeys, SLA checkpoints, and data freshness/service health.",
          "Review pack assembly: status snapshot, KPI trends, open risks, and decision asks.",
          "Month 6 planning: convert review outcomes into sequenced priorities with owners."
        ]
      },
      {
        title: "Exit Criteria",
        items: [
          "Integrated mission output is live and stable across agreed critical workflows.",
          "End-to-end rehearsal completes with no unresolved critical issues.",
          "Review checkpoint closes with approved Month 6 priorities, owners, and timelines."
        ]
      }
    ]
  }
];

(function () {
  const roadmapPhases = [
    {
      id: "phase-1",
      title: "Month 1 — Preliminary Tests & Planning",
      range: "Month 1",
      status: "Completed",
      summary:
        "Completed preliminary tests and aligned operating structure, priorities, and implementation sequence for the next four months.",
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
      title: "Month 2 — Data Layout Blueprint",
      range: "Month 2",
      status: "Next Up",
      summary:
        "Finalize the shared data layout specification and lock the structure before downstream pipeline implementation.",
      sections: [
        {
          title: "Objectives",
          items: [
            "Design and approve the canonical data layout."
          ]
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
      title: "Month 3 — Pipeline Build-Out (Operational Signal)",
      range: "Month 3",
      status: "Upcoming",
      summary:
        "Implement ingestion, transformation, and reproducible training/backtest runs against the approved schema.",
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
      title: "Month 4 — Validation & QA",
      range: "Month 4",
      status: "Upcoming",
      summary:
        "Prove data quality, pipeline resilience, and output credibility. Confirm dashboard correctness across core workflows. Put monitoring and escalation in place before integration.",
      sections: [
        {
          title: "Objectives",
          items: [
            "Prove data quality, pipeline resilience, and output credibility.",
            "Confirm dashboard correctness across core workflows.",
            "Put monitoring and escalation in place before integration."
          ]
        },
        {
          title: "Key Workstreams",
          items: [
            "Validation rules: completeness, uniqueness, schema, freshness.",
            "Pipeline QA: reruns, retries, backfills, recovery behaviour.",
            "Signal QA: sanity checks, drift tests, baseline comparisons.",
            "Product QA: charts, filters, watchlists, empty/error states.",
            "Monitoring: alerts for failures, stale data, and anomalous outputs."
          ]
        },
        {
          title: "Exit Criteria",
          items: [
            "Validation suite passes agreed thresholds.",
            "No critical defects remain in core workflows.",
            "Monitoring is live and QA sign-off is complete."
          ]
        }
      ]
    },
    {
      id: "phase-5",
      title: "Month 5 — Integration & Review Readiness",
      range: "Month 5",
      status: "Upcoming",
      summary:
        "Integrate the validated data stack with mission-facing outputs and prepare a structured review checkpoint.",
      sections: [
        {
          title: "Objectives",
          items: [
            "Prepare integrated outputs for stakeholder review."
          ]
        },
        {
          title: "Key Workstreams",
          items: [
            "Connect validated data pipeline to mission timeline outputs.",
            "Assemble review packet with status, risks, and next actions.",
            "Define month 6 priorities based on review outcomes."
          ]
        },
        {
          title: "Exit Criteria",
          items: [
            "Integrated mission output view ready.",
            "Review checkpoint completed with agreed follow-ups.",
            "Post-review roadmap approved."
          ]
        }
      ]
    }
  ];

  const getPhaseVisual = (phaseId) => {
    if (phaseId === "phase-2") {
      return {
        title: "Data Layout Blueprint",
        caption: "",
        svg: `
          <div class="mission-phase-zoom" data-zoom-root>
            <img
              src="/static/img/Data%20Layout.png"
              alt="Data layout diagram for month two execution"
              loading="lazy"
              class="mission-phase-zoom-image"
              data-zoom-image
            />
            <span class="mission-phase-zoom-level" data-zoom-level aria-live="polite">100%</span>
            <div class="mission-phase-zoom-controls" data-zoom-controls aria-label="Image zoom controls">
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="out" aria-label="Zoom out">-</button>
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="reset">Reset</button>
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="in" aria-label="Zoom in">+</button>
            </div>
          </div>
        `
      };
    }

    const visuals = {
      "phase-1": {
        title: "initial project layout",
        caption: "Preliminary test outcomes and planning alignment",
        svg: `
          <div class="mission-phase-zoom mission-phase-zoom-engine" data-zoom-root>
            <img
              src="/static/img/FinPulse%20Engine.png"
              alt="FinPulse Engine diagram for month one execution timeline"
              loading="lazy"
              class="mission-phase-zoom-image mission-phase-engine-image"
              data-zoom-image
            />
            <span class="mission-phase-zoom-level" data-zoom-level aria-live="polite">100%</span>
            <div class="mission-phase-zoom-controls" data-zoom-controls aria-label="Image zoom controls">
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="out" aria-label="Zoom out">-</button>
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="reset">Reset</button>
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="in" aria-label="Zoom in">+</button>
            </div>
          </div>
        `
      },
      "phase-2": {
        title: "Feature Selection Signal Evidence",
        caption: "Information coefficient stability and pruning from raw factors to robust candidates",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="Feature selection chart with information coefficient stability and pruning funnel">
            <rect x="18" y="16" width="384" height="248" rx="14" fill="rgba(255, 251, 244, 0.76)" stroke="rgba(168, 145, 105, 0.42)" />

            <rect x="30" y="30" width="236" height="146" rx="10" fill="rgba(255, 251, 244, 0.62)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="48" font-size="9.2" fill="#5b4e3d" font-family="Inter, sans-serif" textLength="196" lengthAdjust="spacingAndGlyphs">Median Information Coefficient by horizon</text>
            <line x1="46" y1="156" x2="252" y2="156" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.5" />
            <line x1="46" y1="62" x2="46" y2="156" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.5" />
            <rect x="70" y="128" width="30" height="28" rx="4" fill="rgba(178, 124, 70, 0.82)" />
            <rect x="124" y="112" width="30" height="44" rx="4" fill="rgba(198, 162, 99, 0.82)" />
            <rect x="178" y="96" width="30" height="60" rx="4" fill="rgba(121, 145, 106, 0.84)" />
            <line x1="85" y1="120" x2="85" y2="136" stroke="rgba(103, 86, 62, 0.85)" stroke-width="1.4" />
            <line x1="139" y1="102" x2="139" y2="122" stroke="rgba(103, 86, 62, 0.85)" stroke-width="1.4" />
            <line x1="193" y1="84" x2="193" y2="102" stroke="rgba(103, 86, 62, 0.85)" stroke-width="1.4" />
            <text x="84" y="168" text-anchor="middle" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">1h</text>
            <text x="138" y="168" text-anchor="middle" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">1d</text>
            <text x="192" y="168" text-anchor="middle" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">5d</text>
            <text x="214" y="78" font-size="8.5" fill="#6f5f4b" font-family="Inter, sans-serif">target IC &gt; 0.04</text>
            <line x1="206" y1="82" x2="252" y2="82" stroke="rgba(121, 145, 106, 0.84)" stroke-width="1.5" stroke-dasharray="5 4" />

            <rect x="30" y="186" width="236" height="64" rx="10" fill="rgba(255, 251, 244, 0.62)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="204" font-size="9.1" fill="#5b4e3d" font-family="Inter, sans-serif" textLength="194" lengthAdjust="spacingAndGlyphs">Feature family contribution to retained set</text>
            <rect x="46" y="218" width="52" height="14" rx="4" fill="rgba(121, 145, 106, 0.8)" />
            <rect x="102" y="218" width="38" height="14" rx="4" fill="rgba(198, 162, 99, 0.8)" />
            <rect x="144" y="218" width="30" height="14" rx="4" fill="rgba(154, 132, 96, 0.8)" />
            <rect x="178" y="218" width="24" height="14" rx="4" fill="rgba(178, 124, 70, 0.8)" />
            <text x="46" y="244" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">Sentiment</text>
            <text x="104" y="244" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">Flow</text>
            <text x="145" y="244" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">Macro</text>
            <text x="180" y="244" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">Cross-asset</text>

            <rect x="276" y="30" width="114" height="220" rx="10" fill="rgba(255, 251, 244, 0.62)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="288" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Pruning pipeline</text>
            <polygon points="288,60 378,60 366,95 300,95" fill="rgba(198, 162, 99, 0.5)" />
            <text x="333" y="81" text-anchor="middle" font-size="10.5" fill="#4d3f2d" font-family="Inter, sans-serif">120 raw factors</text>
            <polygon points="300,102 366,102 356,137 310,137" fill="rgba(154, 132, 96, 0.54)" />
            <text x="333" y="123" text-anchor="middle" font-size="10.5" fill="#4d3f2d" font-family="Inter, sans-serif">52 after QA</text>
            <polygon points="310,144 356,144 348,179 318,179" fill="rgba(121, 145, 106, 0.56)" />
            <text x="333" y="165" text-anchor="middle" font-size="10.5" fill="#2f3a2a" font-family="Inter, sans-serif">18 robust</text>
            <rect x="318" y="188" width="30" height="24" rx="6" fill="rgba(178, 124, 70, 0.64)" />
            <text x="333" y="203" text-anchor="middle" font-size="9" fill="#3f2d20" font-family="Inter, sans-serif">Live R&amp;D</text>
          </svg>
        `
      },
      "phase-3": {
        title: "Model Validation and Tuning",
        caption: "Model tuning workflow and validation checkpoints",
        svg: `
          <div class="mission-phase-zoom mission-phase-zoom-validation" data-zoom-root>
            <img
              src="/static/img/Model%20Validation%20and%20Tuning.png"
              alt="Model validation and tuning workflow for month three execution"
              loading="lazy"
              class="mission-phase-zoom-image mission-phase-validation-image"
              data-zoom-image
            />
            <span class="mission-phase-zoom-level" data-zoom-level aria-live="polite">100%</span>
            <div class="mission-phase-zoom-controls" data-zoom-controls aria-label="Image zoom controls">
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="out" aria-label="Zoom out">-</button>
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="reset">Reset</button>
              <button type="button" class="mission-phase-zoom-btn" data-zoom-action="in" aria-label="Zoom in">+</button>
            </div>
          </div>
        `
      },
      "phase-4": {
        title: "Validation Event Gates",
        caption: "Scroll-linked checkpoints for schema quality, pipeline resilience, signal integrity, and alert readiness",
        svg: `
          <div class="month4-visual-placeholder" aria-hidden="true"></div>
        `
      },
      "phase-5": {
        title: "Month 5 Integration Readiness",
        caption: "Integrated status signals and review checkpoint preparation",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="MVP service level dashboard with uptime and latency breakdown">
            <rect x="16" y="16" width="388" height="248" rx="14" fill="rgba(255, 251, 244, 0.76)" stroke="rgba(168, 145, 105, 0.42)" />

            <rect x="30" y="30" width="174" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Release readiness</text>
            <rect x="44" y="62" width="146" height="26" rx="7" fill="rgba(121, 145, 106, 0.3)" />
            <rect x="44" y="98" width="146" height="26" rx="7" fill="rgba(198, 162, 99, 0.3)" />
            <rect x="44" y="134" width="146" height="26" rx="7" fill="rgba(154, 132, 96, 0.3)" />
            <rect x="44" y="170" width="146" height="26" rx="7" fill="rgba(178, 124, 70, 0.3)" />
            <text x="54" y="79" font-size="9.5" fill="#2f3a2a" font-family="Inter, sans-serif">Signal dashboard: 96%</text>
            <text x="54" y="115" font-size="9.5" fill="#4d3f2d" font-family="Inter, sans-serif">Alert workflow: 94%</text>
            <text x="54" y="151" font-size="9.5" fill="#4d3f2d" font-family="Inter, sans-serif">API contract: 98%</text>
            <text x="54" y="187" font-size="9.5" fill="#4d3f2d" font-family="Inter, sans-serif">Mobile QA: 92%</text>
            <text x="44" y="220" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif" textLength="146" lengthAdjust="spacingAndGlyphs">Freeze breaches (30d): 0</text>

            <rect x="216" y="30" width="174" height="106" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="228" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Service reliability</text>
            <circle cx="264" cy="84" r="24" fill="none" stroke="rgba(167, 147, 112, 0.36)" stroke-width="8" />
            <circle cx="264" cy="84" r="24" fill="none" stroke="rgba(121, 145, 106, 0.88)" stroke-width="8" stroke-dasharray="138 13" transform="rotate(-90 264 84)" />
            <text x="264" y="87" text-anchor="middle" font-size="10" fill="#2f3a2a" font-family="Inter, sans-serif">99.2%</text>
            <text x="302" y="76" font-size="9.2" fill="#4d3f2d" font-family="Inter, sans-serif">Error budget</text>
            <text x="302" y="92" font-size="9.2" fill="#4d3f2d" font-family="Inter, sans-serif">consumed: 41%</text>
            <text x="302" y="108" font-size="9.2" fill="#4d3f2d" font-family="Inter, sans-serif">SLO breaches: 2</text>

            <rect x="216" y="144" width="174" height="106" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="228" y="162" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Latency p95 (ms)</text>
            <line x1="228" y1="236" x2="378" y2="236" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <rect x="238" y="204" width="20" height="32" rx="4" fill="rgba(121, 145, 106, 0.84)" />
            <rect x="270" y="188" width="20" height="48" rx="4" fill="rgba(198, 162, 99, 0.84)" />
            <rect x="302" y="176" width="20" height="60" rx="4" fill="rgba(154, 132, 96, 0.84)" />
            <rect x="334" y="196" width="20" height="40" rx="4" fill="rgba(178, 124, 70, 0.84)" />
            <text x="238" y="248" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">UI</text>
            <text x="270" y="248" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">API</text>
            <text x="302" y="248" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Alerts</text>
            <text x="334" y="248" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Auth</text>
          </svg>
        `
      },
      "phase-6": {
        title: "Early User Product-Market Fit Signals",
        caption: "Cohort retention heatmap paired with activation and feedback quality",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="Cohort heatmap and activation funnel for early user validation">
            <rect x="16" y="16" width="388" height="248" rx="14" fill="rgba(255, 251, 244, 0.76)" stroke="rgba(168, 145, 105, 0.42)" />

            <rect x="30" y="30" width="236" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Cohort retention matrix (W1-W8)</text>
            <text x="42" y="66" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">C1</text>
            <text x="42" y="92" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">C2</text>
            <text x="42" y="118" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">C3</text>
            <text x="42" y="144" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">C4</text>
            <g transform="translate(58 58)">
              <rect x="0" y="0" width="18" height="18" rx="3" fill="rgba(121, 145, 106, 0.88)" />
              <rect x="22" y="0" width="18" height="18" rx="3" fill="rgba(121, 145, 106, 0.78)" />
              <rect x="44" y="0" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.76)" />
              <rect x="66" y="0" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.72)" />
              <rect x="88" y="0" width="18" height="18" rx="3" fill="rgba(154, 132, 96, 0.74)" />
              <rect x="110" y="0" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.74)" />
              <rect x="132" y="0" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.68)" />
              <rect x="154" y="0" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.62)" />

              <rect x="0" y="24" width="18" height="18" rx="3" fill="rgba(121, 145, 106, 0.84)" />
              <rect x="22" y="24" width="18" height="18" rx="3" fill="rgba(121, 145, 106, 0.72)" />
              <rect x="44" y="24" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.74)" />
              <rect x="66" y="24" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.66)" />
              <rect x="88" y="24" width="18" height="18" rx="3" fill="rgba(154, 132, 96, 0.7)" />
              <rect x="110" y="24" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.68)" />
              <rect x="132" y="24" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.62)" />
              <rect x="154" y="24" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.56)" />

              <rect x="0" y="48" width="18" height="18" rx="3" fill="rgba(121, 145, 106, 0.8)" />
              <rect x="22" y="48" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.76)" />
              <rect x="44" y="48" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.7)" />
              <rect x="66" y="48" width="18" height="18" rx="3" fill="rgba(154, 132, 96, 0.72)" />
              <rect x="88" y="48" width="18" height="18" rx="3" fill="rgba(154, 132, 96, 0.66)" />
              <rect x="110" y="48" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.66)" />
              <rect x="132" y="48" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.58)" />
              <rect x="154" y="48" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.52)" />

              <rect x="0" y="72" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.82)" />
              <rect x="22" y="72" width="18" height="18" rx="3" fill="rgba(198, 162, 99, 0.72)" />
              <rect x="44" y="72" width="18" height="18" rx="3" fill="rgba(154, 132, 96, 0.72)" />
              <rect x="66" y="72" width="18" height="18" rx="3" fill="rgba(154, 132, 96, 0.66)" />
              <rect x="88" y="72" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.68)" />
              <rect x="110" y="72" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.62)" />
              <rect x="132" y="72" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.56)" />
              <rect x="154" y="72" width="18" height="18" rx="3" fill="rgba(178, 124, 70, 0.5)" />
            </g>
            <text x="58" y="170" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">W1 W2 W3 W4 W5 W6 W7 W8</text>
            <text x="58" y="192" font-size="8.6" fill="#72614b" font-family="Inter, sans-serif" textLength="150" lengthAdjust="spacingAndGlyphs">Median W8 retention: 46%</text>
            <text x="58" y="208" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif" textLength="176" lengthAdjust="spacingAndGlyphs">Activation-to-retained conversion: 64%</text>

            <rect x="276" y="30" width="114" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="288" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Pilot funnel + feedback</text>
            <polygon points="288,60 378,60 366,94 300,94" fill="rgba(198, 162, 99, 0.5)" />
            <text x="333" y="80" text-anchor="middle" font-size="10" fill="#4d3f2d" font-family="Inter, sans-serif">30 invited</text>
            <polygon points="300,100 366,100 356,134 310,134" fill="rgba(121, 145, 106, 0.56)" />
            <text x="333" y="120" text-anchor="middle" font-size="10" fill="#2f3a2a" font-family="Inter, sans-serif">22 active</text>
            <polygon points="310,140 356,140 348,174 318,174" fill="rgba(178, 124, 70, 0.56)" />
            <text x="333" y="160" text-anchor="middle" font-size="10" fill="#3f2d20" font-family="Inter, sans-serif">14 retained</text>
            <rect x="288" y="188" width="90" height="44" rx="6" fill="rgba(121, 145, 106, 0.24)" />
            <text x="296" y="206" font-size="8.8" fill="#2f3a2a" font-family="Inter, sans-serif">NPS: +31</text>
            <text x="296" y="222" font-size="8.8" fill="#2f3a2a" font-family="Inter, sans-serif">Depth: 4.2 sessions/user</text>
          </svg>
        `
      },
      "phase-7": {
        title: "Commercialisation Decision Matrix",
        caption: "Channel revenue mix plus pricing-conversion sensitivity for go-to-market strategy",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="Commercialisation revenue projection and price-conversion sensitivity matrix">
            <rect x="16" y="16" width="388" height="248" rx="14" fill="rgba(255, 251, 244, 0.76)" stroke="rgba(168, 145, 105, 0.42)" />

            <rect x="30" y="30" width="230" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">ARR build by channel (USDm)</text>
            <line x1="44" y1="226" x2="246" y2="226" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <line x1="44" y1="58" x2="44" y2="226" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <rect x="72" y="192" width="32" height="34" fill="rgba(198, 162, 99, 0.86)" />
            <rect x="72" y="172" width="32" height="20" fill="rgba(121, 145, 106, 0.86)" />
            <rect x="72" y="160" width="32" height="12" fill="rgba(178, 124, 70, 0.86)" />
            <rect x="72" y="152" width="32" height="8" fill="rgba(154, 132, 96, 0.86)" />
            <rect x="130" y="168" width="32" height="58" fill="rgba(198, 162, 99, 0.86)" />
            <rect x="130" y="132" width="32" height="36" fill="rgba(121, 145, 106, 0.86)" />
            <rect x="130" y="112" width="32" height="20" fill="rgba(178, 124, 70, 0.86)" />
            <rect x="130" y="100" width="32" height="12" fill="rgba(154, 132, 96, 0.86)" />
            <rect x="188" y="138" width="32" height="88" fill="rgba(198, 162, 99, 0.86)" />
            <rect x="188" y="84" width="32" height="54" fill="rgba(121, 145, 106, 0.86)" />
            <rect x="188" y="58" width="32" height="26" fill="rgba(178, 124, 70, 0.86)" />
            <rect x="188" y="44" width="32" height="14" fill="rgba(154, 132, 96, 0.86)" />
            <text x="88" y="242" text-anchor="middle" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif">Y1</text>
            <text x="146" y="242" text-anchor="middle" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif">Y2</text>
            <text x="204" y="242" text-anchor="middle" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif">Y3</text>
            <text x="42" y="72" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif">6.5</text>
            <text x="42" y="118" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif">4.0</text>
            <text x="42" y="164" font-size="8.4" fill="#72614b" font-family="Inter, sans-serif">2.0</text>

            <rect x="270" y="30" width="120" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="282" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Pricing sensitivity</text>
            <text x="282" y="64" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif" textLength="104" lengthAdjust="spacingAndGlyphs">Conversion vs annual price</text>
            <rect x="282" y="74" width="28" height="24" rx="4" fill="rgba(178, 124, 70, 0.76)" />
            <rect x="314" y="74" width="28" height="24" rx="4" fill="rgba(198, 162, 99, 0.76)" />
            <rect x="346" y="74" width="28" height="24" rx="4" fill="rgba(121, 145, 106, 0.76)" />
            <rect x="282" y="102" width="28" height="24" rx="4" fill="rgba(198, 162, 99, 0.76)" />
            <rect x="314" y="102" width="28" height="24" rx="4" fill="rgba(121, 145, 106, 0.76)" />
            <rect x="346" y="102" width="28" height="24" rx="4" fill="rgba(121, 145, 106, 0.86)" />
            <rect x="282" y="130" width="28" height="24" rx="4" fill="rgba(154, 132, 96, 0.76)" />
            <rect x="314" y="130" width="28" height="24" rx="4" fill="rgba(198, 162, 99, 0.76)" />
            <rect x="346" y="130" width="28" height="24" rx="4" fill="rgba(121, 145, 106, 0.84)" />
            <text x="282" y="165" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">$6k / $9k / $12k</text>
            <text x="282" y="182" font-size="9.2" fill="#3f3324" font-family="Inter, sans-serif">Best mix: $9k @ 28%</text>
            <text x="282" y="198" font-size="9.2" fill="#3f3324" font-family="Inter, sans-serif">Y3 ARR target: $6.4m</text>
            <text x="282" y="214" font-size="9.2" fill="#3f3324" font-family="Inter, sans-serif">Payback: 11 months</text>
          </svg>
        `
      }
    };
    return visuals[phaseId] || visuals["phase-1"];
  };

  const compactBullet = (value) => {
    const normalized = (value || "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.]+$/, "");

    if (!normalized) {
      return "";
    }

    if (normalized.length <= 108) {
      return `${normalized}.`;
    }

    if (normalized.includes(":")) {
      const [lead, ...restParts] = normalized.split(":");
      const details = restParts.join(":").split(/,|;/).map((part) => part.trim()).filter(Boolean).slice(0, 2);
      if (details.length) {
        return `${lead.trim()}: ${details.join(", ")}.`;
      }
    }

    const shortened = normalized.slice(0, 102).replace(/[,\s]+\S*$/, "");
    return `${shortened}...`;
  };

  const STANDARD_PHASE_BLOCKS = [
    {
      title: "Objectives",
      match: /objective/i,
      fallback: "Define the primary objective and measurable outcomes for this phase."
    },
    {
      title: "Key Workstreams",
      match: /workstream|deliverable|component|step|approach|monetisation/i,
      fallback: "Prioritise the core workstreams, owners, and delivery sequencing."
    },
    {
      title: "Exit Criteria",
      match: /exit|criteria/i,
      fallback: "Document completion criteria and readiness checks before phase transition."
    }
  ];

  const normalisePhaseSections = (phase) => {
    const rawSections = Array.isArray(phase.sections) ? phase.sections : [];
    const usedIndexes = new Set();

    return STANDARD_PHASE_BLOCKS.map((block, blockIndex) => {
      let sourceIndex = rawSections.findIndex((section, index) => {
        if (usedIndexes.has(index)) {
          return false;
        }
        return block.match.test(String(section?.title || ""));
      });

      if (sourceIndex === -1) {
        sourceIndex = rawSections.findIndex((_, index) => !usedIndexes.has(index));
      }

      const sourceSection = sourceIndex >= 0 ? rawSections[sourceIndex] : null;
      if (sourceIndex >= 0) {
        usedIndexes.add(sourceIndex);
      }

      let items = (sourceSection?.items || [])
        .map(compactBullet)
        .filter(Boolean)
        .slice(0, 5);

      if (!items.length) {
        items = [block.fallback];
      }

      // Keep consistent visual rhythm across phases.
      while (items.length < 3) {
        items.push(blockIndex === 2 ? "Readiness checkpoint pending definition." : "Additional detail to be confirmed.");
      }

      return {
        title: block.title,
        items
      };
    });
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getRawPhaseItems = (phase, titlePattern) => {
    const section = (phase.sections || []).find((entry) => titlePattern.test(String(entry?.title || "")));
    return (section?.items || []).map((item) => String(item || "").trim()).filter(Boolean);
  };

  const buildMonth4SlideMarkup = (phase) => {
    const objectives = getRawPhaseItems(phase, /objective/i);
    const workstreams = getRawPhaseItems(phase, /workstream/i);
    const exitCriteria = getRawPhaseItems(phase, /exit|criteria/i);

    const toItems = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    return `
      <div class="month4-validation-preview month4-validation-preview-full" data-month4-validation>
        <span class="month4-validation-kicker">Month 4 Actual Content Redo</span>
        <div class="month4-hero-row">
          <div class="month4-hero-copy">
            <h5 class="month4-validation-title">Validation Event Gates</h5>
            <p class="month4-validation-subtitle">
              This keeps the exact Month 4 content already defined: Objectives, Key Workstreams, and Exit Criteria.
              Only styling and spacing are upgraded to the same visual language as your reference.
            </p>
          </div>
          <span class="month4-hero-badge">Content unchanged</span>
        </div>

        <section class="month4-stage">
          <div class="month4-stage-head">
            <span class="month4-stage-label">Validation &amp; QA Workflow</span>
            <span class="month4-stage-progress">100%</span>
          </div>

          <article class="month4-layout-card">
            <div class="month4-layout-inner">
              <div class="month4-validation-shell-head">
                <div>
                  <span class="month4-shell-kicker">Validation Scroll Observer</span>
                  <h6 class="month4-shell-title">Month 4 - Validation &amp; QA Trigger Map</h6>
                </div>
                <div class="month4-shell-badges">
                  <span>enter: 80% 20%</span>
                  <span>debug: true</span>
                </div>
              </div>

              <div class="month4-gate-track" aria-hidden="true">
                <article class="month4-gate-node is-pass" style="--gate-delay: 0ms;">
                  <span class="month4-gate-dot">OK</span>
                  <span class="month4-gate-name">Schema &amp; Completeness</span>
                  <span class="month4-gate-id">Gate 01</span>
                </article>
                <article class="month4-gate-node is-pass" style="--gate-delay: 120ms;">
                  <span class="month4-gate-dot">OK</span>
                  <span class="month4-gate-name">Pipeline Reliability</span>
                  <span class="month4-gate-id">Gate 02</span>
                </article>
                <article class="month4-gate-node is-review" style="--gate-delay: 240ms;">
                  <span class="month4-gate-dot">RV</span>
                  <span class="month4-gate-name">Signal Integrity</span>
                  <span class="month4-gate-id">Gate 03</span>
                </article>
                <article class="month4-gate-node is-ready" style="--gate-delay: 360ms;">
                  <span class="month4-gate-dot">RD</span>
                  <span class="month4-gate-name">Monitoring &amp; Alerts</span>
                  <span class="month4-gate-id">Gate 04</span>
                </article>
              </div>

              <div class="month4-gate-grid" data-month4-scroll>
                <article class="month4-gate-card is-pass" style="--gate-delay: 0ms;">
                  <div class="month4-gate-card-top">
                    <span class="month4-gate-icon">DB</span>
                    <span class="month4-gate-status">Pass</span>
                  </div>
                  <h6>Schema &amp; Completeness</h6>
                  <p>Required fields, types, and missingness thresholds.</p>
                  <div class="month4-gate-metric">99.3% fields valid</div>
                </article>

                <article class="month4-gate-card is-pass" style="--gate-delay: 120ms;">
                  <div class="month4-gate-card-top">
                    <span class="month4-gate-icon">PL</span>
                    <span class="month4-gate-status">Pass</span>
                  </div>
                  <h6>Pipeline Reliability</h6>
                  <p>Retries, backfills, reruns, and recovery behaviour.</p>
                  <div class="month4-gate-metric">14-day stable run</div>
                </article>

                <article class="month4-gate-card is-review" style="--gate-delay: 240ms;">
                  <div class="month4-gate-card-top">
                    <span class="month4-gate-icon">SG</span>
                    <span class="month4-gate-status">Review</span>
                  </div>
                  <h6>Signal Integrity</h6>
                  <p>Baseline checks, regime sensitivity, and drift review.</p>
                  <div class="month4-gate-metric">Drift within band</div>
                </article>

                <article class="month4-gate-card is-ready" style="--gate-delay: 360ms;">
                  <div class="month4-gate-card-top">
                    <span class="month4-gate-icon">AL</span>
                    <span class="month4-gate-status">Ready</span>
                  </div>
                  <h6>Monitoring &amp; Alerts</h6>
                  <p>Freshness, anomaly, and failure escalation rules.</p>
                  <div class="month4-gate-metric">8 alert rules live</div>
                </article>
              </div>

              <div class="month4-content-grid">
                <article class="month4-content-card">
                  <h6>Objectives</h6>
                  <ul>${toItems(objectives)}</ul>
                </article>
                <article class="month4-content-card">
                  <h6>Key Workstreams</h6>
                  <ul>${toItems(workstreams)}</ul>
                </article>
                <article class="month4-content-card">
                  <h6>Exit Criteria</h6>
                  <ul>${toItems(exitCriteria)}</ul>
                </article>
              </div>
            </div>
          </article>
        </section>
      </div>
    `;
  };

  const initRoadmapTimeline = () => {
    const chips = Array.from(document.querySelectorAll(".mission-phase-chip"));
    const timelineLayoutEl = document.querySelector(".mission-timeline-layout");
    const panelEl = document.getElementById("missionTimelinePanel");
    const rangeEl = document.getElementById("missionPhaseRange");
    const statusEl = document.getElementById("missionPhaseStatus");
    const titleEl = document.getElementById("missionPhaseTitle");
    const summaryEl = document.getElementById("missionPhaseSummary");
    const groupsEl = document.getElementById("missionPhaseGroups");
    const visualTitleEl = document.getElementById("missionPhaseVisualTitle");
    const visualCanvasEl = document.getElementById("missionPhaseVisualCanvas");
    const phaseHeaderEl = panelEl?.querySelector(".mission-phase-header");

    if (
      !chips.length ||
      !panelEl ||
      !rangeEl ||
      !statusEl ||
      !titleEl ||
      !summaryEl ||
      !groupsEl ||
      !visualTitleEl ||
      !visualCanvasEl
    ) {
      return;
    }

    const visualCardEl = visualCanvasEl.closest(".mission-phase-visual-card");
    const phaseSwapTargets = [panelEl, visualCardEl].filter(Boolean);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let swapTimer = null;
    let resizeTimer = null;
    let isMeasuringHeights = false;
    const measuredHeightsByPhase = new Map();
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.25;
    const zoomStateMap = new WeakMap();
    let activeZoomDrag = null;
    let destroyPhaseVisualEnhancements = () => {};

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const clearActiveZoomDrag = () => {
      if (!activeZoomDrag) {
        return;
      }
      activeZoomDrag.root.classList.remove("is-dragging");
      activeZoomDrag = null;
    };

    const getZoomState = (zoomRoot) => {
      const existing = zoomStateMap.get(zoomRoot);
      if (existing) {
        return existing;
      }

      const initial = { scale: ZOOM_MIN, x: 0, y: 0 };
      zoomStateMap.set(zoomRoot, initial);
      return initial;
    };

    const applyZoomState = (zoomRoot) => {
      const imageEl = zoomRoot.querySelector("[data-zoom-image]");
      if (!imageEl) {
        return;
      }

      const state = getZoomState(zoomRoot);
      const maxOffsetX = (zoomRoot.clientWidth * (state.scale - 1)) / 2;
      const maxOffsetY = (zoomRoot.clientHeight * (state.scale - 1)) / 2;
      state.x = clamp(state.x, -maxOffsetX, maxOffsetX);
      state.y = clamp(state.y, -maxOffsetY, maxOffsetY);

      imageEl.style.transform = `translate(${state.x.toFixed(1)}px, ${state.y.toFixed(1)}px) scale(${state.scale.toFixed(2)})`;
      zoomRoot.classList.toggle("is-zoomed", state.scale > ZOOM_MIN + 0.001);

      const levelEl = zoomRoot.querySelector("[data-zoom-level]");
      if (levelEl) {
        levelEl.textContent = `${Math.round(state.scale * 100)}%`;
      }

      const zoomOutBtn = zoomRoot.querySelector('[data-zoom-action="out"]');
      const zoomInBtn = zoomRoot.querySelector('[data-zoom-action="in"]');
      const resetBtn = zoomRoot.querySelector('[data-zoom-action="reset"]');
      const isDefaultView =
        state.scale <= ZOOM_MIN + 0.001 &&
        Math.abs(state.x) < 0.1 &&
        Math.abs(state.y) < 0.1;

      if (zoomOutBtn) {
        zoomOutBtn.disabled = state.scale <= ZOOM_MIN + 0.001;
      }
      if (zoomInBtn) {
        zoomInBtn.disabled = state.scale >= ZOOM_MAX - 0.001;
      }
      if (resetBtn) {
        resetBtn.disabled = isDefaultView;
      }
    };

    const adjustZoom = (zoomRoot, nextScale) => {
      const state = getZoomState(zoomRoot);
      state.scale = clamp(nextScale, ZOOM_MIN, ZOOM_MAX);
      if (state.scale <= ZOOM_MIN + 0.001) {
        state.scale = ZOOM_MIN;
        state.x = 0;
        state.y = 0;
      }
      applyZoomState(zoomRoot);
    };

    const initPhaseVisualZoom = () => {
      clearActiveZoomDrag();
      const zoomRoot = visualCanvasEl.querySelector("[data-zoom-root]");
      if (!zoomRoot) {
        return;
      }
      getZoomState(zoomRoot);
      applyZoomState(zoomRoot);
    };

    const initMonth4ValidationVisual = () => {
      const month4Root =
        groupsEl.querySelector("[data-month4-validation]") ||
        visualCanvasEl.querySelector("[data-month4-validation]");
      if (!month4Root) {
        return () => {};
      }

      const activationTarget = month4Root.querySelector("[data-month4-scroll]") || month4Root;
      const reveal = () => {
        month4Root.classList.add("is-visible");
      };

      if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
        reveal();
        return () => {};
      }

      let revealed = false;
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (!entry || !entry.isIntersecting || revealed) {
            return;
          }
          revealed = true;
          reveal();
          observer.disconnect();
        },
        { threshold: 0.24 }
      );

      observer.observe(activationTarget);
      return () => observer.disconnect();
    };

    visualCanvasEl.addEventListener("click", (event) => {
      const actionBtn = event.target.closest("[data-zoom-action]");
      if (!actionBtn || !visualCanvasEl.contains(actionBtn)) {
        return;
      }

      const zoomRoot = actionBtn.closest("[data-zoom-root]");
      if (!zoomRoot) {
        return;
      }

      const state = getZoomState(zoomRoot);
      const action = actionBtn.dataset.zoomAction;
      if (action === "in") {
        adjustZoom(zoomRoot, state.scale + ZOOM_STEP);
      } else if (action === "out") {
        adjustZoom(zoomRoot, state.scale - ZOOM_STEP);
      } else if (action === "reset") {
        state.x = 0;
        state.y = 0;
        adjustZoom(zoomRoot, ZOOM_MIN);
      }
    });

    visualCanvasEl.addEventListener(
      "wheel",
      (event) => {
        const zoomRoot = event.target.closest("[data-zoom-root]");
        if (!zoomRoot || !visualCanvasEl.contains(zoomRoot)) {
          return;
        }

        event.preventDefault();
        const state = getZoomState(zoomRoot);
        const direction = event.deltaY < 0 ? 1 : -1;
        adjustZoom(zoomRoot, state.scale + direction * ZOOM_STEP);
      },
      { passive: false }
    );

    visualCanvasEl.addEventListener("pointerdown", (event) => {
      const zoomRoot = event.target.closest("[data-zoom-root]");
      if (!zoomRoot || !visualCanvasEl.contains(zoomRoot)) {
        return;
      }
      if (event.target.closest("[data-zoom-controls]")) {
        return;
      }

      const state = getZoomState(zoomRoot);
      if (state.scale <= ZOOM_MIN + 0.001) {
        return;
      }

      activeZoomDrag = {
        root: zoomRoot,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: state.x,
        startY: state.y
      };
      zoomRoot.classList.add("is-dragging");
      if (typeof zoomRoot.setPointerCapture === "function") {
        zoomRoot.setPointerCapture(event.pointerId);
      }
    });

    visualCanvasEl.addEventListener("pointermove", (event) => {
      if (!activeZoomDrag || activeZoomDrag.pointerId !== event.pointerId) {
        return;
      }

      const state = getZoomState(activeZoomDrag.root);
      state.x = activeZoomDrag.startX + (event.clientX - activeZoomDrag.startClientX);
      state.y = activeZoomDrag.startY + (event.clientY - activeZoomDrag.startClientY);
      applyZoomState(activeZoomDrag.root);
    });

    const endZoomDrag = (event) => {
      if (!activeZoomDrag || activeZoomDrag.pointerId !== event.pointerId) {
        return;
      }

      const { root } = activeZoomDrag;
      root.classList.remove("is-dragging");
      if (
        typeof root.releasePointerCapture === "function" &&
        typeof root.hasPointerCapture === "function" &&
        root.hasPointerCapture(event.pointerId)
      ) {
        root.releasePointerCapture(event.pointerId);
      }
      activeZoomDrag = null;
    };

    visualCanvasEl.addEventListener("pointerup", endZoomDrag);
    visualCanvasEl.addEventListener("pointercancel", endZoomDrag);

    const applyMeasuredHeights = (phaseId) => {
      const measured = measuredHeightsByPhase.get(phaseId);
      if (!measured) {
        panelEl.style.minHeight = "";
        if (visualCardEl) {
          visualCardEl.style.minHeight = "";
        }
        return;
      }

      panelEl.style.minHeight = `${measured.panel}px`;
      if (visualCardEl) {
        if (measured.visual > 0) {
          visualCardEl.style.minHeight = `${measured.visual}px`;
        } else {
          visualCardEl.style.minHeight = "";
        }
      }
    };

    const renderPhase = (phase) => {
      rangeEl.textContent = phase.range || "";
      titleEl.textContent = phase.title || "";
      summaryEl.textContent = phase.summary || "";
      summaryEl.style.display = phase.summary ? "" : "none";

      if (phase.status) {
        statusEl.textContent = phase.status;
        statusEl.classList.remove("is-hidden");
      } else {
        statusEl.textContent = "";
        statusEl.classList.add("is-hidden");
      }

      const visual = getPhaseVisual(phase.id);
      visualTitleEl.textContent = visual.title;
      visualCanvasEl.innerHTML = visual.svg;
      destroyPhaseVisualEnhancements();
      destroyPhaseVisualEnhancements = () => {};

      const isDataLayoutPhase = phase.id === "phase-2";
      const isModelValidationPhase = phase.id === "phase-3";
      const isMonth4ValidationPhase = phase.id === "phase-4";
      const isExpandedVisualPhase = phase.id === "phase-1" || isDataLayoutPhase || isModelValidationPhase;
      if (timelineLayoutEl) {
        timelineLayoutEl.classList.toggle("is-data-layout-focus", isDataLayoutPhase);
        timelineLayoutEl.classList.toggle("is-model-validation-focus", isModelValidationPhase);
        timelineLayoutEl.classList.toggle("is-month4-validation-focus", isMonth4ValidationPhase);
      }
      panelEl.classList.toggle("is-model-validation-focus", isModelValidationPhase);
      panelEl.classList.toggle("is-month4-full-slide", isMonth4ValidationPhase);
      groupsEl.classList.toggle("is-month4-full-slide", isMonth4ValidationPhase);
      if (phaseHeaderEl) {
        phaseHeaderEl.classList.toggle("is-hidden", isMonth4ValidationPhase);
      }
      titleEl.classList.toggle("is-hidden", isMonth4ValidationPhase);
      summaryEl.classList.toggle("is-hidden", isMonth4ValidationPhase);
      if (visualCardEl) {
        visualCardEl.classList.toggle("is-data-layout-focus", isDataLayoutPhase);
        visualCardEl.classList.toggle("is-model-validation-focus", isModelValidationPhase);
        visualCardEl.classList.toggle("is-month4-validation-focus", isMonth4ValidationPhase);
        visualCardEl.classList.toggle("is-expanded-visual", isExpandedVisualPhase);
        visualCardEl.classList.toggle("is-hidden", isMonth4ValidationPhase);
      }

      if (!isMeasuringHeights) {
        applyMeasuredHeights(phase.id);
      }

      initPhaseVisualZoom();
      groupsEl.innerHTML = "";
      if (isMonth4ValidationPhase) {
        groupsEl.innerHTML = buildMonth4SlideMarkup(phase);
      } else {
        normalisePhaseSections(phase).forEach((section) => {
          const wrapper = document.createElement("section");
          wrapper.className = "mission-phase-group";

          const heading = document.createElement("h5");
          heading.textContent = section.title || "";
          wrapper.appendChild(heading);

          const list = document.createElement("ul");
          const maxItems = section.title === "Key Workstreams" ? 5 : 3;
          const conciseItems = (section.items || [])
            .map(compactBullet)
            .filter(Boolean)
            .slice(0, maxItems);

          conciseItems.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            list.appendChild(li);
          });
          wrapper.appendChild(list);

          groupsEl.appendChild(wrapper);
        });
      }
      destroyPhaseVisualEnhancements = initMonth4ValidationVisual();
    };

    const swapPhaseContent = (phase, skipTransition) => {
      if (swapTimer) {
        window.clearTimeout(swapTimer);
        swapTimer = null;
      }

      if (skipTransition || prefersReducedMotion) {
        renderPhase(phase);
        return;
      }

      phaseSwapTargets.forEach((target) => target.classList.add("is-switching"));
      swapTimer = window.setTimeout(() => {
        renderPhase(phase);
        requestAnimationFrame(() => {
          phaseSwapTargets.forEach((target) => target.classList.remove("is-switching"));
          swapTimer = null;
        });
      }, 150);
    };

    const lockTimelineHeights = (activePhaseId) => {
      const activePhase = roadmapPhases.find((phase) => phase.id === activePhaseId) || roadmapPhases[0];

      if (timelineLayoutEl) {
        timelineLayoutEl.classList.add("is-measuring");
      }

      isMeasuringHeights = true;
      measuredHeightsByPhase.clear();
      roadmapPhases.forEach((phase) => {
        renderPhase(phase);
        measuredHeightsByPhase.set(phase.id, {
          panel: Math.ceil(panelEl.scrollHeight),
          visual:
            visualCardEl && !visualCardEl.classList.contains("is-hidden")
              ? Math.ceil(visualCardEl.scrollHeight)
              : 0
        });
      });
      isMeasuringHeights = false;

      renderPhase(activePhase);
      applyMeasuredHeights(activePhase.id);
      if (timelineLayoutEl) {
        timelineLayoutEl.classList.remove("is-measuring");
      }
    };

    const scheduleHeightLock = () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        const activeChip = chips.find((item) => item.classList.contains("is-active")) || chips[0];
        lockTimelineHeights(activeChip.dataset.phaseId);
      }, 160);
    };

    const setActiveChip = (chip, shouldFocus) => {
      const phase = roadmapPhases.find((entry) => entry.id === chip.dataset.phaseId);
      if (!phase) {
        return;
      }
      const isAlreadyActive = chip.classList.contains("is-active");

      chips.forEach((item) => {
        const active = item === chip;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", active ? "true" : "false");
        item.tabIndex = active ? 0 : -1;
      });

      panelEl.setAttribute("aria-labelledby", chip.id);
      if (!isAlreadyActive) {
        swapPhaseContent(phase, false);
      }

      if (shouldFocus) {
        chip.focus();
      }
    };

    chips.forEach((chip, index) => {
      if (!chip.id) {
        chip.id = `missionPhaseTab${index + 1}`;
      }
      chip.addEventListener("click", () => setActiveChip(chip, false));
      chip.addEventListener("focus", () => setActiveChip(chip, false));

      chip.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
          return;
        }

        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + direction + chips.length) % chips.length;
        setActiveChip(chips[nextIndex], true);
      });
    });

    const defaultChip = chips.find((chip) => chip.classList.contains("is-active")) || chips[0];
    chips.forEach((chip) => {
      const active = chip === defaultChip;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-selected", active ? "true" : "false");
      chip.tabIndex = active ? 0 : -1;
    });
    panelEl.setAttribute("aria-labelledby", defaultChip.id);
    renderPhase(roadmapPhases.find((entry) => entry.id === defaultChip.dataset.phaseId) || roadmapPhases[0]);
    lockTimelineHeights(defaultChip.dataset.phaseId);
    window.addEventListener("resize", scheduleHeightLock);
  };

  initRoadmapTimeline();
})();

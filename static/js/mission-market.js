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
      title: "Month 3 — Pipeline Build-Out",
      range: "Month 3",
      status: "Upcoming",
      summary:
        "Implement ingestion and transformation layers based on the approved month 2 data layout.",
      sections: [
        {
          title: "Objectives",
          items: [
            "Build ingest and transform stages against the agreed schema."
          ]
        },
        {
          title: "Key Workstreams",
          items: [
            "Implement source adapters and unified ingest entrypoints.",
            "Build transformation layer for normalisation and enrichment.",
            "Enable scheduled refresh and run logging."
          ]
        },
        {
          title: "Exit Criteria",
          items: [
            "Core sources flow end-to-end through pipeline.",
            "Transformation outputs match schema requirements.",
            "Scheduled refresh jobs complete without critical failure."
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
        "Harden reliability with validation rules, QA checks, and quality monitoring across the new data pipeline.",
      sections: [
        {
          title: "Objectives",
          items: [
            "Raise confidence in data quality and operational reliability."
          ]
        },
        {
          title: "Key Workstreams",
          items: [
            "Add validation checks for completeness, uniqueness, and timestamp consistency.",
            "Create QA dashboards and alerting thresholds.",
            "Run test cycles for edge cases and recovery behavior."
          ]
        },
        {
          title: "Exit Criteria",
          items: [
            "Validation suite passes expected quality thresholds.",
            "Alerting catches known failure scenarios.",
            "QA sign-off completed for month 5 integration."
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
        title: "Month 1 Recap Visual",
        caption: "Preliminary test outcomes and planning alignment",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="Ingestion reliability dashboard with latency trend and validation matrix">
            <defs>
              <linearGradient id="p1Bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="rgba(255, 251, 244, 0.82)" />
                <stop offset="100%" stop-color="rgba(247, 238, 222, 0.68)" />
              </linearGradient>
            </defs>
            <rect x="16" y="16" width="388" height="248" rx="14" fill="url(#p1Bg)" stroke="rgba(168, 145, 105, 0.42)" />

            <text x="30" y="36" font-size="9.4" fill="#5b4e3d" font-family="Inter, sans-serif" textLength="170" lengthAdjust="spacingAndGlyphs">Pipeline stages (median latency, ms)</text>
            <rect x="30" y="46" width="70" height="36" rx="8" fill="rgba(198, 162, 99, 0.72)" />
            <rect x="116" y="46" width="78" height="36" rx="8" fill="rgba(121, 145, 106, 0.72)" />
            <rect x="210" y="46" width="78" height="36" rx="8" fill="rgba(154, 132, 96, 0.72)" />
            <rect x="304" y="46" width="86" height="36" rx="8" fill="rgba(178, 124, 70, 0.72)" />
            <text x="65" y="61" text-anchor="middle" font-size="9" fill="#3f3324" font-family="Inter, sans-serif">Sources</text>
            <text x="65" y="74" text-anchor="middle" font-size="9" fill="#3f3324" font-family="Inter, sans-serif">24 feeds</text>
            <text x="155" y="61" text-anchor="middle" font-size="9" fill="#2f3a2a" font-family="Inter, sans-serif">Ingest</text>
            <text x="155" y="74" text-anchor="middle" font-size="9" fill="#2f3a2a" font-family="Inter, sans-serif">112 ms</text>
            <text x="249" y="61" text-anchor="middle" font-size="9" fill="#3b3023" font-family="Inter, sans-serif">Validate</text>
            <text x="249" y="74" text-anchor="middle" font-size="9" fill="#3b3023" font-family="Inter, sans-serif">186 ms</text>
            <text x="347" y="61" text-anchor="middle" font-size="9" fill="#3f2d20" font-family="Inter, sans-serif">Store</text>
            <text x="347" y="74" text-anchor="middle" font-size="9" fill="#3f2d20" font-family="Inter, sans-serif">83 ms</text>
            <line x1="100" y1="64" x2="116" y2="64" stroke="rgba(137, 112, 75, 0.88)" stroke-width="2.6" />
            <line x1="194" y1="64" x2="210" y2="64" stroke="rgba(137, 112, 75, 0.88)" stroke-width="2.6" />
            <line x1="288" y1="64" x2="304" y2="64" stroke="rgba(137, 112, 75, 0.88)" stroke-width="2.6" />

            <rect x="30" y="98" width="176" height="152" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.32)" />
            <text x="42" y="116" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Ingestion success rate (7d)</text>
            <line x1="44" y1="232" x2="194" y2="232" stroke="rgba(167, 147, 112, 0.56)" stroke-width="1.4" />
            <line x1="44" y1="126" x2="44" y2="232" stroke="rgba(167, 147, 112, 0.56)" stroke-width="1.4" />
            <path d="M44 216L69 212L94 205L119 204L144 196L169 192L194 186" fill="none" stroke="rgba(121, 145, 106, 0.92)" stroke-width="3" />
            <path d="M44 222L69 218L94 213L119 214L144 209L169 205L194 201" fill="none" stroke="rgba(178, 124, 70, 0.84)" stroke-width="2.2" stroke-dasharray="6 5" />
            <text x="48" y="142" font-size="8" fill="#73624b" font-family="Inter, sans-serif">100%</text>
            <text x="48" y="202" font-size="8" fill="#73624b" font-family="Inter, sans-serif">98%</text>
            <text x="48" y="246" font-size="8" fill="#73624b" font-family="Inter, sans-serif">T-6 ... T0</text>

            <rect x="216" y="98" width="174" height="152" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.32)" />
            <text x="228" y="116" font-size="9.2" fill="#5b4e3d" font-family="Inter, sans-serif" textLength="150" lengthAdjust="spacingAndGlyphs">Validation pass rate by rule family</text>
            <text x="228" y="132" font-size="8" fill="#776650" font-family="Inter, sans-serif">Schema</text>
            <text x="228" y="154" font-size="8" fill="#776650" font-family="Inter, sans-serif">Timestamp</text>
            <text x="228" y="176" font-size="8" fill="#776650" font-family="Inter, sans-serif">Duplicate</text>
            <text x="228" y="198" font-size="8" fill="#776650" font-family="Inter, sans-serif">Missing</text>
            <text x="228" y="220" font-size="8" fill="#776650" font-family="Inter, sans-serif">ID map</text>
            <rect x="274" y="124" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.82)" />
            <rect x="306" y="124" width="30" height="14" rx="3" fill="rgba(198, 162, 99, 0.8)" />
            <rect x="338" y="124" width="30" height="14" rx="3" fill="rgba(178, 124, 70, 0.76)" />
            <rect x="274" y="146" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.76)" />
            <rect x="306" y="146" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.76)" />
            <rect x="338" y="146" width="30" height="14" rx="3" fill="rgba(198, 162, 99, 0.76)" />
            <rect x="274" y="168" width="30" height="14" rx="3" fill="rgba(198, 162, 99, 0.76)" />
            <rect x="306" y="168" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.8)" />
            <rect x="338" y="168" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.8)" />
            <rect x="274" y="190" width="30" height="14" rx="3" fill="rgba(178, 124, 70, 0.78)" />
            <rect x="306" y="190" width="30" height="14" rx="3" fill="rgba(198, 162, 99, 0.76)" />
            <rect x="338" y="190" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.76)" />
            <rect x="274" y="212" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.78)" />
            <rect x="306" y="212" width="30" height="14" rx="3" fill="rgba(121, 145, 106, 0.78)" />
            <rect x="338" y="212" width="30" height="14" rx="3" fill="rgba(198, 162, 99, 0.78)" />
            <text x="275" y="242" font-size="8" fill="#776650" font-family="Inter, sans-serif">News</text>
            <text x="308" y="242" font-size="8" fill="#776650" font-family="Inter, sans-serif">Social</text>
            <text x="340" y="242" font-size="8" fill="#776650" font-family="Inter, sans-serif">Macro</text>
          </svg>
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
        title: "Month 3 Build Progress View",
        caption: "Ingestion and transformation implementation status against the approved layout",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="Walk-forward validation blocks with out-of-sample equity and metrics">
            <rect x="16" y="16" width="388" height="248" rx="14" fill="rgba(255, 251, 244, 0.76)" stroke="rgba(168, 145, 105, 0.42)" />

            <rect x="30" y="28" width="360" height="58" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="45" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Walk-forward folds (train/validate/test)</text>
            <rect x="44" y="56" width="88" height="14" rx="4" fill="rgba(121, 145, 106, 0.72)" />
            <rect x="136" y="56" width="34" height="14" rx="4" fill="rgba(198, 162, 99, 0.72)" />
            <rect x="174" y="56" width="30" height="14" rx="4" fill="rgba(178, 124, 70, 0.74)" />
            <rect x="216" y="56" width="88" height="14" rx="4" fill="rgba(121, 145, 106, 0.72)" />
            <rect x="308" y="56" width="34" height="14" rx="4" fill="rgba(198, 162, 99, 0.72)" />
            <rect x="346" y="56" width="30" height="14" rx="4" fill="rgba(178, 124, 70, 0.74)" />

            <rect x="30" y="96" width="232" height="156" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="114" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Out-of-sample cumulative return</text>
            <line x1="46" y1="236" x2="246" y2="236" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <line x1="46" y1="126" x2="46" y2="236" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <path d="M46 224L70 220L94 210L118 202L142 190L166 182L190 168L214 156L238 146" fill="none" stroke="rgba(178, 124, 70, 0.9)" stroke-width="3.2" />
            <path d="M46 226L70 224L94 220L118 214L142 207L166 202L190 196L214 190L238 186" fill="none" stroke="rgba(121, 145, 106, 0.88)" stroke-width="2.5" stroke-dasharray="6 5" />
            <text x="52" y="140" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">Model ensemble</text>
            <text x="52" y="153" font-size="8.5" fill="#72614b" font-family="Inter, sans-serif">Momentum baseline</text>

            <rect x="272" y="96" width="118" height="156" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="284" y="114" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Robustness checks</text>
            <text x="284" y="136" font-size="10.5" fill="#3f3324" font-family="Inter, sans-serif">IR: 0.84</text>
            <text x="284" y="154" font-size="10.5" fill="#3f3324" font-family="Inter, sans-serif">Sharpe: 1.31</text>
            <text x="284" y="172" font-size="10.5" fill="#3f3324" font-family="Inter, sans-serif">Hit rate: 57%</text>
            <text x="284" y="190" font-size="10.5" fill="#3f3324" font-family="Inter, sans-serif">Max DD: 6.8%</text>
            <text x="284" y="208" font-size="10.5" fill="#3f3324" font-family="Inter, sans-serif">Turnover: 0.42</text>
            <rect x="284" y="220" width="94" height="18" rx="5" fill="rgba(121, 145, 106, 0.28)" />
            <text x="331" y="232" text-anchor="middle" font-size="8.5" fill="#2f3a2a" font-family="Inter, sans-serif">No leakage flags</text>
          </svg>
        `
      },
      "phase-4": {
        title: "Month 4 Validation Dashboard",
        caption: "Validation coverage, quality gates, and QA readiness signals",
        svg: `
          <svg viewBox="0 0 420 280" role="img" aria-label="Waterfall of gross to net alpha and regime sensitivity">
            <rect x="16" y="16" width="388" height="248" rx="14" fill="rgba(255, 251, 244, 0.76)" stroke="rgba(168, 145, 105, 0.42)" />

            <rect x="30" y="30" width="226" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="42" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Alpha waterfall (% annualised)</text>
            <line x1="44" y1="226" x2="242" y2="226" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <rect x="56" y="136" width="28" height="90" rx="4" fill="rgba(121, 145, 106, 0.84)" />
            <text x="70" y="128" text-anchor="middle" font-size="8.5" fill="#2f3a2a" font-family="Inter, sans-serif">+14.8</text>
            <rect x="96" y="136" width="28" height="26" rx="4" fill="rgba(178, 124, 70, 0.82)" />
            <text x="110" y="128" text-anchor="middle" font-size="8.5" fill="#3f2d20" font-family="Inter, sans-serif">-2.1</text>
            <rect x="136" y="162" width="28" height="18" rx="4" fill="rgba(198, 162, 99, 0.82)" />
            <text x="150" y="154" text-anchor="middle" font-size="8.5" fill="#4d3f2d" font-family="Inter, sans-serif">-1.4</text>
            <rect x="176" y="180" width="28" height="16" rx="4" fill="rgba(154, 132, 96, 0.82)" />
            <text x="190" y="172" text-anchor="middle" font-size="8.5" fill="#4d3f2d" font-family="Inter, sans-serif">-1.7</text>
            <rect x="216" y="168" width="28" height="58" rx="4" fill="rgba(121, 145, 106, 0.88)" />
            <text x="230" y="160" text-anchor="middle" font-size="8.5" fill="#2f3a2a" font-family="Inter, sans-serif">9.6 net</text>
            <line x1="84" y1="136" x2="96" y2="136" stroke="rgba(126, 106, 79, 0.85)" stroke-width="1.4" />
            <line x1="124" y1="162" x2="136" y2="162" stroke="rgba(126, 106, 79, 0.85)" stroke-width="1.4" />
            <line x1="164" y1="180" x2="176" y2="180" stroke="rgba(126, 106, 79, 0.85)" stroke-width="1.4" />
            <line x1="204" y1="196" x2="216" y2="196" stroke="rgba(126, 106, 79, 0.85)" stroke-width="1.4" />
            <text x="56" y="244" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Gross</text>
            <text x="95" y="244" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Slip</text>
            <text x="138" y="244" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Fees</text>
            <text x="174" y="244" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Impact</text>
            <text x="214" y="244" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Net</text>

            <rect x="266" y="30" width="124" height="220" rx="10" fill="rgba(255, 251, 244, 0.64)" stroke="rgba(168, 145, 105, 0.3)" />
            <text x="278" y="48" font-size="10" fill="#5b4e3d" font-family="Inter, sans-serif">Regime sensitivity</text>
            <line x1="280" y1="226" x2="376" y2="226" stroke="rgba(165, 144, 109, 0.58)" stroke-width="1.4" />
            <rect x="286" y="184" width="18" height="42" rx="4" fill="rgba(121, 145, 106, 0.82)" />
            <rect x="312" y="170" width="18" height="56" rx="4" fill="rgba(198, 162, 99, 0.82)" />
            <rect x="338" y="196" width="18" height="30" rx="4" fill="rgba(178, 124, 70, 0.82)" />
            <text x="286" y="238" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Low vol</text>
            <text x="312" y="238" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Normal</text>
            <text x="338" y="238" font-size="8.2" fill="#72614b" font-family="Inter, sans-serif">Shock</text>
            <text x="278" y="102" font-size="9.5" fill="#3f3324" font-family="Inter, sans-serif">Sharpe by regime</text>
            <text x="278" y="122" font-size="9.2" fill="#3f3324" font-family="Inter, sans-serif">Low vol: 1.48</text>
            <text x="278" y="138" font-size="9.2" fill="#3f3324" font-family="Inter, sans-serif">Normal: 1.12</text>
            <text x="278" y="154" font-size="9.2" fill="#3f3324" font-family="Inter, sans-serif">Shock: 0.71</text>
          </svg>
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
        .slice(0, 3);

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
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 4;
    const ZOOM_STEP = 0.25;
    const zoomStateMap = new WeakMap();
    let activeZoomDrag = null;

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

      const isDataLayoutPhase = phase.id === "phase-2";
      if (timelineLayoutEl) {
        timelineLayoutEl.classList.toggle("is-data-layout-focus", isDataLayoutPhase);
      }
      if (visualCardEl) {
        visualCardEl.classList.toggle("is-data-layout-focus", isDataLayoutPhase);
      }

      initPhaseVisualZoom();

      groupsEl.innerHTML = "";
      normalisePhaseSections(phase).forEach((section) => {
        const wrapper = document.createElement("section");
        wrapper.className = "mission-phase-group";

        const heading = document.createElement("h5");
        heading.textContent = section.title || "";
        wrapper.appendChild(heading);

        const list = document.createElement("ul");
        const conciseItems = (section.items || [])
          .map(compactBullet)
          .filter(Boolean)
          .slice(0, 3);

        conciseItems.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          list.appendChild(li);
        });
        wrapper.appendChild(list);

        groupsEl.appendChild(wrapper);
      });
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
      let maxPanelHeight = 0;
      let maxVisualHeight = 0;

      if (timelineLayoutEl) {
        timelineLayoutEl.classList.add("is-measuring");
      }

      roadmapPhases.forEach((phase) => {
        renderPhase(phase);
        maxPanelHeight = Math.max(maxPanelHeight, panelEl.scrollHeight);
        if (visualCardEl) {
          maxVisualHeight = Math.max(maxVisualHeight, visualCardEl.scrollHeight);
        }
      });

      if (maxPanelHeight) {
        panelEl.style.minHeight = `${Math.ceil(maxPanelHeight)}px`;
      }
      if (visualCardEl && maxVisualHeight) {
        visualCardEl.style.minHeight = `${Math.ceil(maxVisualHeight)}px`;
      }

      renderPhase(activePhase);
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

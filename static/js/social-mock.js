(function () {
  const MOCK_SOCIAL_STATE = {
    as_of: '2026-03-02T14:30:00Z',
    market_regime: {
      label: 'Risk-on continuation with selective de-risking in energy and small caps',
      risk_on_pct: 64,
      breadth_score: 71,
    },
    kpis: [
      {
        id: 'tracked_symbols',
        label: 'Tracked symbols',
        value: '6',
        delta: '+1',
        delta_direction: 'up',
        subtext: 'Expanded watchlist this session',
      },
      {
        id: 'composite_net',
        label: 'Composite net score',
        value: '+38.7',
        delta: '+4.2',
        delta_direction: 'up',
        subtext: 'Momentum bias is still bullish',
      },
      {
        id: 'high_conviction_share',
        label: 'High conviction share',
        value: '53%',
        delta: '+6%',
        delta_direction: 'up',
        subtext: 'Posts from larger accounts are leading',
      },
      {
        id: 'narrative_velocity',
        label: 'Narrative velocity',
        value: '8.4',
        delta: '+1.1',
        delta_direction: 'up',
        subtext: 'Theme changes are accelerating',
      },
      {
        id: 'dispersion_index',
        label: 'Dispersion index',
        value: '31',
        delta: '-3',
        delta_direction: 'down',
        subtext: 'Cross-symbol disagreement has narrowed',
      },
    ],
    symbols: [
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corp',
        sector: 'Semiconductors',
        price: 984.12,
        change_pct: 1.84,
        volume: 12840000,
        net_score: 72,
        conviction: 81,
        velocity: 76,
        sentiment_mix: { bull: 68, neutral: 20, bear: 12 },
        timeframes: {
          '24h': {
            net_series: [41, 45, 47, 54, 59, 63, 69, 72],
            volume_series: [190, 214, 236, 248, 268, 301, 332, 350],
            price_series: [952, 958, 961, 968, 972, 977, 981, 984],
          },
          '7d': {
            net_series: [26, 30, 34, 39, 46, 52, 59, 64, 69, 72],
            volume_series: [130, 142, 149, 163, 171, 184, 199, 208, 221, 236],
            price_series: [908, 916, 924, 931, 943, 952, 961, 968, 977, 984],
          },
          '30d': {
            net_series: [8, 11, 15, 17, 22, 28, 33, 40, 49, 56, 64, 72],
            volume_series: [88, 91, 94, 97, 102, 111, 125, 137, 156, 178, 208, 236],
            price_series: [842, 853, 865, 878, 892, 904, 918, 932, 946, 959, 973, 984],
          },
        },
        top_posts: [
          {
            author: 'flowdesk_mia',
            text: 'Call ladders keep extending higher for NVDA. Buyers are pressing strength, not buying dips only.',
            engagement: 1920,
            stance: 'bullish',
            time: '09:18 ET',
          },
          {
            author: 'gamma_logbook',
            text: 'Dealer positioning looks supportive above 970. Momentum remains constructive if breadth holds.',
            engagement: 1328,
            stance: 'bullish',
            time: '09:42 ET',
          },
          {
            author: 'riskgrid',
            text: 'Crowded long but no unwind signal yet. Watching 964 as short-term sentiment pivot.',
            engagement: 894,
            stance: 'balanced',
            time: '10:11 ET',
          },
        ],
        catalysts: [
          'Cloud spend commentary remains supportive for AI capex',
          'Options flow skewed to calls across near-dated expiries',
          'Narrative concentration elevated in mega-cap tech complex',
        ],
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc',
        sector: 'Autos',
        price: 232.65,
        change_pct: -0.92,
        volume: 17320000,
        net_score: -18,
        conviction: 62,
        velocity: 58,
        sentiment_mix: { bull: 32, neutral: 26, bear: 42 },
        timeframes: {
          '24h': {
            net_series: [8, 4, 1, -4, -7, -11, -15, -18],
            volume_series: [244, 258, 273, 290, 315, 332, 348, 371],
            price_series: [239, 238, 237, 236, 235, 234, 233, 233],
          },
          '7d': {
            net_series: [14, 12, 10, 7, 4, 0, -5, -9, -14, -18],
            volume_series: [178, 185, 189, 198, 211, 224, 239, 254, 268, 284],
            price_series: [247, 246, 245, 244, 242, 240, 238, 236, 234, 233],
          },
          '30d': {
            net_series: [21, 18, 15, 13, 10, 8, 5, 2, -2, -7, -12, -18],
            volume_series: [139, 143, 146, 148, 152, 161, 169, 178, 194, 213, 249, 284],
            price_series: [266, 262, 258, 254, 251, 248, 245, 242, 239, 237, 235, 233],
          },
        },
        top_posts: [
          {
            author: 'ev_chain',
            text: 'TSLA sentiment flipped quickly after margin chatter. Bears are louder than they were pre-open.',
            engagement: 1437,
            stance: 'bearish',
            time: '09:35 ET',
          },
          {
            author: 'autodesk_alpha',
            text: 'Retail engagement still high, but high-follower accounts are rotating toward caution.',
            engagement: 980,
            stance: 'bearish',
            time: '10:02 ET',
          },
          {
            author: 'marketpilot',
            text: 'Needs a reclaim over 236 to neutralize short-term narrative damage.',
            engagement: 701,
            stance: 'balanced',
            time: '10:26 ET',
          },
        ],
        catalysts: [
          'Margin expectation debate is dominating social mentions',
          'Short-term options flow is defensive versus prior week',
          'Narrative split between long-term believers and tactical bears',
        ],
      },
      {
        symbol: 'PLTR',
        name: 'Palantir Technologies',
        sector: 'Software',
        price: 42.11,
        change_pct: 2.16,
        volume: 10430000,
        net_score: 54,
        conviction: 74,
        velocity: 69,
        sentiment_mix: { bull: 61, neutral: 24, bear: 15 },
        timeframes: {
          '24h': {
            net_series: [23, 27, 30, 36, 41, 46, 50, 54],
            volume_series: [123, 131, 136, 145, 156, 168, 181, 194],
            price_series: [39, 39, 40, 40, 41, 41, 42, 42],
          },
          '7d': {
            net_series: [12, 15, 19, 22, 28, 33, 38, 43, 49, 54],
            volume_series: [90, 94, 98, 104, 111, 119, 127, 138, 149, 160],
            price_series: [36, 36, 37, 37, 38, 39, 39, 40, 41, 42],
          },
          '30d': {
            net_series: [4, 6, 8, 11, 15, 19, 24, 30, 37, 44, 49, 54],
            volume_series: [62, 67, 71, 76, 83, 89, 97, 108, 121, 134, 147, 160],
            price_series: [31, 32, 33, 33, 34, 35, 36, 37, 38, 39, 40, 42],
          },
        },
        top_posts: [
          {
            author: 'defense_macro',
            text: 'PLTR chatter turned from meme framing to enterprise deployment quality. That is a healthier tone shift.',
            engagement: 1118,
            stance: 'bullish',
            time: '09:53 ET',
          },
          {
            author: 'signalalpha',
            text: 'Mentions rising with less argument and more thesis detail, usually a constructive phase.',
            engagement: 876,
            stance: 'bullish',
            time: '10:14 ET',
          },
          {
            author: 'volbooks',
            text: 'Watch for hype exhaustion if velocity outpaces realized price follow-through.',
            engagement: 621,
            stance: 'balanced',
            time: '10:31 ET',
          },
        ],
        catalysts: [
          'Government contract narrative remains persistent',
          'Mentions increasingly tied to deployment case studies',
          'Bullish conviction outrunning absolute post volume',
        ],
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        sector: 'Digital Assets',
        price: 70450,
        change_pct: 1.12,
        volume: 8920000,
        net_score: 36,
        conviction: 68,
        velocity: 64,
        sentiment_mix: { bull: 56, neutral: 31, bear: 13 },
        timeframes: {
          '24h': {
            net_series: [11, 14, 17, 23, 27, 30, 34, 36],
            volume_series: [138, 142, 147, 151, 162, 172, 181, 189],
            price_series: [69220, 69410, 69580, 69710, 69990, 70120, 70330, 70450],
          },
          '7d': {
            net_series: [3, 7, 12, 15, 20, 24, 27, 30, 33, 36],
            volume_series: [109, 112, 118, 124, 131, 139, 148, 156, 164, 173],
            price_series: [67200, 67620, 68110, 68440, 68950, 69380, 69770, 70020, 70280, 70450],
          },
          '30d': {
            net_series: [-8, -5, -2, 2, 6, 9, 13, 18, 24, 29, 33, 36],
            volume_series: [88, 91, 95, 99, 104, 112, 121, 133, 145, 154, 165, 173],
            price_series: [62400, 63180, 63920, 64560, 65330, 66050, 66820, 67610, 68490, 69210, 69900, 70450],
          },
        },
        top_posts: [
          {
            author: 'crypto_openingbell',
            text: 'BTC social tone is constructive again, but less euphoric than previous highs. Healthy setup for trend continuation.',
            engagement: 1254,
            stance: 'bullish',
            time: '09:12 ET',
          },
          {
            author: 'onchain_journal',
            text: 'Crowd focus moved from leverage chatter to spot accumulation narratives this morning.',
            engagement: 1008,
            stance: 'bullish',
            time: '09:48 ET',
          },
          {
            author: 'basiswatch',
            text: 'If sentiment keeps improving while basis stays calm, break risk increases to the upside.',
            engagement: 739,
            stance: 'balanced',
            time: '10:09 ET',
          },
        ],
        catalysts: [
          'Spot demand narrative outweighing leverage narratives',
          'Institutional account mentions back above weekly average',
          'Correlation discussion with tech is cooling slightly',
        ],
      },
      {
        symbol: 'XLE',
        name: 'Energy Select Sector SPDR',
        sector: 'Energy',
        price: 88.74,
        change_pct: -1.34,
        volume: 5210000,
        net_score: -26,
        conviction: 65,
        velocity: 55,
        sentiment_mix: { bull: 24, neutral: 34, bear: 42 },
        timeframes: {
          '24h': {
            net_series: [-5, -9, -12, -15, -18, -21, -24, -26],
            volume_series: [71, 75, 79, 86, 92, 101, 112, 121],
            price_series: [90, 90, 89, 89, 89, 89, 89, 89],
          },
          '7d': {
            net_series: [4, 2, 0, -4, -8, -11, -14, -18, -22, -26],
            volume_series: [58, 60, 63, 67, 71, 75, 81, 88, 96, 104],
            price_series: [93, 93, 92, 92, 91, 91, 90, 90, 89, 89],
          },
          '30d': {
            net_series: [18, 15, 12, 10, 7, 4, 1, -3, -8, -14, -20, -26],
            volume_series: [45, 47, 49, 51, 55, 60, 66, 73, 81, 89, 97, 104],
            price_series: [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 89],
          },
        },
        top_posts: [
          {
            author: 'macrobarrels',
            text: 'Energy social feeds turned defensive after inventory chatter. Bears are owning the intraday narrative.',
            engagement: 902,
            stance: 'bearish',
            time: '09:24 ET',
          },
          {
            author: 'flowlog_energy',
            text: 'Mentions rising but mostly around downside hedging, not upside breakouts.',
            engagement: 711,
            stance: 'bearish',
            time: '09:57 ET',
          },
          {
            author: 'factorclock',
            text: 'Needs narrative stabilization before buyers can re-assert control in XLE.',
            engagement: 534,
            stance: 'balanced',
            time: '10:19 ET',
          },
        ],
        catalysts: [
          'Inventory commentary flipped directional bias lower',
          'Systematic de-risking language spreading across desk accounts',
          'Crowd confidence in crude breakout has weakened',
        ],
      },
      {
        symbol: 'IWM',
        name: 'iShares Russell 2000 ETF',
        sector: 'Small Caps',
        price: 204.33,
        change_pct: -0.48,
        volume: 7410000,
        net_score: -6,
        conviction: 51,
        velocity: 47,
        sentiment_mix: { bull: 36, neutral: 42, bear: 22 },
        timeframes: {
          '24h': {
            net_series: [4, 2, 1, 0, -1, -3, -5, -6],
            volume_series: [96, 99, 103, 109, 116, 122, 130, 138],
            price_series: [206, 206, 205, 205, 205, 204, 204, 204],
          },
          '7d': {
            net_series: [11, 9, 8, 6, 4, 2, 0, -2, -4, -6],
            volume_series: [74, 77, 79, 83, 88, 93, 99, 105, 111, 118],
            price_series: [211, 210, 210, 209, 208, 207, 206, 206, 205, 204],
          },
          '30d': {
            net_series: [19, 17, 15, 13, 10, 8, 5, 2, 0, -2, -4, -6],
            volume_series: [57, 59, 62, 64, 68, 73, 79, 87, 95, 103, 111, 118],
            price_series: [219, 218, 217, 216, 214, 213, 211, 209, 208, 207, 206, 204],
          },
        },
        top_posts: [
          {
            author: 'breadthjournal',
            text: 'IWM conversation is indecisive: not panic, not conviction. Rotation is still unresolved.',
            engagement: 688,
            stance: 'balanced',
            time: '09:39 ET',
          },
          {
            author: 'crossasset_notes',
            text: 'Small-cap narratives are lagging mega-cap leadership again this morning.',
            engagement: 601,
            stance: 'balanced',
            time: '10:04 ET',
          },
          {
            author: 'deskrotation',
            text: 'Bearish pressure is mild, but upside narrative lacks clear sponsorship.',
            engagement: 487,
            stance: 'bearish',
            time: '10:22 ET',
          },
        ],
        catalysts: [
          'Narrative leadership remains concentrated in mega-cap names',
          'Small-cap breadth chatter has cooled since prior week',
          'Sentiment currently balanced but fragile',
        ],
      },
    ],
    narratives: [
      {
        theme: 'AI Spend Survivors',
        momentum: 'Strongly rising',
        sentiment_tilt: 'Bullish',
        linked_symbols: ['NVDA', 'PLTR'],
        summary: 'Conversation favors platforms perceived to hold pricing power as enterprise AI budgets expand.',
      },
      {
        theme: 'Consumer EV Margin Pressure',
        momentum: 'Rising',
        sentiment_tilt: 'Bearish',
        linked_symbols: ['TSLA'],
        summary: 'Margin and demand elasticity narratives continue to dominate short-horizon EV positioning.',
      },
      {
        theme: 'Crypto Spot Quality Bid',
        momentum: 'Steady climb',
        sentiment_tilt: 'Bullish',
        linked_symbols: ['BTC'],
        summary: 'Narratives shifted from leverage to spot accumulation and treasury allocation chatter.',
      },
      {
        theme: 'Small-Cap Lag Risk',
        momentum: 'Re-accelerating',
        sentiment_tilt: 'Balanced',
        linked_symbols: ['IWM', 'XLE'],
        summary: 'Broad participation concerns are resurfacing even while index-level risk sentiment stays positive.',
      },
    ],
    alerts: [
      {
        severity: 'high',
        title: 'Bearish impulse cluster in TSLA',
        detail: 'High-engagement posts turned negative within a 28-minute window.',
        time: '10:07 ET',
      },
      {
        severity: 'medium',
        title: 'Momentum divergence in XLE',
        detail: 'Post volume increased while net sentiment continued to fade.',
        time: '09:58 ET',
      },
      {
        severity: 'low',
        title: 'Broad risk appetite still intact',
        detail: 'Mega-cap bullish narratives offset weakness in cyclical cohorts.',
        time: '10:19 ET',
      },
    ],
    timeline: [
      {
        time: '09:11 ET',
        event: 'Opening call flow skewed heavily to AI complex',
        impact: 'High',
        affected_symbols: ['NVDA', 'PLTR'],
      },
      {
        time: '09:34 ET',
        event: 'TSLA narrative turned defensive after margin thread gained traction',
        impact: 'High',
        affected_symbols: ['TSLA'],
      },
      {
        time: '09:52 ET',
        event: 'Energy complex discussions rotated to downside hedging',
        impact: 'Medium',
        affected_symbols: ['XLE'],
      },
      {
        time: '10:03 ET',
        event: 'BTC sentiment upgraded by institutional account cluster',
        impact: 'Medium',
        affected_symbols: ['BTC'],
      },
      {
        time: '10:17 ET',
        event: 'Small-cap breadth concerns resurfaced in macro threads',
        impact: 'Low',
        affected_symbols: ['IWM'],
      },
    ],
    snapshots: [
      {
        as_of: '2026-03-02T14:30:00Z',
        market_regime: {
          label: 'Risk-on continuation with selective de-risking in energy and small caps',
          risk_on_pct: 64,
          breadth_score: 71,
        },
        kpis: [
          {
            id: 'tracked_symbols',
            label: 'Tracked symbols',
            value: '6',
            delta: '+1',
            delta_direction: 'up',
            subtext: 'Expanded watchlist this session',
          },
          {
            id: 'composite_net',
            label: 'Composite net score',
            value: '+38.7',
            delta: '+4.2',
            delta_direction: 'up',
            subtext: 'Momentum bias is still bullish',
          },
          {
            id: 'high_conviction_share',
            label: 'High conviction share',
            value: '53%',
            delta: '+6%',
            delta_direction: 'up',
            subtext: 'Posts from larger accounts are leading',
          },
          {
            id: 'narrative_velocity',
            label: 'Narrative velocity',
            value: '8.4',
            delta: '+1.1',
            delta_direction: 'up',
            subtext: 'Theme changes are accelerating',
          },
          {
            id: 'dispersion_index',
            label: 'Dispersion index',
            value: '31',
            delta: '-3',
            delta_direction: 'down',
            subtext: 'Cross-symbol disagreement has narrowed',
          },
        ],
        symbol_updates: {
          NVDA: { net_score: 72, velocity: 76, change_pct: 1.84, price: 984.12 },
          TSLA: { net_score: -18, velocity: 58, change_pct: -0.92, price: 232.65 },
          PLTR: { net_score: 54, velocity: 69, change_pct: 2.16, price: 42.11 },
          BTC: { net_score: 36, velocity: 64, change_pct: 1.12, price: 70450 },
          XLE: { net_score: -26, velocity: 55, change_pct: -1.34, price: 88.74 },
          IWM: { net_score: -6, velocity: 47, change_pct: -0.48, price: 204.33 },
        },
      },
      {
        as_of: '2026-03-02T14:45:00Z',
        market_regime: {
          label: 'Momentum leadership broadened while bearish energy narratives intensified',
          risk_on_pct: 67,
          breadth_score: 74,
        },
        kpis: [
          {
            id: 'tracked_symbols',
            label: 'Tracked symbols',
            value: '6',
            delta: '0',
            delta_direction: 'flat',
            subtext: 'Watchlist unchanged this cycle',
          },
          {
            id: 'composite_net',
            label: 'Composite net score',
            value: '+41.1',
            delta: '+2.4',
            delta_direction: 'up',
            subtext: 'Bullish cluster gained additional traction',
          },
          {
            id: 'high_conviction_share',
            label: 'High conviction share',
            value: '56%',
            delta: '+3%',
            delta_direction: 'up',
            subtext: 'More engagement from larger accounts',
          },
          {
            id: 'narrative_velocity',
            label: 'Narrative velocity',
            value: '9.1',
            delta: '+0.7',
            delta_direction: 'up',
            subtext: 'Theme transitions accelerated',
          },
          {
            id: 'dispersion_index',
            label: 'Dispersion index',
            value: '28',
            delta: '-3',
            delta_direction: 'down',
            subtext: 'Risk appetite became more synchronized',
          },
        ],
        symbol_updates: {
          NVDA: { net_score: 76, velocity: 82, change_pct: 2.27, price: 989.86 },
          TSLA: { net_score: -14, velocity: 52, change_pct: -0.41, price: 234.03 },
          PLTR: { net_score: 58, velocity: 74, change_pct: 2.61, price: 42.55 },
          BTC: { net_score: 40, velocity: 69, change_pct: 1.46, price: 70620 },
          XLE: { net_score: -31, velocity: 61, change_pct: -1.89, price: 88.22 },
          IWM: { net_score: -4, velocity: 50, change_pct: -0.25, price: 204.88 },
        },
        narratives: [
          {
            theme: 'AI Spend Survivors',
            momentum: 'Surging',
            sentiment_tilt: 'Bullish',
            linked_symbols: ['NVDA', 'PLTR'],
            summary: 'Bullish commentary spread from semiconductor leaders into AI software deployment names.',
          },
          {
            theme: 'Energy De-risk Cycle',
            momentum: 'Sharp acceleration',
            sentiment_tilt: 'Bearish',
            linked_symbols: ['XLE'],
            summary: 'A concentrated downside narrative formed around cyclical demand concerns.',
          },
          {
            theme: 'Crypto Spot Quality Bid',
            momentum: 'Rising',
            sentiment_tilt: 'Bullish',
            linked_symbols: ['BTC'],
            summary: 'High-engagement posts emphasized spot demand quality and lower leverage sensitivity.',
          },
          {
            theme: 'Small-Cap Stabilization Attempt',
            momentum: 'Early rebound',
            sentiment_tilt: 'Balanced',
            linked_symbols: ['IWM'],
            summary: 'Mentions turned less negative, but conviction stayed low versus mega-cap narratives.',
          },
        ],
        alerts: [
          {
            severity: 'high',
            title: 'NVDA crowding risk rising',
            detail: 'Bullish conviction increased quickly; watch for late-chase exhaustion risk.',
            time: '10:34 ET',
          },
          {
            severity: 'high',
            title: 'XLE bearish consensus formed',
            detail: 'Bearish posts now dominate both engagement and breadth within energy threads.',
            time: '10:29 ET',
          },
          {
            severity: 'medium',
            title: 'TSLA sentiment recovered slightly',
            detail: 'Negative momentum faded, but narrative remains fragile.',
            time: '10:37 ET',
          },
        ],
        timeline: [
          {
            time: '10:21 ET',
            event: 'AI software narrative broadened into secondary names',
            impact: 'High',
            affected_symbols: ['NVDA', 'PLTR'],
          },
          {
            time: '10:26 ET',
            event: 'Energy desk accounts shifted to explicit de-risk language',
            impact: 'High',
            affected_symbols: ['XLE'],
          },
          {
            time: '10:33 ET',
            event: 'TSLA bearish flow paused as neutral threads gained traction',
            impact: 'Medium',
            affected_symbols: ['TSLA'],
          },
          {
            time: '10:40 ET',
            event: 'BTC crowd tone improved with lower leverage commentary',
            impact: 'Medium',
            affected_symbols: ['BTC'],
          },
        ],
      },
      {
        as_of: '2026-03-02T15:00:00Z',
        market_regime: {
          label: 'Risk-on cooled as cross-asset dispersion widened and defensiveness increased',
          risk_on_pct: 58,
          breadth_score: 63,
        },
        kpis: [
          {
            id: 'tracked_symbols',
            label: 'Tracked symbols',
            value: '6',
            delta: '0',
            delta_direction: 'flat',
            subtext: 'Watchlist unchanged this cycle',
          },
          {
            id: 'composite_net',
            label: 'Composite net score',
            value: '+29.8',
            delta: '-11.3',
            delta_direction: 'down',
            subtext: 'Sentiment quality softened in final window',
          },
          {
            id: 'high_conviction_share',
            label: 'High conviction share',
            value: '47%',
            delta: '-9%',
            delta_direction: 'down',
            subtext: 'High-engagement account participation dropped',
          },
          {
            id: 'narrative_velocity',
            label: 'Narrative velocity',
            value: '7.2',
            delta: '-1.9',
            delta_direction: 'down',
            subtext: 'Theme changes slowed after midday',
          },
          {
            id: 'dispersion_index',
            label: 'Dispersion index',
            value: '37',
            delta: '+9',
            delta_direction: 'up',
            subtext: 'Cross-symbol disagreement widened',
          },
        ],
        symbol_updates: {
          NVDA: { net_score: 61, velocity: 63, change_pct: 1.11, price: 981.74 },
          TSLA: { net_score: -27, velocity: 70, change_pct: -1.68, price: 230.28 },
          PLTR: { net_score: 43, velocity: 55, change_pct: 1.23, price: 41.67 },
          BTC: { net_score: 24, velocity: 49, change_pct: 0.46, price: 70140 },
          XLE: { net_score: -34, velocity: 62, change_pct: -2.16, price: 87.96 },
          IWM: { net_score: -12, velocity: 58, change_pct: -0.97, price: 203.35 },
        },
        narratives: [
          {
            theme: 'Late Session De-risking',
            momentum: 'Rising quickly',
            sentiment_tilt: 'Bearish',
            linked_symbols: ['TSLA', 'XLE', 'IWM'],
            summary: 'Crowd tone turned defensive in cyclical exposures as leadership narrowed.',
          },
          {
            theme: 'AI Leadership Still Intact',
            momentum: 'Moderating',
            sentiment_tilt: 'Bullish',
            linked_symbols: ['NVDA', 'PLTR'],
            summary: 'Bullish bias persists but conviction faded from earlier session highs.',
          },
          {
            theme: 'Crypto Momentum Pause',
            momentum: 'Cooling',
            sentiment_tilt: 'Balanced',
            linked_symbols: ['BTC'],
            summary: 'Conversation remained constructive but shifted toward caution and consolidation.',
          },
        ],
        alerts: [
          {
            severity: 'high',
            title: 'Cross-asset sentiment divergence widened',
            detail: 'Bullish AI narratives no longer offset broader cyclical weakness.',
            time: '10:56 ET',
          },
          {
            severity: 'high',
            title: 'TSLA bearish velocity spike',
            detail: 'Negative threads accelerated while price momentum decelerated.',
            time: '10:52 ET',
          },
          {
            severity: 'medium',
            title: 'BTC sentiment cooled',
            detail: 'Bullish stance remains positive but no longer improving.',
            time: '10:49 ET',
          },
        ],
        timeline: [
          {
            time: '10:45 ET',
            event: 'Cyclical de-risking theme appeared across multiple high-engagement threads',
            impact: 'High',
            affected_symbols: ['TSLA', 'XLE', 'IWM'],
          },
          {
            time: '10:50 ET',
            event: 'NVDA/PLTR remained positive but with slower incremental conviction',
            impact: 'Medium',
            affected_symbols: ['NVDA', 'PLTR'],
          },
          {
            time: '10:54 ET',
            event: 'BTC discussion shifted from breakout to consolidation framing',
            impact: 'Low',
            affected_symbols: ['BTC'],
          },
        ],
      },
    ],
  };

  const state = {
    activeSymbol: null,
    activeTimeframe: '24h',
    activeSort: 'net_score',
    activeSentimentFilter: 'all',
    snapshotIndex: 0,
    view: null,
  };

  const numberFmt = new Intl.NumberFormat('en-US');

  function clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function toIsoDisplay(value) {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return value;
    const date = new Date(parsed);
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  function formatSigned(value, digits) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    const fixed = num.toFixed(digits);
    return num > 0 ? `+${fixed}` : fixed;
  }

  function sentimentBucket(score) {
    const value = Number(score);
    if (value >= 15) return 'bullish';
    if (value <= -15) return 'bearish';
    return 'balanced';
  }

  function scoreClass(score) {
    const bucket = sentimentBucket(score);
    if (bucket === 'bullish') return 'is-bullish';
    if (bucket === 'bearish') return 'is-bearish';
    return 'is-balanced';
  }

  function applySnapshot(index) {
    const snapshot = MOCK_SOCIAL_STATE.snapshots[index] || MOCK_SOCIAL_STATE.snapshots[0];
    const view = {
      as_of: snapshot.as_of || MOCK_SOCIAL_STATE.as_of,
      market_regime: clone(snapshot.market_regime || MOCK_SOCIAL_STATE.market_regime),
      kpis: clone(snapshot.kpis || MOCK_SOCIAL_STATE.kpis),
      symbols: clone(MOCK_SOCIAL_STATE.symbols),
      narratives: clone(snapshot.narratives || MOCK_SOCIAL_STATE.narratives),
      alerts: clone(snapshot.alerts || MOCK_SOCIAL_STATE.alerts),
      timeline: clone(snapshot.timeline || MOCK_SOCIAL_STATE.timeline),
    };

    const updates = snapshot.symbol_updates || {};
    view.symbols.forEach((symbol) => {
      const patch = updates[symbol.symbol];
      if (patch && typeof patch === 'object') {
        Object.assign(symbol, patch);
      }
    });

    state.view = view;
  }

  function visibleSymbols() {
    const all = state.view ? state.view.symbols.slice() : [];
    const filtered = all.filter((symbol) => {
      if (state.activeSentimentFilter === 'all') return true;
      return sentimentBucket(symbol.net_score) === state.activeSentimentFilter;
    });

    const sortKey = state.activeSort;
    filtered.sort((a, b) => {
      if (sortKey === 'volume') {
        return Number(b.volume || 0) - Number(a.volume || 0);
      }
      return Number(b[sortKey] || 0) - Number(a[sortKey] || 0);
    });

    return filtered;
  }

  function setActiveSymbolFromList(symbols) {
    if (!symbols.length) {
      state.activeSymbol = null;
      return;
    }
    const exists = symbols.some((item) => item.symbol === state.activeSymbol);
    if (!exists) {
      state.activeSymbol = symbols[0].symbol;
    }
  }

  function getActiveSymbolData(symbols) {
    return symbols.find((item) => item.symbol === state.activeSymbol) || null;
  }

  function renderStatus() {
    if (!state.view) return;
    const regime = state.view.market_regime || {};
    const asOfNode = document.getElementById('social-as-of');
    const regimeNode = document.getElementById('social-market-regime');
    const riskNode = document.getElementById('social-risk-on');
    const breadthNode = document.getElementById('social-breadth');

    if (regimeNode) regimeNode.textContent = regime.label || 'Regime unavailable';
    if (riskNode) riskNode.textContent = `${Number(regime.risk_on_pct || 0).toFixed(0)}%`;
    if (breadthNode) breadthNode.textContent = String(regime.breadth_score ?? '-');
    if (asOfNode) asOfNode.textContent = toIsoDisplay(state.view.as_of || '');
  }

  function renderKpis() {
    const root = document.getElementById('social-kpis');
    if (!root || !state.view) return;
    root.innerHTML = '';

    state.view.kpis.forEach((kpi) => {
      const card = document.createElement('article');
      const deltaClass =
        kpi.delta_direction === 'up' ? 'is-up' : kpi.delta_direction === 'down' ? 'is-down' : 'is-flat';
      card.className = 'social-kpi-card';
      card.innerHTML = `
        <p class="kpi-label">${kpi.label}</p>
        <div class="kpi-value-row">
          <strong class="kpi-value">${kpi.value}</strong>
          <span class="kpi-delta ${deltaClass}">${kpi.delta}</span>
        </div>
        <p class="kpi-subtext">${kpi.subtext}</p>
      `;
      root.appendChild(card);
    });
  }

  function radarRow(symbol) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `radar-row ${scoreClass(symbol.net_score)}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(symbol.symbol === state.activeSymbol));
    button.dataset.symbol = symbol.symbol;

    if (symbol.symbol === state.activeSymbol) {
      button.classList.add('is-active');
    }

    button.innerHTML = `
      <div class="radar-row-top">
        <div>
          <div class="symbol">${symbol.symbol}</div>
          <div class="name">${symbol.name}</div>
        </div>
        <span class="sector">${symbol.sector}</span>
      </div>
      <div class="radar-row-metrics">
        <span>Net <strong>${formatSigned(symbol.net_score, 0)}</strong></span>
        <span>Velocity <strong>${Number(symbol.velocity).toFixed(0)}</strong></span>
        <span>Vol <strong>${numberFmt.format(Math.round(symbol.volume / 1000))}K</strong></span>
      </div>
    `;

    button.addEventListener('click', () => {
      state.activeSymbol = symbol.symbol;
      render();
    });

    return button;
  }

  function renderRadar(symbols) {
    const list = document.getElementById('social-radar-list');
    const count = document.getElementById('radar-count');
    if (!list) return;
    list.innerHTML = '';

    if (count) {
      const noun = symbols.length === 1 ? 'symbol' : 'symbols';
      count.textContent = `${symbols.length} ${noun}`;
    }

    if (!symbols.length) {
      const empty = document.createElement('p');
      empty.className = 'radar-empty';
      empty.textContent = 'No symbols match this sentiment filter.';
      list.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    symbols.forEach((symbol) => {
      frag.appendChild(radarRow(symbol));
    });
    list.appendChild(frag);
  }

  function linePath(series, width, height, pad) {
    const nums = series.map((n) => Number(n));
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;
    const step = series.length > 1 ? (width - pad * 2) / (series.length - 1) : 0;
    let path = '';

    nums.forEach((value, index) => {
      const x = pad + step * index;
      const y = height - pad - ((value - min) / range) * (height - pad * 2);
      path += index === 0 ? `M${x} ${y}` : ` L${x} ${y}`;
    });
    return path;
  }

  function renderLineChart(container, series, trendClass) {
    if (!container) return;
    const width = 320;
    const height = 120;
    const pad = 14;
    const path = linePath(series, width, height, pad);

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="mini-chart" aria-hidden="true" focusable="false">
        <path d="${path}" class="mini-chart-line ${trendClass}"></path>
      </svg>
    `;
  }

  function renderBarChart(container, series) {
    if (!container) return;
    const nums = series.map((n) => Number(n));
    const max = Math.max(...nums, 1);
    const width = 320;
    const height = 120;
    const gap = 6;
    const barWidth = Math.floor((width - gap * (nums.length + 1)) / nums.length);

    const bars = nums
      .map((value, index) => {
        const h = Math.max(3, Math.round((value / max) * (height - 24)));
        const x = gap + index * (barWidth + gap);
        const y = height - h - 8;
        return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" class="mini-chart-bar"></rect>`;
      })
      .join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="mini-chart" aria-hidden="true" focusable="false">
        ${bars}
      </svg>
    `;
  }

  function postToneClass(stance) {
    if (stance === 'bullish') return 'is-bullish';
    if (stance === 'bearish') return 'is-bearish';
    return 'is-balanced';
  }

  function renderDetail(activeSymbol) {
    const root = document.getElementById('social-detail');
    if (!root) return;

    if (!activeSymbol) {
      root.innerHTML = '<p class="detail-empty">No symbol selected.</p>';
      return;
    }

    const tf = activeSymbol.timeframes[state.activeTimeframe] || activeSymbol.timeframes['24h'];
    const priceClass = Number(activeSymbol.change_pct) >= 0 ? 'is-up' : 'is-down';

    root.innerHTML = `
      <article class="detail-shell ${scoreClass(activeSymbol.net_score)}">
        <header class="detail-header">
          <div>
            <p class="detail-kicker">Symbol workspace</p>
            <h2>${activeSymbol.symbol} <span>${activeSymbol.name}</span></h2>
          </div>
          <div class="detail-price-block">
            <strong>$${numberFmt.format(activeSymbol.price)}</strong>
            <span class="${priceClass}">${formatSigned(activeSymbol.change_pct, 2)}%</span>
            <small>${activeSymbol.sector}</small>
          </div>
        </header>

        <section class="detail-score-grid">
          <div class="score-card">
            <span>Net score</span>
            <strong>${formatSigned(activeSymbol.net_score, 0)}</strong>
          </div>
          <div class="score-card">
            <span>Conviction</span>
            <strong>${activeSymbol.conviction}</strong>
          </div>
          <div class="score-card">
            <span>Velocity</span>
            <strong>${activeSymbol.velocity}</strong>
          </div>
          <div class="score-card">
            <span>Volume</span>
            <strong>${numberFmt.format(activeSymbol.volume)}</strong>
          </div>
        </section>

        <section class="detail-mix-card">
          <div class="mix-head">
            <h3>Sentiment mix</h3>
            <span>${state.activeTimeframe} window</span>
          </div>
          <div class="mix-bar" role="img" aria-label="Sentiment mix">
            <span class="bull" style="width:${activeSymbol.sentiment_mix.bull}%"></span>
            <span class="neutral" style="width:${activeSymbol.sentiment_mix.neutral}%"></span>
            <span class="bear" style="width:${activeSymbol.sentiment_mix.bear}%"></span>
          </div>
          <p class="mix-meta">
            Bull ${activeSymbol.sentiment_mix.bull}% | Neutral ${activeSymbol.sentiment_mix.neutral}% | Bear ${activeSymbol.sentiment_mix.bear}%
          </p>
        </section>

        <section class="detail-chart-grid">
          <article class="chart-card">
            <h3>Net score trend</h3>
            <div id="net-chart"></div>
          </article>
          <article class="chart-card">
            <h3>Price response</h3>
            <div id="price-chart"></div>
          </article>
          <article class="chart-card">
            <h3>Post volume flow</h3>
            <div id="volume-chart"></div>
          </article>
        </section>

        <section class="detail-lower-grid">
          <article class="detail-card">
            <h3>Catalysts</h3>
            <ul class="catalyst-list">
              ${activeSymbol.catalysts.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </article>
          <article class="detail-card">
            <h3>Top posts</h3>
            <ul class="post-list">
              ${activeSymbol.top_posts
                .map(
                  (post) => `
                    <li class="post-item ${postToneClass(post.stance)}">
                      <p>${post.text}</p>
                      <div class="post-meta">@${post.author} | ${numberFmt.format(post.engagement)} engagements | ${post.time}</div>
                    </li>
                  `
                )
                .join('')}
            </ul>
          </article>
        </section>
      </article>
    `;

    const netTrendClass = Number(tf.net_series[tf.net_series.length - 1]) >= Number(tf.net_series[0]) ? 'up' : 'down';
    const priceTrendClass = Number(tf.price_series[tf.price_series.length - 1]) >= Number(tf.price_series[0]) ? 'up' : 'down';

    renderLineChart(document.getElementById('net-chart'), tf.net_series, netTrendClass);
    renderLineChart(document.getElementById('price-chart'), tf.price_series, priceTrendClass);
    renderBarChart(document.getElementById('volume-chart'), tf.volume_series);
  }

  function narrativeToneClass(tilt) {
    const lowered = String(tilt || '').toLowerCase();
    if (lowered.includes('bull')) return 'is-bullish';
    if (lowered.includes('bear')) return 'is-bearish';
    return 'is-balanced';
  }

  function strongestLinkedSymbol(linkedSymbols) {
    const symbols = state.view ? state.view.symbols : [];
    let best = null;
    linkedSymbols.forEach((code) => {
      const symbol = symbols.find((item) => item.symbol === code);
      if (!symbol) return;
      if (!best || Number(symbol.net_score) > Number(best.net_score)) {
        best = symbol;
      }
    });
    return best;
  }

  function renderNarratives() {
    const root = document.getElementById('social-narratives');
    if (!root || !state.view) return;

    root.innerHTML = '';
    state.view.narratives.forEach((item) => {
      const strongest = strongestLinkedSymbol(item.linked_symbols || []);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `narrative-item ${narrativeToneClass(item.sentiment_tilt)}`;
      button.innerHTML = `
        <div class="narrative-head">
          <strong>${item.theme}</strong>
          <span>${item.momentum}</span>
        </div>
        <p>${item.summary}</p>
        <div class="narrative-meta">Tilt: ${item.sentiment_tilt} | Links: ${(item.linked_symbols || []).join(', ')}</div>
      `;

      button.addEventListener('click', () => {
        if (strongest) {
          state.activeSentimentFilter = 'all';
          state.activeSymbol = strongest.symbol;
          render();
          const detail = document.getElementById('social-detail');
          detail?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      root.appendChild(button);
    });
  }

  function alertClass(severity) {
    if (severity === 'high') return 'is-high';
    if (severity === 'medium') return 'is-medium';
    return 'is-low';
  }

  function renderAlerts() {
    const root = document.getElementById('social-alerts');
    if (!root || !state.view) return;

    root.innerHTML = '';
    state.view.alerts.forEach((item) => {
      const node = document.createElement('article');
      node.className = `alert-item ${alertClass(item.severity)}`;
      node.innerHTML = `
        <div class="alert-head">
          <strong>${item.title}</strong>
          <span>${item.severity.toUpperCase()}</span>
        </div>
        <p>${item.detail}</p>
        <small>${item.time}</small>
      `;
      root.appendChild(node);
    });
  }

  function impactClass(impact) {
    const lowered = String(impact || '').toLowerCase();
    if (lowered === 'high') return 'is-high';
    if (lowered === 'medium') return 'is-medium';
    return 'is-low';
  }

  function renderTimeline() {
    const root = document.getElementById('social-timeline');
    if (!root || !state.view) return;

    root.innerHTML = '';
    state.view.timeline.forEach((item) => {
      const linked = (item.affected_symbols || []).includes(state.activeSymbol);
      const node = document.createElement('article');
      node.className = `timeline-item ${impactClass(item.impact)} ${linked ? 'is-linked' : ''}`;
      node.innerHTML = `
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-body">
          <p>${item.event}</p>
          <div class="timeline-meta">
            <span class="impact-chip ${impactClass(item.impact)}">${item.impact} impact</span>
            <span class="symbol-chip">${(item.affected_symbols || []).join(', ')}</span>
          </div>
        </div>
      `;
      root.appendChild(node);
    });
  }

  function setChipState(groupId, selectedValue, attrName) {
    const root = document.getElementById(groupId);
    if (!root) return;
    root.querySelectorAll('button').forEach((button) => {
      const selected = button.dataset[attrName] === selectedValue;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function bindControlGroups() {
    const timeframe = document.getElementById('timeframe-controls');
    timeframe?.querySelectorAll('button[data-timeframe]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeTimeframe = button.dataset.timeframe || '24h';
        render();
      });
    });

    const sort = document.getElementById('sort-controls');
    sort?.querySelectorAll('button[data-sort]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeSort = button.dataset.sort || 'net_score';
        render();
      });
    });

    const sentiment = document.getElementById('sentiment-controls');
    sentiment?.querySelectorAll('button[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeSentimentFilter = button.dataset.filter || 'all';
        render();
      });
    });

    const refresh = document.getElementById('social-refresh');
    refresh?.addEventListener('click', () => {
      const root = document.getElementById('social-mock-page');
      state.snapshotIndex = (state.snapshotIndex + 1) % MOCK_SOCIAL_STATE.snapshots.length;
      applySnapshot(state.snapshotIndex);
      root?.classList.add('is-refreshing');
      render();
      window.setTimeout(() => root?.classList.remove('is-refreshing'), 520);
    });
  }

  function render() {
    if (!state.view) return;

    const symbols = visibleSymbols();
    setActiveSymbolFromList(symbols);
    const active = getActiveSymbolData(symbols);

    renderStatus();
    renderKpis();
    renderRadar(symbols);
    renderDetail(active);
    renderNarratives();
    renderAlerts();
    renderTimeline();

    setChipState('timeframe-controls', state.activeTimeframe, 'timeframe');
    setChipState('sort-controls', state.activeSort, 'sort');
    setChipState('sentiment-controls', state.activeSentimentFilter, 'filter');
  }

  function initRevealDelays() {
    const nodes = Array.from(document.querySelectorAll('.social-mock-page [data-reveal]'));
    nodes.forEach((node, index) => {
      node.style.setProperty('--reveal-delay', `${index * 70}ms`);
      node.classList.add('social-reveal-ready');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applySnapshot(0);
    const firstSymbol = state.view && state.view.symbols.length ? state.view.symbols[0].symbol : null;
    state.activeSymbol = firstSymbol;
    bindControlGroups();
    initRevealDelays();
    render();
  });
})();

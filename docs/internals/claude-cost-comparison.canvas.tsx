import {
  BarChart,
  Callout,
  Divider,
  H1,
  H2,
  Row,
  Stack,
  Stat,
  Table,
  Text,
} from "cursor/canvas";

const usageRows = [
  ["Opus 4.6 High (Thinking)", "19.09M", "444K", "$96.85", "52.8%"],
  ["Opus 4.6 High", "12.08M", "346K", "$38.19", "20.8%"],
  ["Grok 4.6 High Fast", "14.42M", "910K", "$28.58", "15.6%"],
  ["Kimi K3", "15.27M", "223K", "$17.06", "9.3%"],
  ["Sonnet 4.6 High Thinking", "4.04M", "102K", "$2.58", "1.4%"],
  ["Total (metered)", "64.90M", "2.03M", "$183.26", "100%"],
];

const planRows = [
  [
    "Pro",
    "$20/mo",
    "5h session window + weekly cap, shared with claude.ai; usage credits past caps at API rates",
    "Not viable at your volume — caps are sized for light daily coding",
  ],
  [
    "Max 5x",
    "$100/mo",
    "5x Pro per window + weekly cap; credits at API rates past the cap",
    "~$130–180 — sub + ~$30–80 credits; needs Sonnet-first discipline",
  ],
  [
    "Max 20x",
    "$200/mo",
    "20x Pro per window + weekly cap; credits at API rates past the cap",
    "~$200 flat — closest equivalent to your current pattern",
  ],
  [
    "API key only",
    "no sub",
    "Per-token, no caps, no claude.ai chat pool",
    "~$180–250 at your volume (Anthropic's published heavy-dev band)",
  ],
];

export default function ClaudeCostComparison() {
  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={4}>
        <H1>What your usage would cost on Claude</H1>
        <Text tone="secondary">
          Your Cursor metered usage this period, priced against Anthropic's individual plans
          and API rates as of Aug 24, 2026.
        </Text>
      </Stack>

      <Row gap={40}>
        <Stat value="$183.26" label="Cursor metered usage this period (API-list value)" />
        <Stat value="$135.04" label="of it Opus 4.6 (74% of the bill)" tone="warning" />
        <Stat value="$200/mo" label="closest Claude equivalent: Max 20x" tone="info" />
      </Row>

      <Divider />

      <H2>Where the spend goes now — Cursor, current period</H2>
      <BarChart
        horizontal
        height={220}
        categories={[
          "Opus 4.6 Thinking",
          "Opus 4.6",
          "Grok 4.6 Fast",
          "Kimi K3",
          "Sonnet 4.6 Thinking",
        ]}
        series={[
          {
            name: "Cost (USD, API-list value)",
            data: [96.85, 38.19, 28.58, 17.06, 2.58],
          },
        ]}
        valuePrefix="$"
        showValues
      />
      <Table
        headers={["Model", "Input tokens", "Output tokens", "Cost (API-list value)", "Share"]}
        rows={usageRows}
        columnAlign={["left", "right", "right", "right", "right"]}
        striped
      />
      <Text size="small" tone="tertiary">
        Source: Cursor Settings → Usage, current billing period. Plan summary shown there:
        $183.26 included usage · $20.00 included in Pro · $0.00 on-demand. Composer 2.5 does
        not appear in this metered table.
      </Text>

      <Divider />

      <H2>Equivalent setups on Claude — estimated monthly total</H2>
      <BarChart
        height={240}
        categories={[
          "Cursor today\n(API-list value)",
          "Claude Max 5x\n+ usage credits",
          "Claude Max 20x\n(flat)",
          "Claude API key\n(pay-per-token)",
        ]}
        series={[
          {
            name: "Estimated monthly total (USD)",
            data: [183.26, 155, 200, 215],
          },
        ]}
        valuePrefix="$"
        showValues
        referenceLines={[{ value: 183.26, label: "Current usage value", tone: "warning" }]}
      />
      <Text size="small" tone="tertiary">
        Estimates: Max 5x bar = $100 sub + ~$55 mid-estimate credits; API bar = midpoint of the
        $180–250 band. Claude plans meter 5-hour session windows plus weekly caps, not tokens,
        so exact equivalence is approximate.
      </Text>

      <Table
        headers={["Option", "Base price", "How it meters", "Fit for your pattern"]}
        rows={planRows}
        columnAlign={["left", "left", "left", "left"]}
        rowTone={[undefined, undefined, "success", undefined]}
        striped
      />

      <Divider />

      <H2>Caveats that matter</H2>
      <Stack gap={12}>
        <Callout tone="warning" title="Your Claude-side burn will be higher than $183">
          <Text>
            Composer 2.5 — your daily driver — is unmetered on Cursor and invisible in the
            $183.26. On Claude, everything (Claude Code + claude.ai chat) draws from one pool.
            Your Grok / Kimi / Sonnet work (~$48) becomes mostly Sonnet 4.6, and Kimi's
            analysis role presumably becomes Opus or Sonnet-thinking — all of it counting
            against the same session and weekly limits.
          </Text>
        </Callout>
        <Callout tone="info" title="Opus is the lever">
          <Text>
            74% of your bill is Opus 4.6 ($135.04), mostly thinking sessions. Sonnet 4.6 costs
            $3/$15 per MTok vs Opus at $5/$25 — a 40% cut. Routing analysis/planning to
            Sonnet-thinking is what makes Max 5x + credits land near $130–150; keeping the
            current Opus-thinking habit points squarely at Max 20x.
          </Text>
        </Callout>
        <Callout tone="neutral" title="Fine print on Claude plans">
          <Text>
            Usage credits past plan caps bill at standard API rates with a configurable
            monthly spending cap. Weekly limits are running 50% above published levels through
            Aug 31, 2026 (promo, possibly permanent). API rates: Opus 4.6 $5/$25 per MTok,
            Sonnet 4.6 $3/$15; cache reads at ~0.1x input. Max tiers are monthly-only; Pro
            drops to $17/mo billed annually.
          </Text>
        </Callout>
        <Callout tone="success" title="Bottom line">
          <Text>
            Equivalent capacity on Claude is Max 20x at ~$200/mo flat — roughly what your
            metered usage is worth at API-list prices ($183.26), before counting your
            unmetered Composer work. A Sonnet-first pattern on Max 5x + credits lands around
            $130–180/mo. Both are far above the $20 Cursor Pro has actually charged you this
            period ($0.00 on-demand so far) — Cursor is currently absorbing most of your
            usage value.
          </Text>
        </Callout>
      </Stack>

      <Text size="small" tone="tertiary">
        Sources: Anthropic Help Center (Choose a Claude plan; What is the Max plan; Manage
        usage credits), claude.com/pricing, Anthropic API rate card — retrieved Aug 24, 2026.
        Anthropic published average for API-billed Claude Code developers: $150–250 per
        developer per month, ~$13 per active day.
      </Text>
    </Stack>
  );
}

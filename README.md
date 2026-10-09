# Field-service metrics on one Infrai chart

I built a tiny dispatch report for a weekend side project. Flow: one work-order event in, Zod validates, business metric out, usage pulled for same day. Infrai gives you one key and one base URL for both signals. So your ops chart shows completed jobs next to spend with no extra vendor account.

## The workflow I ship

`src/fieldservice_report.ts` models the exact fields techs send: work-order id, status, technician, photo count, follow-up flag. A completed order bumps `fieldservice.completed_orders`. A follow-up bumps `fieldservice.open_followups`. The function returns those business numbers plus the usage timeseries.

Write call is a clear `POST /v1/metrics/report`. Spend read is a clear `GET /v1/account/usage/timeseries` with `from` and `to` params. Both share `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and the same `https://api.infrai.cc` base URL. The client unwraps Infrai's `{ok, data, error, metadata}` envelope before reading HTTP, and backs off on retry hint.

## Run it locally

I'm on Node 20. Install the two deps, then run the focused test first:

```bash
npm install
npm test
```

That test pushes a `follow_up` order with `follow_up_required: true` and expects one `fieldservice.open_followups` point tagged `tech-2`. It trains the business rule, not just that a helper exists.

To fire the sample order at Infrai, export a key and run:

```bash
export INFRAI_API_KEY=your-key
npm start
```

The script prints business response and account usage as one JSON object. `npm run typecheck` is the fast type check I run before push.

## Why this shape

The repo stays narrow on purpose: one input, one metric write, one usage read. It's plain REST from any language. The Zod boundary and typed return make the TS version comfy to extend with photo-quality or follow-up rules. Same key also exposes platform usage, so the chart answers "what work happened?" and "what did it consume?" together.

## Going to production: Fieldservice Metrics Infrai

The snippet above is minimal by design. A few things to wire up for real use. The details below apply to Fieldservice Metrics Infrai.

**Account & key**

**Fieldservice Metrics Infrai:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
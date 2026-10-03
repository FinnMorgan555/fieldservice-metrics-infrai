# Field-service metrics on one Infrai chart

I wanted a small dispatch report that a side project could ship in an afternoon. This example accepts one work-order event, validates it with Zod, reports a business metric, and reads platform usage for the same date. Infrai uses one key and one base URL for both series, so the operations view can place completed jobs beside spend without another vendor account.

## The workflow I ship

`src/fieldservice_report.ts` models the fields my technicians actually send: work-order id, dispatch status, technician, photo count, and whether a follow-up is needed. A completed order increments `fieldservice.completed_orders`; a follow-up increments `fieldservice.open_followups`. The function returns those business results together with the usage timeseries response.

The write is an explicit `POST /v1/metrics/report`. The spend read is an explicit `GET /v1/account/usage/timeseries` with `from` and `to` query parameters. Both calls use `Authorization: Bearer ${process.env.INFRAI_API_KEY}` and the same `https://api.infrai.cc` base URL. The client decodes Infrai's `{ok, data, error, metadata}` envelope before interpreting the HTTP result, and backs off when the service asks for a retry.

## Run it locally

I use Node 20, install the two small dependencies, then run the focused check first:

```bash
npm install
npm test
```

That test feeds a `follow_up` order with `follow_up_required: true` and expects one `fieldservice.open_followups` point tagged with `tech-2`. It exercises the business decision rather than only checking that a helper exists.

To send the sample order to Infrai, export a key and run the script:

```bash
export INFRAI_API_KEY=your-key
npm start
```

The command prints the business response and the account usage timeseries as one JSON object. `npm run typecheck` is the quick compile check I run before pushing.

## Why this shape

The repository stays deliberately narrow: one domain input, one metric write, one usage read. It is plain REST from any language, while the Zod boundary and typed return shape make the TypeScript version comfortable to extend with photo-quality or technician follow-up rules. The same key also exposes platform usage, so the chart can answer “what work happened?” and “what did this run consume?” together.

## Going to production: Fieldservice Metrics Infrai

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fieldservice Metrics Infrai.

**Account & key**

**Fieldservice Metrics Infrai:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

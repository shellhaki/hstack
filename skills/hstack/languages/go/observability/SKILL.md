---
name: hstack-go-observability
description: "Go observability: structured logging with log/slog, Prometheus metrics, OpenTelemetry tracing, profiling toggles, alerting, signal correlation, plus the samber/slog-* pipeline libraries. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: observability

Read this when you add or review logging, metrics, tracing, profiling endpoints or alerts in a Go service.
A feature is not done until you can see it work in production.

## Rules

Logging (standard `log/slog`, Go 1.21+)
1. Use `log/slog` for all logs. Production uses `slog.NewJSONHandler` (plain multiline text such as stack traces gets split by log collectors). Development may use the text handler. Call `slog.SetDefault`.
2. Log key-value pairs, not formatted strings: `slog.Error("payment failed", "order_id", id, "error", err)`. Fields can then be filtered and aggregated. Keep key names consistent.
3. Use the context variants (`slog.InfoContext(ctx, ...)`) so an OpenTelemetry bridge can add `trace_id` and `span_id`.
4. Pick levels by outcome: Debug for development detail, Info for normal events, Warn when the operation succeeded but degraded, Error when it failed. Production runs at Info. Debug in production can cost 10-100x in volume, so toggle it by env var for one instance.
5. Log or return an error, never both. Wrap and return with context (`fmt.Errorf("querying users: %w", err)`) and log once at the top (handler, `main`, worker loop). Otherwise it is logged at every layer.
6. Never log PII or secrets (emails, SSNs, passwords, tokens, API keys). Log identifiers (`user_id`).
7. Use `logger.With(...)` for request-scoped fields (request id, method, path) in middleware, and pass the logger down through the context or constructors.
8. On hot paths use `slog.LogAttrs` with typed attrs (`slog.Int`, `slog.String`). Never build the message with `fmt.Sprintf`.
9. For high volume, sample noise (Debug, Info), never errors.
10. Go 1.26+: fan out to several handlers with stdlib `slog.NewMultiHandler` before adding a dependency.
11. Migrating from zap, logrus or zerolog: add slog with `slog.SetDefault`, bridge it to the old logger (`samber/slog-zap`, `slog-logrus`, `slog-zerolog`), replace call sites gradually, then remove the bridge and the old dependency.
12. Handlers that batch records (Datadog, Loki, Kafka, Parquet sinks) lose logs on exit unless you flush them during graceful shutdown.

Metrics (Prometheus `client_golang`)
13. Every HTTP endpoint gets a latency histogram and an error-rate counter. Expose them with `mux.Handle("/metrics", promhttp.Handler())`.
14. Pick the type by question: Counter for events (only goes up, name ends `_total`), Gauge for current state (in-flight, queue size, pool use), Histogram for latency and sizes.
15. Prefer Histogram over Summary. Summary quantiles cannot be aggregated across instances. Percentiles come from `histogram_quantile(0.99, sum(rate(x_bucket[5m])) by (le))`.
16. Name metrics `<namespace>_<subsystem>_<name>_<unit>` in base units and plural (`_seconds`, `_bytes`, `_ratio` 0-1). Do not put a label value in the name (`..._get_requests_total`): use a `method` label.
17. Keep label cardinality low. Use the route template (`/users/{id}`), not the raw path. Never use user ids, request ids, emails or full URLs as labels. Over about 100 distinct values is too many. Put high-cardinality data in traces.
18. Use `rate(...)` for alerts, never `irate(...)`.
19. Put the dashboard query and alert expression as comments above each metric declaration, so reviewers see them with the metric.
20. Track in-flight work with a gauge (`Inc()`, `defer Dec()`), and track saturation as used/max (DB pool, workers).
21. The Go collector's `go_memstats_*` calls `runtime.ReadMemStats` (brief stop-the-world). Prefer the `runtime/metrics`-based `collectors.NewGoCollector(...)` (Go 1.17+).

Tracing (OpenTelemetry)
22. Set up the `TracerProvider` early on a new service, with `resource` attributes (`service.name`, `service.version`), `sdktrace.WithBatcher(exporter)`, and call `tp.Shutdown` on exit so spans flush. Set the global propagator (`otel.SetTextMapPropagator`) for cross-service context.
23. Start a span (`ctx, span := tracer.Start(ctx, "Type.Method"); defer span.End()`) for every service method, DB query, external call and queue publish or consume.
24. On error call both `span.RecordError(err)` and `span.SetStatus(codes.Error, msg)`. On success leave the status unset.
25. Pass `ctx` into everything: `db.QueryContext`, `http.NewRequestWithContext`. A call without it breaks the trace.
26. Wrap servers with `otelhttp.NewHandler` and clients with `otelhttp.NewTransport(...)`.
27. Sample in production: `sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1))` keeps traces whole across services. Tail sampling keeps errors and slow requests. Do not put large payloads in span attributes: log them and correlate by `trace_id`.

Correlation and profiling
28. Connect the signals. Use the `otelslog` bridge so logs carry `trace_id`, and attach a `trace_id` exemplar to histogram observations so a latency spike links to its trace.
29. Protect pprof with auth, never expose it publicly, and enable it with an env var (`PPROF_ENABLED`). Compare credentials with `subtle.ConstantTimeCompare`. Also expose the `goroutineleak` profile on Go 1.27+.
30. Continuous profiling (Pyroscope, Parca) costs about 2-5% CPU per instance, always on. Toggle by env var, start with CPU and heap, run on a fraction of replicas.
31. Every costly debug feature (pprof, profiling, debug logs, traces) must toggle through env vars with no rebuild, and run on one instance only.

Alerting
32. Cover the four golden signals: latency (p99 histogram), traffic (request rate), errors (5xx ratio), saturation (pool, queue, workers).
33. Always set `for:`. Critical (page) uses 2-5 m, warning (ticket) uses 10-30 m. `for: 0m` is only for binary up/down alerts.
34. For a critical SLO, alert on burn rate over two windows (for a 99.9% SLO: 5m+1h above 14.4x, 30m+6h above 6x page; 2h+24h above 1x tickets). The short window detects, the long window confirms.
35. Add Go runtime alerts: `go_goroutines` high or growing, max GC pause (`go_gc_duration_seconds{quantile="1"}`), `go_memstats_alloc_bytes / go_memstats_sys_bytes`, `go_threads`. Adapt rules for dependencies from awesome-prometheus-alerts. Community dashboards for Go runtime: Grafana IDs 21221, 6671, 10826.
36. Product analytics (RUM): use the immutable internal `user_id` as the identity key, never email. Check consent before tracking (GDPR/CCPA).
37. Definition of done: metrics declared with query comments, structured `slog` with context, spans on service/DB/external calls, dashboard and alert wired, no PII in logs.

## Patterns

Logger setup and a request-scoped logger:
```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
slog.SetDefault(logger)

func logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        l := slog.With("request_id", r.Header.Get("X-Request-ID"), "method", r.Method, "path", r.URL.Path)
        next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), loggerKey{}, l)))
    })
}
```

Log once, at the top:
```go
// lower layers
if err != nil { return fmt.Errorf("querying users: %w", err) }
// top level
slog.ErrorContext(ctx, "request failed", "error", err, "user_id", uid)
```

Histogram with a documented query (route template label):
```go
// Dashboard: histogram_quantile(0.99, sum(rate(myapp_http_request_duration_seconds_bucket[5m])) by (le, route))
// Alert:     histogram_quantile(0.99, sum(rate(myapp_http_request_duration_seconds_bucket[5m])) by (le)) > 2  (for: 5m)
var httpDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
    Namespace: "myapp", Subsystem: "http", Name: "request_duration_seconds",
    Help: "HTTP request duration in seconds.", Buckets: prometheus.DefBuckets,
}, []string{"method", "route", "status"})
```

Span with error recording:
```go
var tracer = otel.Tracer("myapp/orders")

func (s *Service) Create(ctx context.Context, req Req) (*Order, error) {
    ctx, span := tracer.Start(ctx, "Service.Create")
    defer span.End()
    o, err := s.repo.Insert(ctx, req.ToOrder())
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "insert failed")
        return nil, fmt.Errorf("inserting order: %w", err)
    }
    return o, nil
}
```

Tracer provider with sampling, and trace-aware logs:
```go
tp := sdktrace.NewTracerProvider(
    sdktrace.WithBatcher(exporter),
    sdktrace.WithResource(res),
    sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(0.1))),
)
otel.SetTracerProvider(tp)
defer tp.Shutdown(context.Background())
slog.SetDefault(slog.New(otelslog.NewHandler("my-service"))) // go.opentelemetry.io/contrib/bridges/otelslog
```

Env-toggled pprof with auth:
```go
if os.Getenv("PPROF_ENABLED") == "true" {
    u, p := os.Getenv("PPROF_USERNAME"), os.Getenv("PPROF_PASSWORD")
    if u == "" || p == "" { panic("PPROF_USERNAME and PPROF_PASSWORD are required") }
    mux.Handle("/debug/pprof/", basicAuth(u, p)(http.HandlerFunc(pprof.Index))) // plus cmdline, profile, symbol, trace
}
```

Alert rule shape:
```yaml
- alert: HighErrorRate
  expr: sum(rate(myapp_http_requests_total{status=~"5.."}[5m])) / sum(rate(myapp_http_requests_total[5m])) > 0.01
  for: 5m
  labels: {severity: critical}
```

## If the project uses samber/slog-* packages

Skip this unless `go.mod` already has them. They are `slog.Handler` implementations for Go 1.21+ and compose with the standard logger.
1. Order the pipeline: record, sampling, Pipe middlewares (PII scrub, trace id), router, sinks. Sample first so dropped records cost nothing.
2. `slog-multi`: `Fanout` sends to all handlers one after another (latency is the sum). `Router().Add(h, predicate)` sends to all matches. Adding `.FirstMatch()` stops at the first match. `Failover` tries handlers in order. `Pool` sends each record to one handler. `Pipe(mw...).Handler(sink)` chains middleware.
3. A `Router` drops records that match no route. Add a catch-all handler with no predicate.
4. To exempt errors from sampling, route `LevelIs(slog.LevelError)` first in a `FirstMatch` router and put the sampling pipe on the other route.
5. `slog-sampling`: Uniform drops a fixed percent (dev only, it also drops errors). Threshold logs the first N per interval then a rate R (good production default). Absolute caps records per interval. Custom returns a rate per record. Matchers group records (default: level plus message). `OnAccepted` and `OnDropped` hooks let you count drops.
6. `slog-formatter`: scrub with `PIIFormatter`, `ErrorFormatter`, `IPAddressFormatter` through `slogmulti.Pipe(slogformatter.NewFormatterMiddleware(...))`. For hot paths implement `slog.LogValuer` on your types instead of stacking formatters.
7. HTTP middleware (`slog-http`, `slog-gin`, `slog-echo`, `slog-chi`, `slog-fiber`): `DefaultLevel`, `ClientErrorLevel` and `ServerErrorLevel` set levels by status. Filter noise with `IgnorePath("/health", "/metrics")`. Request and response bodies are off by default (64 KB cap): turn them on only with PII redaction.
8. `AttrFromContext` returns nothing unless middleware has put values in the context first.
9. Flush batch sinks on shutdown: `slog-datadog` `handler.Stop(ctx)`, `slog-loki` `lokiClient.Stop()`, `slog-kafka` `writer.Close()`, `slog-parquet` `buffer.Flush(true)`. For Sentry call `sentry.Flush(timeout)`.
10. Keep `Pipe` chains short (2-4), do not leave an empty `Pipe`, and benchmark the pipeline. Test it with `slogmulti.NewHandleInlineHandler`.
```go
logger := slog.New(slogmulti.
    Pipe(slogsampling.ThresholdSamplingOption{Tick: 5 * time.Second, Threshold: 10, Rate: 0.1}.NewMiddleware()).
    Handler(slogmulti.Router().
        Add(sentryHandler, slogmulti.LevelIs(slog.LevelError)).
        Add(slog.NewJSONHandler(os.Stdout, nil)). // catch-all
        Handler()))
```

## Never

- Log and return the same error. Return it wrapped; log once at the top.
- Use `log.Printf` or `fmt.Println` in services. Use `slog` with key-value pairs.
- Put user ids, request ids, raw URLs or emails in metric labels. Use route templates and bounded values.
- Use a Summary for latency across instances. Use a Histogram.
- Use `irate` in alerts, or an alert with no `for:`. Use `rate` and a duration.
- Call a DB or HTTP function without the caller's `ctx`. Use the `...Context` variant.
- Start a span without `defer span.End()`, or record an error without `SetStatus(codes.Error, ...)`.
- Log PII, passwords, tokens or full request bodies. Log ids and sizes.
- Expose pprof, `/metrics` with sensitive data, or debug logging publicly or permanently. Gate by auth and env.
- Trace or profile 100% of production traffic on every replica. Sample, and enable on a subset.
- Forget to flush batch log handlers and the tracer provider on shutdown. Defer `Stop`, `Flush` and `Shutdown`.

## Check before you report

1. `grep -rn 'log\.Print\|fmt\.Print' --include='*.go' .` shows no new logging outside `main` or CLI output. Service code uses `slog`.
2. `go vet ./...` and `go test -race ./...` pass.
3. `curl -s localhost:<port>/metrics | grep <your_metric>` shows the new metric, with `_total`/`_seconds` naming and only bounded labels.
4. `promtool check rules <file>` passes for any alert rules you wrote, and each has a `for:`.
5. A request through the service yields log lines with `trace_id` and a trace with the expected spans (service, DB, external call).
6. Error paths: an induced failure produces one error log, a span with error status, and a counter increment.
7. pprof and profiling are off by default, gated by an env var and credentials.
8. Shutdown flushes: `tp.Shutdown`, batch log handlers and the metrics server stop cleanly on SIGTERM.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-observability, golang-samber-slog. https://github.com/samber/cc-skills-golang

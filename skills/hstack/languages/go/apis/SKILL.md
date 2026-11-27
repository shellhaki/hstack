---
name: hstack-go-apis
description: "Go API work: gRPC servers and clients (protobuf, status codes, interceptors, deadlines, bufconn tests), GraphQL (gqlgen and graph-gophers: schema, resolvers, DataLoaders, limits) and Swagger docs with swag. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: gRPC, GraphQL and Swagger APIs

Read this when you add or change a gRPC service, a GraphQL schema or resolver, or Swagger/OpenAPI annotations in a Go project.
Use the stack the project already has. Treat the API layer as transport only: it translates and delegates to the service layer.

## Rules

1. Keep transport thin. gRPC handlers and GraphQL resolvers parse input, call a service, and map the result or error back. No SQL and no business rules in them.
2. Never add a second API style or library. If the project has gRPC, extend gRPC. For a new GraphQL API, follow the brief; otherwise gqlgen suits large schemas and federation, and graph-gophers suits small ones with no build step. Avoid `graphql-go/graphql` (code-first, verbose, no SDL).
3. Re-run the generator after every schema or annotation change (`buf generate` or `protoc`, `go tool gqlgen generate`, `swag init`). Never hand-edit generated files (`*.pb.go`, `generated.go`, `models_gen.go`, `docs/`). The next run overwrites edits.

### gRPC

4. Return errors with `status.Errorf(codes.X, ...)`. A plain `error` becomes `codes.Unknown`, and the client cannot decide to retry. Map: bad input `InvalidArgument`, missing `NotFound`, duplicate `AlreadyExists`, no permission `PermissionDenied`, no or bad token `Unauthenticated`, wrong state `FailedPrecondition`, quota `ResourceExhausted`, transient `Unavailable` (safe to retry), bug `Internal`, timeout `DeadlineExceeded`.
5. Do not use `codes.Internal` for everything. `Unavailable` triggers client retries and `InvalidArgument` does not. Wrong codes break retry logic.
6. Wrap every RPC in `Request` and `Response` messages, even for one field. A bare `string` cannot gain fields later without breaking clients.
7. Version proto packages and folders (`proto/user/v1/`). Set `go_package` as `"import/path;userv1"`. Generate into `gen/`, apart from hand-written code. Use `buf lint` and `buf breaking --against '.git#branch=main'` to catch breaking changes.
8. Embed `Unimplemented<Service>Server` (not `Unsafe...`) in server structs. New RPCs then do not break the build.
9. Set a deadline on every client call with `context.WithTimeout`. Without one, a slow server hangs the goroutine.
10. Create the client connection once with `grpc.NewClient` and reuse it. HTTP/2 multiplexes RPCs on one connection. One connection per request wastes TCP and TLS handshakes.
11. Check `ctx.Err()` in long handlers. The caller may have given up.
12. Use interceptors (`grpc.ChainUnaryInterceptor`, `grpc.ChainStreamInterceptor`) for logging, auth and panic recovery, not handler code.
13. Register the standard health service (`grpc_health_v1`). Kubernetes probes need it.
14. Stop with `GracefulStop()` in a goroutine, then fall back to `Stop()` after a timeout. This drains in-flight RPCs without hanging forever.
15. Enable TLS in production, because credentials travel in metadata. Use mTLS or a service mesh between services. Turn reflection off in production, since it exposes every method.
16. Prefer streaming over huge single messages. The default receive limit is 4 MB. Raise `grpc.MaxRecvMsgSize` only if you must. Profile before adding connection pools or keepalive tuning.
17. For field-level validation errors, attach `errdetails.BadRequest` with `status.WithDetails`.

### GraphQL

18. Schema-first. Write SDL, bind resolvers. Mark a field `!` only if the server can always return it. An error in a non-null field nulls the parent object and cascades.
19. Use `ID` for opaque identifiers, not `Int`. Use Relay cursor connections (`Connection`, `Edge`, `PageInfo`) for lists. Offset pagination breaks under concurrent writes.
20. Return mutation results in a payload type (`user` plus `errors`) so business errors do not pollute the top-level GraphQL `errors`.
21. Fix N+1 with DataLoaders. Create them per request in HTTP middleware and put them in the context. A global loader caches across requests and can leak one user's data to another.
22. In gqlgen, give batched fields `resolver: true` under `models.<Type>.fields` in `gqlgen.yml`. Use `autobind` to reuse domain structs. Set the batch wait to about 1 to 2 ms.
23. Never return raw internal errors. Use an error presenter (gqlgen `SetErrorPresenter`) or the `ResolverError` interface (graph-gophers) and log the real error. Put client codes in `Extensions` (`"code": "NOT_FOUND"`). For partial data use `graphql.AddError(ctx, err)`.
24. Authenticate in HTTP middleware and keep the identity in the context. Authorize per field with schema directives (gqlgen `@hasRole`) or resolver checks.
25. Subscriptions: select on `ctx.Done()` and `defer close(ch)`. Otherwise every disconnected client leaks a goroutine.
26. Production needs limits: `extension.FixedComplexityLimit(N)`, introspection only outside production, and optionally persisted queries (APQ). For graph-gophers use `graphql.MaxDepth` and `graphql.MaxParallelism` at `ParseSchema`.
27. graph-gophers type rules: `Int` maps to `int32` (not `int`), `Float` to `float64`. A nullable argument must be a pointer, or `null` fails to unmarshal.

### Swagger (swag)

28. Put general info (`@title`, `@version`, `@host`, `@BasePath`, security definitions) in `main.go`, or pass the file with `swag init -g path/main.go`. Otherwise swag skips it.
29. Put `// FuncName godoc` right before the `@` annotations on each handler. `swag fmt` needs it.
30. `@Param ... body` needs a named struct, not a primitive or `map[string]any`.
31. Add `@Security <name>` to every protected route. Define the scheme once with `@securityDefinitions...`.
32. Quote tags that contain spaces: `@Tags "user accounts"`.
33. Blank-import the generated package (`_ "yourmodule/docs"`) so the spec registers. Use a named import if you override `docs.SwaggerInfo` at run time.
34. Re-run `swag init` after any annotation or struct change. Stale `docs/` ships wrong contracts. Gate or disable the Swagger UI in production.

## Patterns

gRPC server with interceptors, health and graceful stop:

```go
srv := grpc.NewServer(grpc.ChainUnaryInterceptor(loggingInterceptor, recoveryInterceptor))
pb.RegisterUserServiceServer(srv, svc)
healthpb.RegisterHealthServer(srv, health.NewServer())
go srv.Serve(lis)

// on shutdown
done := make(chan struct{})
go func() { srv.GracefulStop(); close(done) }()
select {
case <-done:
case <-time.After(15 * time.Second):
    srv.Stop()
}
```

Map domain errors to status codes:

```go
if errors.Is(err, ErrNotFound) {
    return nil, status.Errorf(codes.NotFound, "user %q not found", req.UserId)
}
return nil, status.Errorf(codes.Internal, "lookup failed: %v", err)
```

Client call with a deadline and a reused connection:

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
resp, err := client.GetUser(ctx, &userv1.GetUserRequest{UserId: id})
```

In-memory gRPC test with `bufconn`:

```go
lis := bufconn.Listen(1 << 20)
srv := grpc.NewServer()
pb.RegisterUserServiceServer(srv, newTestService())
go srv.Serve(lis)
conn, _ := grpc.NewClient("passthrough:///bufconn",
    grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) { return lis.DialContext(ctx) }),
    grpc.WithTransportCredentials(insecure.NewCredentials()))
```

Per-request DataLoader middleware:

```go
func DataLoaders(db *sql.DB, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        l := &Loaders{PostsByUserID: newPostsByUserIDLoader(r.Context(), db)}
        next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), loadersKey, l)))
    })
}
```

Subscription that stops when the client leaves:

```go
ch := make(chan *model.Message, 1)
sub := r.pubsub.Subscribe(room) // subscribe once, before the goroutine
go func() {
    defer close(ch)
    for {
        select {
        case <-ctx.Done():
            return
        case msg := <-sub:
            select {
            case ch <- msg:
            case <-ctx.Done():
                return
            }
        }
    }
}()
return ch, nil
```

gqlgen production limits:

```go
srv.Use(extension.FixedComplexityLimit(200))
if os.Getenv("ENV") != "production" {
    srv.Use(extension.Introspection{})
}
```

Swag operation annotation:

```go
// ShowAccount godoc
// @Summary  Get account by ID
// @Tags     accounts
// @Produce  json
// @Param    id   path int true "Account ID"
// @Success  200  {object} model.Account
// @Failure  404  {object} api.ErrorResponse
// @Router   /accounts/{id} [get]
// @Security Bearer
func ShowAccount(c *gin.Context) {}
```

## If the project uses gqlgen

- Bootstrap with `go run github.com/99designs/gqlgen init`. Regenerate with `go tool gqlgen generate` (Go 1.24+ with `go get -tool`), or the project's `go generate` hook.
- Use one resolver struct per type (`userResolver`), each delegating to a service.
- Choose gqlgen for large schemas, Apollo Federation v2, or strict generated types.

## If the project uses graph-gophers/graphql-go

- It is reflection-based with no build step. Resolver method names and Go types must match the SDL. A mismatch fails at `ParseSchema`, not at compile time.
- Return resolver wrapper structs, not domain models. Custom scalars implement `UnmarshalGraphQL` and `MarshalJSON`.

## If the project uses swaggo (gin-swagger, echo-swagger, http-swagger, fiber-swagger)

- Mount the UI with the package that matches the router. All of them need `github.com/swaggo/files`. UI path is `/swagger/index.html`.
- Struct tags refine the schema: `example`, `enums`, `minimum`, `swaggertype`, `swaggerignore:"true"`.
- For gRPC services, do not use swag. Use grpc-gateway with its own OpenAPI generator.

## Never

- Return `fmt.Errorf` from a gRPC handler. Return `status.Errorf` with a code.
- Call a gRPC method with `context.Background()` and no timeout. Add `WithTimeout`.
- Dial a new gRPC connection per request. Reuse one.
- Leave reflection or GraphQL introspection on in production. Gate by environment.
- Create a DataLoader at package level. Create it per request.
- Put DB calls inside a child resolver loop. Batch through a loader.
- Hand-edit generated code or `docs/`. Fix the source and regenerate.
- Use `int` for a graph-gophers `Int` field. Use `int32`.
- Put a primitive or `map[string]any` in `@Param body`. Use a named struct.
- Send DB or internal error text to API clients. Log it and return a safe message.

## Check before you report

- Regenerate and confirm no diff beyond your change: `buf generate`, `go tool gqlgen generate`, or `swag init`, then `git status`.
- `buf lint` and `buf breaking --against '.git#branch=main'` pass (if the project uses buf).
- `go build ./...`, `go vet ./...` and `go test ./...` pass.
- gRPC tests assert status codes with `status.Code(err)`, not only that an error occurred.
- `grep -rn "codes.Unknown\|reflection.Register" --include=*.go .` shows nothing unintended, and reflection is not enabled in production config.
- `grep -rn "context.Background()" --include=*.go` in client code shows no un-timed outgoing calls.
- For GraphQL: a complexity limit is set, introspection is gated, and loaders are built in per-request middleware.
- For Swagger: open `/swagger/index.html` or inspect `docs/swagger.json` and confirm your route, params, responses and security appear.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-grpc, golang-graphql, golang-swagger. https://github.com/samber/cc-skills-golang

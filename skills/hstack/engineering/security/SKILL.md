---
name: hstack-security
description: "Security in everyday code. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Security in everyday code

Most security bugs are not exotic: a handler that checks **who** you are but not **what you may
touch**, input that reaches a query or a shell, a secret in a log. Smaller models miss these because
the happy-path test passes. Read this for any handler, endpoint, job or form that takes input or
touches another user's data.

## Every handler: four questions
1. **Who is calling?** Authentication happens before anything else, with the project's existing
   middleware. Never roll your own.
2. **May they touch *this* record?** Load the record, then check it belongs to the caller (or their
   team or role) **on the server**. An ID from the URL, body or a hidden field is a claim, not a
   permission. Return 404 (not 403) when revealing that a record exists would leak information, and do
   whatever the project already does.
3. **Is every input validated?** Type, length, range and format at the edge, with the project's schema
   library. Reject unknown fields when the input is used to update records, so a caller can't set
   `role` or `owner_id` (mass assignment).
4. **What leaves?** Responses return only the fields the caller may see: no password hashes, tokens,
   internal IDs or other users' data. Errors say what's wrong without stack traces or SQL.

## Input never becomes code
- **SQL:** parameters or the query builder only. Never build a query with string concatenation or
  template strings, including `ORDER BY` and column names: pick those from an allowlist.
- **Shell:** pass arguments as an array to the process API; never build a command string from input.
- **HTML:** let the framework escape. `dangerouslySetInnerHTML`, `v-html`, `innerHTML` need sanitized
  input and a reason in the report.
- **Paths:** resolve user-supplied file names inside an allowed folder and reject `..`.
- **URLs fetched by the server:** allowlist hosts, or the server can be pointed at internal services.
- **Deserialization and regex:** no `eval`, no unsafe YAML or pickle loads of input; avoid regex that
  can backtrack forever on long input.

## Secrets and tokens
- Secrets come from the environment or the project's secret store; never in code, tests, fixtures or
  logs.
- Compare tokens and signatures with a constant-time function. Verify webhook signatures over the raw
  body, before parsing.
- Tokens and reset links expire and work once. Passwords use the project's existing hashing (bcrypt,
  argon2), never a plain hash.

## Abuse
Login, sign-up, reset and anything that sends email or costs money need a rate limit, if the project
has one. Anything a user can repeat (payment, vote, invite) is idempotent (`engineering/data/SKILL.md`).

## Test the bad paths
For every handler you write or change, add at least:
- a request without auth (expect 401)
- a request from another user for this user's record (expect 403 or 404, never the data)
- one invalid input (expect a 4xx with a clear message, nothing stored)

## In your report
List each handler you touched with the answers to the four questions. Anything you couldn't check goes
under NOT VERIFIED.

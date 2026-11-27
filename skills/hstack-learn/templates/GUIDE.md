# <name> <version>: how it works and how to use it

Source: `<repo>` @ `<commit>`. Paths below are relative to that checkout.

## Shape
<5–10 lines: the main parts and how a call flows through them, e.g. "CLI → server (src/server/) →
session manager (src/session/) → provider adapters (src/provider/)". Name the files.>

## <Focus area 1>
**How it works:** <the path of one real call, with file:line at each step>.
**Defaults and limits:** <values, with file:line>.
**Errors:** <what fails, how it fails, what the caller sees>.

**Use** (proved against <version>):
```<language>
<the smallest working call, copied from a probe that ran>
```
<One line on what it returns or prints.>

**Don't:** <the tempting wrong way, and why it fails, with file:line or test name>.

## <Focus area 2>
…

## Config
| Key | Default | Effect | Where read |
|---|---|---|---|

## Version notes
<Differences between versions that matter here, and any mismatch between parts of the project (for
example server 2.4.1 with SDK 1.19.6), with what breaks and the workaround.>

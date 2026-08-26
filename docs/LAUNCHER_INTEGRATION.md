# Comet Launcher ↔ Web API

**Production base URL:** `https://cometclient.dev`

The launcher should use:

```text
https://cometclient.dev/api
```

for all production API requests. The production domain is live and serving the
API today — there is nothing to wait on.

> **Testing base:** `https://comet-web-cf-worker-testing.cold-mc.workers.dev`
> shares the same database as production. Use it for development builds only;
> data written there shows up on the live site.

All endpoints are JSON, CORS-open (including preflight), and require **no API
key** from the launcher.

---

## 1. Presence heartbeat

### `POST /api/ping`

The launcher must send a heartbeat while the user is signed in.

**Timing**

* Send the first ping immediately after the Minecraft account is known.
* Continue pinging using the `next_ping_seconds` value returned by the server.
  The default is currently **120 seconds** — read the field, don't hard-code it.
* Stop pinging when the user signs out or the launcher exits.
* A player disappears from the online list **5 minutes after their last
  successful ping**, so one missed beat is harmless.

### Request

```http
POST https://cometclient.dev/api/ping
Content-Type: application/json
```

```json
{
  "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  "username": "Notch",
  "launcher_version": "0.1.0"
}
```

| Field              | Required | Description                                            |
| ------------------ | -------- | ------------------------------------------------------ |
| `uuid`             | Yes      | Minecraft UUID, dashed or undashed                     |
| `username`         | No       | Hint used only if server-side UUID lookup fails        |
| `launcher_version` | No       | Launcher version                                       |

Invalid UUIDs return `400`.

```bash
curl -X POST "https://cometclient.dev/api/ping" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"069a79f4-44e9-4726-a5be-fca90e38aaf5","launcher_version":"0.1.0"}'
```

### `GET` alternative

For clients that cannot POST:

```http
GET https://cometclient.dev/api/ping?uuid=<uuid>&username=<name>&launcher_version=<ver>
```

### `200 OK`

```json
{
  "ok": true,
  "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
  "username": "Notch",
  "first_seen": "2026-08-26T06:08:32.491Z",
  "last_seen": "2026-08-26T06:10:48.296Z",
  "next_ping_seconds": 120
}
```

### UUID resolution

The server resolves `Minecraft UUID → username` itself using Mojang and
mirrors, and caches the result for **6 hours**. The launcher never needs to do
its own lookup — `username` in the request is only a fallback.

### Launcher behaviour

1. User logs into their Minecraft account.
2. Send the first `/api/ping` immediately.
3. Read `next_ping_seconds` and schedule the next heartbeat from it.
4. Repeat until sign-out or exit.
5. On failure: log it, do **not** block the UI, retry on the next scheduled
   tick. Never stop the heartbeat over a temporary network error.

---

## 2. Online players

### `GET /api/online`

Players count as online for **300 seconds** after their last heartbeat.
Responses are cached ~15s; **poll no faster than once every 30 seconds**.

#### Count only

```http
GET https://cometclient.dev/api/online?c=true
```

```json
{
  "count": 2,
  "last_ping": "2026-08-26T06:10:49.706Z",
  "updated_at": "2026-08-26T06:10:58.241Z",
  "window_seconds": 300
}
```

`last_ping` is the most recent heartbeat from any online player (`null` when
nobody is online); `updated_at` is when the snapshot was generated.

#### Count + roster

```http
GET https://cometclient.dev/api/online
```

```json
{
  "count": 2,
  "last_ping": "2026-08-26T06:10:49.706Z",
  "updated_at": "2026-08-26T06:10:58.241Z",
  "window_seconds": 300,
  "players": [
    {
      "uuid": "853c80ef-3c37-49fd-aa49-938b674adae6",
      "username": "jeb_",
      "launcher_version": "0.1.0",
      "first_seen": "2026-08-26T06:05:00.000Z",
      "last_seen": "2026-08-26T06:10:41.000Z",
      "seconds_since_ping": 8,
      "avatar_url": "https://render.crafty.gg/3d/bust/jeb_",
      "render_url": "https://render.crafty.gg/3d/full/jeb_?x=-30&z=50"
    }
  ]
}
```

`username` can be `null` if every lookup provider failed; the avatar and render
URLs then fall back to Steve.

### Launcher behaviour

* Poll no faster than every **30 seconds**.
* Use `?c=true` when only the number is needed.
* Do not treat a cached response as a connection failure.

---

## 3. Beta access

```text
Token
  ↓
POST /api/beta/verify        (does NOT consume the token)
  ↓
Show Minecraft identity → user confirms
  ↓
POST /api/beta/confirm       (consumes the token)
  ↓
GET /api/beta/download/<id>  (works exactly once)
```

### 3.1 Verify — `POST /api/beta/verify`

Checks a token and returns the identity to confirm. **Does not consume it** —
calling it repeatedly is safe.

```json
{ "token": "cmt_..." }
```

#### `200 OK`

```json
{
  "ok": true,
  "token_id": "...",
  "tester": {
    "id": "...",
    "display_name": "...",
    "mc_username": "Notch",
    "mc_uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
    "render_url": "https://render.crafty.gg/3d/full/Notch?x=-30&z=50",
    "bust_url": "https://render.crafty.gg/3d/bust/Notch",
    "skin_url": "https://crafatar.com/skins/069a79f444e94726a5befca90e38aaf5"
  },
  "build": {
    "id": "...",
    "version": "1.21.4-beta.3",
    "platform": "windows",
    "filename": "comet-beta.exe",
    "size_bytes": 84213760,
    "sha256": "...",
    "notes": "..."
  },
  "link_ttl_seconds": 300
}
```

`build` is `null` when nothing has been published yet — the token is still
unspent, so tell the user to wait rather than reporting a bad token.

**Keep `build.sha256`.** This is the only response that carries it; `/confirm`
does not repeat it, and it is what you check the download against.

#### Launcher behaviour

1. Show `tester.mc_username` and `tester.render_url`.
2. Offer **That's me** / **Not me**.
3. Only call `/confirm` on **That's me**.

### 3.2 Confirm — `POST /api/beta/confirm`

Consumes the token and mints a single-use download link.

```json
{
  "token": "cmt_...",
  "build_id": "...",
  "confirmed": true
}
```

`build_id` is **optional** — omitted, the server picks the latest active build.
`confirmed` is optional too; only an explicit `false` is rejected.

#### `200 OK`

```json
{
  "ok": true,
  "download_id": "...",
  "url": "https://cometclient.dev/api/beta/download/...",
  "expires_in": 300,
  "expires_at": "2026-08-26T06:15:00.000Z",
  "build": {
    "id": "...",
    "version": "1.21.4-beta.3",
    "platform": "windows",
    "filename": "comet-beta.exe",
    "size_bytes": 84213760
  }
}
```

Once this succeeds the token is spent, the link is single-use, and it expires
after `expires_in` seconds. Start the download immediately.

**Never automatically retry `/confirm`.** A retry cannot un-spend the token; it
returns `409` and the user's only remedy is a new token from staff.

### 3.3 Download — `GET /api/beta/download/<download_id>`

Streams the build with `Content-Disposition: attachment`. The link is claimed
*before* the bytes start, so:

```text
First request  → 200, download starts
Second request → 410 Gone
```

Do not automatically retry a used or failed download URL.

---

## 4. Download integrity

Verify the downloaded file against `build.sha256` from the **verify** response:

```text
Download → SHA-256 → compare with build.sha256
   match → install
   mismatch → delete and treat as a failed download
```

---

## 5. Error handling

Every error body has the same shape — a human-readable `error` and a
machine-readable `reason`. **There is no `ok` field on errors:**

```json
{ "error": "Invalid token", "reason": "invalid" }
```

Branch on `reason`, and show the user the remedy rather than the raw string.

### Verify — `POST /api/beta/verify`

| HTTP  | Reason             | Meaning / remedy                                    |
| ----- | ------------------ | --------------------------------------------------- |
| `400` | `missing`          | No token supplied                                   |
| `401` | `invalid`          | Token does not exist — check for typos              |
| `401` | `expired`          | Token expired — ask staff for a new one             |
| `401` | `revoked`          | Token revoked — ask staff for a new one             |
| `401` | `already_redeemed` | Token already used — ask staff for a new one        |
| `403` | `inactive`         | Beta access is not active for this account          |

### Confirm — `POST /api/beta/confirm`

| HTTP  | Reason             | Meaning / remedy                                       |
| ----- | ------------------ | ------------------------------------------------------ |
| `400` | `missing`          | No token supplied                                       |
| `400` | `unconfirmed`      | Sent `confirmed: false`                                 |
| `401` | `invalid` / `expired` / `revoked` | As above                                 |
| `403` | `inactive`         | Beta access is not active                               |
| `404` | `no_build`         | Nothing published yet — **token is NOT spent**, wait    |
| `409` | `already_redeemed` | Token already consumed — needs a new token. Never retry |

### Download — `GET /api/beta/download/<id>`

| HTTP  | Reason          | Meaning                                  |
| ----- | --------------- | ---------------------------------------- |
| `400` | `invalid`       | Malformed link id                        |
| `404` | `invalid`       | Unknown link                             |
| `404` | `missing_build` | Build was deleted after the link was made |
| `410` | `used`          | Link already claimed — do not retry       |
| `410` | `expired`       | Link expired — needs a new token          |

---

## 6. Endpoint reference

| Method | Endpoint                  | Purpose                          |
| ------ | ------------------------- | -------------------------------- |
| `POST` | `/api/ping`               | Player heartbeat                 |
| `GET`  | `/api/ping`               | Heartbeat alternative            |
| `GET`  | `/api/online`             | Online count + roster            |
| `GET`  | `/api/online?c=true`      | Online count only                |
| `POST` | `/api/beta/verify`        | Validate token (non-consuming)   |
| `POST` | `/api/beta/confirm`       | Consume token, mint download link |
| `GET`  | `/api/beta/download/<id>` | Single-use build download        |

Production base: `https://cometclient.dev`
Testing base: `https://comet-web-cf-worker-testing.cold-mc.workers.dev`

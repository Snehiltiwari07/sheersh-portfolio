# Jiya API — POST /api/chat

Updated 2026-10-23. Source: api/chat.js. Consumer: src/components/ChatEngine.jsx. Visitor answers come from **Groq**, not xAI/Grok or a scripted fallback.

## Request

JSON messages contains 1–12 objects. Each has role user or assistant and nonempty content of at most 1600 characters. The final message must be user. System-role messages are rejected. The handler caps serialized bodies at 16384 bytes. The UI additionally limits a new question to 1200 characters and retains the last twelve messages.

~~~json
{"messages":[{"role":"user","content":"What AI workflow services does Sheersh offer?"}]}
~~~

Origin is optional for server callers. Present origins must match the built-in production/local set or CHAT_ALLOWED_ORIGINS. See api/chat.js for the exact set; review both APIs' origin settings when adding a domain.

## Responses

| Status | Meaning |
| --- | --- |
| 200 | text, action, mode: ai |
| 400 | Invalid/malformed/oversized payload in the function handler |
| 403 | Origin rejected |
| 405 | Non-POST method; Allow: POST |
| 429 | 15 requests/IP/minute per instance; Retry-After: 60 |
| 502 | Provider failure, timeout or malformed/empty answer |
| 503 | GROQ_API_KEY missing |

Errors have an error string. Cache-Control is no-store. The local Vite streaming adapter can return 413 with plain text before the handler when the stream exceeds 16384 bytes.

Success text is capped at 3000 characters. action is hire, services, reviews or work, inferred from the latest question. ChatEngine links back to homepage sections or opens the enquiry drawer. The chat does not submit enquiries or perform agent actions.

## Provider and grounding

GROQ_MODEL defaults to llama-3.3-70b-versatile. The server calls Groq chat completions with a ten-second timeout, temperature 0.3 and max_tokens 350. The UI timeout is twelve seconds. Keys stay server-side.

Grounding uses portfolio knowledge, reviews, achievements and career material. The system requests factual answers without fabricated clients, promises or completed-action claims. Generated text is not independent verification of portfolio claims.

Greetings/suggestions are local UI text. Failed visitor requests show error/retry/contact controls rather than canned answers. Rate limits are memory-based and reset across cold starts/instances.

npm run test:chat uses mocks, not live credentials. For local chat set GROQ_API_KEY in .env.local and restart Vite. Production requires function environment configuration.

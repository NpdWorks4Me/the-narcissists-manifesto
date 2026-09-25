# Local LLM Setup — Session Signoff

**Date:** 2026-09-01 (updated after Gemma-4-E2B setup)
**Host:** Cynthias-MacBook-Air (macOS 26.3.1, Apple Silicon arm64, 8 GB RAM, 8 cores)
**Status:** ⚙️ Setup complete · **Servers currently RUNNING** · See §5 for restart commands

---

## 1. What was accomplished

| # | Task | Outcome |
|---|------|---------|
| 1 | Downloaded & ran Llama-3.2-1B | Done via Ollama (deleted by request) |
| 2 | Wired a local model into DeepSeek Harness | `ollama-local` provider added, verified end-to-end — but local models too weak for the harness's 13k-token agent prompt, harness usage deprecated |
| 3 | Set up Obsidian integration (Copilot plugin) | Copilot v4.0.4 installed in vault `.obsidian/plugins/copilot`, enabled in `community-plugins.json` |
| 4 | Installed Open WebUI for local chat UI | v0.11.3, web search enabled (DuckDuckGo), verified end-to-end |
| 5 | Model evolution | 1B (deleted) → qwen3:8b (tried, deleted — too heavy) → kept `llama3.2:3b` + `phi3.5` → **added `gemma4-e2b-uncensored` (current default)** |
| 6 | Accounts | Admin account `nottodaysay10@gmail.com`; temporary test account deleted |
| 7 | Gemma-4-E2B setup (latest) | Downloaded GGUF from HF `HauhauCS/Gemma-4-E2B-Uncensored-HauhauCS-Aggressive` (Q4_K_P), imported to Ollama, set as **default model**, refusal-ladder tested |

## 2. Model inventory (Ollama)

| Model | Size | Capabilities | Notes |
|-------|------|--------------|-------|
| `gemma4-e2b-uncensored:latest` (4.6B) | 3.5 GB | completion, tools, thinking | **DEFAULT in Open WebUI.** Abliterated "uncensored aggressive" build. Native tool-calling verified at API level; self-initiated tool use in WebUI agent loop unreliable → use legacy search path. Refusal-ladder test: 3/3 no refusals |
| `phi3.5:latest` (3.8B) | 2.2 GB | completion | No native tool-calling; web search via legacy forced path. ~10 tok/s |
| `llama3.2:3b` | 2.0 GB | completion, tools | Native tool-calling capable |
| `nomic-embed-text` | 274 MB | embeddings | For Open WebUI / Obsidian RAG |

All live in `~/.ollama/models`.

### Gemma-4-E2B import details
- **Source:** `https://huggingface.co/HauhauCS/Gemma-4-E2B-Uncensored-HauhauCS-Aggressive` (public, not gated)
- **Quantization:** `Gemma-4-E2B-Uncensored-HauhauCS-Aggressive-Q4_K_P.gguf` (3.45 GB download; Q8 at 4.7 GB risks swap-thrash on 8 GB RAM)
- **Local files:** `~/models/gemma4-e2b/Gemma-4-E2B-Q4_K_P.gguf` + `Modelfile` (Gemma chat template, `PARAMETER temperature 0.7`, `top_p 0.95`, stop `<end_of_turn>`)
- **Create command:** `cd ~/models/gemma4-e2b && ollama create gemma4-e2b-uncensored -f Modelfile`
- **License:** Gemma (base `google/gemma-4-e2b-it`), abliterated by HauhauCS
- **Multimodal:** repo ships `mmproj-...f16.gguf` vision projector (~1 GB) — **not installed**, so this build is text-only. Add via `ollama create` with the mmproj layer if image input is wanted

## 3. Software installed

| Software | Where | Version |
|----------|-------|---------|
| Ollama | `/opt/homebrew/bin/ollama` (Homebrew) | 0.33.0 |
| Python 3.12 | `/opt/homebrew/bin/python3.12` (Homebrew) | 3.12.14 (needed by Open WebUI; 3.14 too new) |
| Open WebUI | venv at `~/.open-webui/venv` | 0.11.3 |
| Obsidian Copilot plugin | `the-narcissists-manifesto/.obsidian/plugins/copilot/` | 4.0.4 |

## 4. Configuration & credentials

### Open WebUI (`http://127.0.0.1:8080`)
- **Admin account:** `nottodaysay10@gmail.com` / `Jes733137` (only account)
- **DB + secret key:** `~/.open-webui/venv/lib/python3.12/site-packages/open_webui/data/webui.db`
  - Secret key file: `./.webui_secret_key` (in vault root — do not commit)
- **Default model:** `gemma4-e2b-uncensored:latest` (config key `ui.default_models`)
- **Web search:** enabled via config DB rows `web.search.enable=true`, `web.search.engine=duckduckgo`
  - The correct env vars for v0.11.3 are `ENABLE_WEB_SEARCH=true WEB_SEARCH_ENGINE=duckduckgo` (old `ENABLE_RAG_WEB_SEARCH` is ignored)
  - For small local models use the **legacy function-calling path** in requests: `features: {web_search: true}` + `params: {function_calling: "legacy"}` — native tool-calling requires the model to self-initiate tools, which small models do unreliably
- **Signup:** disabled (single-user admin only)

### DeepSeek Harness (`~/.dsh/settings.yaml`)
- `ollama-local` provider: `baseURL: http://127.0.0.1:11434/v1`, model `llama3.2:3b`, `compat: {supportsDeveloperRole: false, maxTokensField: max_tokens}`
- Placeholder credential `OLLAMA_API_KEY` added to `~/.dsh/.credentials.yaml`
- **Recommendation:** leave configured but don't rely on it — local models can't carry the harness agent prompt

### Obsidian (vault: the-narcissists-manifesto)
- Copilot plugin enabled — user still needs to add custom model (e.g. `llama3.2:3b` or `gemma4-e2b-uncensored`, provider Ollama) + embedding `nomic-embed-text` in Copilot settings, then restart Obsidian
- Requires Ollama running with `OLLAMA_ORIGINS="app://obsidian.md*"` for CORS

## 5. How to restart everything

```bash
# 1. Ollama (needed by everything below)
OLLAMA_CONTEXT_LENGTH=8192 OLLAMA_ORIGINS="app://obsidian.md*" /opt/homebrew/bin/ollama serve

# 2. Open WebUI
ENABLE_WEB_SEARCH=true WEB_SEARCH_ENGINE=duckduckgo ~/.open-webui/venv/bin/open-webui serve

# 3. CLI chat (no server config needed)
ollama run gemma4-e2b-uncensored
```

Optional: `brew services start ollama` for always-on, plus `launchctl setenv OLLAMA_ORIGINS "app://obsidian.md*"` for Obsidian CORS.

## 6. Known limitations (honest notes)

- **8 GB RAM ceiling:** qwen3:8b (and anything ≥5 GB weights) exceeds memory → 6+ GB swap, server hangs. Stick to ≤4.6B models here. Gemma Q8 (4.7 GB) is borderline; Q4_K_P is the safe pick.
- **Small models and agents:** they work for simple chat + forced web search, but cannot carry heavy agent prompts (the DeepSeek Harness's ~13k-token system prompt makes them degenerate into repeated tool-call gibberish).
- **Native tool-calling vs. agent loop:** gemma4-e2b does emit correct tool calls via raw API (verified round-trip), but in Open WebUI's native agent loop it often fails to self-initiate among a large tool set. `phi3.5` has no tool capability at all.
- **Speed:** 3–4.6B models generate ~10–70 tok/s on CPU; web-search answers take ~40–65 s.
- **gemma4-e2b is uncensored:** refusal-ladder test (profanity → insults → shoplifting instructions) = 3/3 complied with zero refusals. It will not refuse requests typical models block, including illegal or harmful ones. It's the default for new chats — switch default if a safer model is wanted.
- **Persistence:** servers currently running in the session that set them up; not auto-starting at login.

## 7. Cleanup notes

- `qwen3:8b` and `llama3.2:1b` deleted from Ollama.
- Test account `local-tester@localhost` deleted from Open WebUI DB.
- `~/.dsh/settings.yaml` updated so no references to deleted models remain.
- Files created: this signoff, `.webui_secret_key` (vault root), `~/models/gemma4-e2b/` (GGUF + Modelfile), Open WebUI data under `~/.open-webui`.

---

*Signed off: session complete. Servers were left RUNNING (Ollama :11434, Open WebUI :8080) at the last user request; stop them with `job_kill` on their background jobs or by ending the session.*

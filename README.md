# VEYRO

VEYRO is an AI-powered platform for creating Android applications and 2D games.

## Core pipeline

Prompt → AI Agents → Project → Build Engine → Build Worker → APK/AAB → Test → Export

## Repository layout

- `build-engine/` — build orchestration and job validation
- `build-worker/` — isolated Android build worker
- `api/` — backend API
- `agents/` — specialized AI agents
- `frontend/` — VEYRO web interface
- `projects/` — generated project workspace

This repository is the dedicated VEYRO codebase.
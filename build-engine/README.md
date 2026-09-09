# VEYRO Build Engine

The Build Engine validates build requests, queues jobs, accepts structured Android projects, and exposes the AI generation gateway.

## Endpoints

- GET /health
- GET /build
- POST /ai/generate — generates a structured Android project through an OpenAI-compatible provider.
- POST /build — queues an APK/AAB build.
- POST /build/claim — worker claims the oldest queued job.
- POST /build/:id/result — worker reports success/failure.
- GET /build/:id — build status.

## AI provider

Set these server-side environment variables:

- AI_BASE_URL — OpenAI-compatible API base URL.
- AI_API_KEY — secret API key. Never put this in the Android app.
- AI_MODEL — model name.

Example request:

    { "prompt": "Create a simple To-Do Android app with add and delete tasks." }

The generator returns a structured project with files. The generated project is then passed to the Build Worker.

## Security

AI credentials remain on the server. Client applications send prompts only. Generated file paths are constrained to relative paths and must not contain traversal segments.
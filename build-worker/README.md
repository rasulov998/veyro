# VEYRO Build Worker

The Build Worker is the isolated execution layer for Android builds.

## Build flow

1. Receive a validated build job from Build Engine.
2. Claim one queued job.
3. Use an isolated workspace for the project.
4. Run the project's Gradle wrapper.
5. Produce APK or AAB.
6. Report build status and artifact metadata to Build Engine.

## Container environment

The worker image provides:

- Eclipse Temurin JDK 17
- Android command-line tools
- Android SDK Platform 36
- Android Build Tools 36.0.0
- Android platform-tools
- Gradle through each project's Gradle Wrapper

The official Android command-line tools package is used during image construction.

## Security rules

- Never put production secrets into generated project files.
- Never execute arbitrary shell commands supplied by a project prompt.
- Only execute the project's trusted Gradle wrapper.
- Keep each build in an isolated workspace.
- Return only build metadata and approved artifacts.

## Current limitation

A trusted project-materialization step must place the generated Android project into the worker workspace before the worker claims and executes the job.
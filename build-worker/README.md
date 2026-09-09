# VEYRO Build Worker

The Build Worker is the isolated execution layer for Android builds.

Planned flow:

1. Receive a validated build job.
2. Create an isolated workspace.
3. Materialize the generated Android project.
4. Run Gradle.
5. Run automated checks.
6. Collect APK/AAB outputs.
7. Return build metadata and logs.

The worker must never receive production secrets in generated project files.
FROM eclipse-temurin:17-jdk-jammy

ARG ANDROID_CMDLINE_TOOLS_VERSION=15859902

ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator:/opt/android-sdk/build-tools/36.0.0:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl unzip ca-certificates git bash libc6-i386 lib32stdc++6 lib32z1 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p "${ANDROID_SDK_ROOT}/cmdline-tools" \
    && curl -fsSL -o /tmp/cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS_VERSION}_latest.zip" \
    && unzip -q /tmp/cmdline-tools.zip -d "${ANDROID_SDK_ROOT}/cmdline-tools" \
    && mv "${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools" "${ANDROID_SDK_ROOT}/cmdline-tools/latest" \
    && rm /tmp/cmdline-tools.zip \
    && yes | sdkmanager --licenses >/dev/null \
    && sdkmanager --update \
    && sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" \
    && yes | sdkmanager --licenses >/dev/null \
    && chmod -R a+rX "${ANDROID_SDK_ROOT}"

WORKDIR /worker
COPY package.json ./
COPY src ./src
COPY test.js ./

ENV NODE_ENV=production
ENV WORKSPACE_ROOT=/workspace/veyro
ENV POLL_MS=2000

CMD ["node", "src/index.js"]

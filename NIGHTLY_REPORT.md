# Nightly Report — 2026-05-10

## Task
CI/CD: Android release keystore setup

## What changed
- `scripts/generate-keystore.sh` — new file (executable). Interactive keytool wrapper that generates a 4096-bit RSA keystore with configurable alias/password/org, performs a safety check to avoid overwriting an existing file, prompts for passwords with confirmation, and prints the complete base64-encode command, all four required GitHub Actions secret names and values, and local `~/.zshrc` export snippet.
- `.github/workflows/ci.yml` — added `build-android` job. Runs on `main`-branch pushes only (guarded by `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`). Depends on the existing `verify` job. Decodes `ANDROID_KEYSTORE_B64` secret to `/tmp/shazzar-release.keystore`, sets `ANDROID_KEYSTORE_PATH` in `$GITHUB_ENV`, then runs `bundle exec fastlane android build`. Uploads the AAB as an Actions artifact (14-day retention).
- `README.md` — replaced the Phase 4 TODO line with a full 5-step Android signing setup guide (generate, base64-encode, set secrets, how CI uses it, local development). Kept the Google Play TODO as a separate note.
- `PLAN.md` — moved "Add weekly habit recurrence to BootReceiver past-due advancement logic" (pre-existing, confirmed by PR #12) and "CI/CD: generate release keystore + configure Android signing env vars" from Active to Done with date 2026-05-10. Google Play task remains Active.

## What was hard
Nothing structurally hard. The env var naming discrepancy between the Fastfile (`ANDROID_KEYSTORE_PATH`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) and the Gradle properties (`ANDROID_UPLOAD_STORE_FILE`, `ANDROID_UPLOAD_STORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`) was already handled correctly by the Fastfile `build` lane — it maps from one to the other. The Fastfile did not need any changes.

## What I found while implementing
- The Fastfile's `build` lane already correctly maps env vars to Gradle properties — no changes needed there.
- `.gitignore` already has `*.keystore` (except `!debug.keystore`) — the generated keystore is safe from accidental commits.
- The existing `verify` Fastlane lane (which runs tests) is used for PRs. The `build-android` CI job correctly runs only on main-branch pushes after verify succeeds.
- `ANDROID_KEYSTORE_B64` is the secret name chosen for the base64-encoded keystore (not `ANDROID_KEYSTORE_PATH`, which would be a local file path and unusable as a secret value).

## Open questions
- The `build-android` CI job will be skipped silently if `ANDROID_KEYSTORE_B64` is not set yet (the decode step would fail with an empty string). Consider adding an explicit check or letting the first post-setup push validate it.
- Keystore backup policy: the generated `.keystore` file should be stored in a password manager or encrypted drive. Losing it means the Play Store listing cannot be updated. This is a human responsibility — the script prints a warning but cannot enforce it.
- `keystore.b64` is printed to stdout during setup; the user should delete it after pasting into GitHub Secrets — the script warns but does not clean up.

## iOS stub status
N/A — Android signing only. iOS code signing is deferred pending Apple Developer account. The Fastfile iOS `build` lane already has the appropriate stub and comment.

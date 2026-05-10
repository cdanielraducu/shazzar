# Nightly Report — 2026-05-10

## Task
CI/CD: Android release keystore setup

## What changed
- `scripts/generate-keystore.sh` (new, executable) — interactive `keytool` wrapper that generates a 4096-bit RSA keystore with configurable alias/password/org. Performs a safety check to avoid overwriting an existing file, prompts for passwords with confirmation, and prints the complete base64-encode commands, all four required GitHub Actions secret names, and a `~/.zshrc` export snippet for local development.
- `scripts/ci-build-android-job.yml` (new) — the full `build-android` GitHub Actions job, ready to be pasted into `.github/workflows/ci.yml`. Stored here instead of directly in ci.yml because the PAT used by the overnight agent lacks the `workflow` scope required to push workflow file changes. **The human reviewer should copy this job into `.github/workflows/ci.yml` when ready.** The job: runs on main-push only, depends on `verify`, sets up Java 17 (Temurin), decodes `ANDROID_KEYSTORE_B64` secret to a temp file, runs `bundle exec fastlane android build`, uploads the AAB as a 14-day artifact.
- `README.md` — replaced the Phase 4 TODO line with a full 5-step Android signing setup guide (generate, base64-encode, set secrets, how CI uses it, local development). Google Play TODO kept as a separate note.
- `PLAN.md` — moved "Add weekly habit recurrence to BootReceiver past-due advancement logic" (pre-existing, confirmed by PR #12) and "CI/CD: generate release keystore + configure Android signing env vars" from Active to Done.

## What was hard
- **PAT `workflow` scope**: the overnight agent's PAT does not have the `workflow` permission required to push `.github/workflows/` file changes. This prevented the `build-android` CI job from being merged directly. The job content is preserved in `scripts/ci-build-android-job.yml` for manual application.
- **Env var naming discrepancy**: Fastfile uses `ANDROID_KEYSTORE_PATH` while Gradle expects `ANDROID_UPLOAD_STORE_FILE`. Already correctly mapped in the existing Fastfile `build` lane — no changes were needed there.

## What I found while implementing
- `.gitignore` already has `*.keystore` and `!debug.keystore` — the generated keystore is protected from accidental commits.
- `ANDROID_KEYSTORE_B64` is the secret name for the base64-encoded keystore, distinct from `ANDROID_KEYSTORE_PATH` (a local file path not suitable as a GitHub secret value).

## Open questions
- **PAT workflow scope**: to merge the ci.yml change, either grant the PAT `workflow` scope or apply the job content from `scripts/ci-build-android-job.yml` manually.
- **Keystore backup**: the generated `.keystore` file should be stored in a password manager or encrypted drive. Losing it means the Play Store listing cannot receive updates.
- **First upload**: Google Play requires the first AAB to be uploaded manually through Play Console before Fastlane can automate subsequent uploads.

## iOS stub status
N/A — Android signing only. iOS code signing deferred pending Apple Developer account.

# Google Play Store — Service Account Setup

> **Human action required.** Steps 1–4 require access to Google Cloud Console and Google Play Console.
> The agent has scaffolded the Fastlane lanes. Only the credential creation steps below need a human.

---

## Prerequisites

- Google Play Developer account ($25 one-time registration)
- A Google account with access to Google Play Console for the Shazzar app
- `bundle` and Fastlane installed (`gem install bundler && bundle install`)

---

## Step 1 — Create or reuse a Google Cloud project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. In the top project picker, click **New Project** (or select an existing project if you already have one for this app)
3. Give it a name (e.g. `shazzar-play`) and click **Create**
4. Note the **Project ID** — you will need it in Step 2

---

## Step 2 — Enable the Google Play Android Developer API

1. In Google Cloud Console, open the left menu → **APIs & Services** → **Library**
2. Search for **Google Play Android Developer API**
3. Click on it and press **Enable**
4. Wait for the API to activate (takes a few seconds)

---

## Step 3 — Create a service account and download the JSON key

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service account**
3. Fill in:
   - **Service account name:** `fastlane-play-store` (or any descriptive name)
   - **Service account ID:** auto-filled from the name
   - **Description:** "Used by Fastlane to upload AABs to Google Play"
4. Click **Create and continue** → skip optional role assignment → click **Done**
5. In the service accounts list, click on the newly created account
6. Go to the **Keys** tab → **Add Key** → **Create new key** → choose **JSON** → **Create**
7. The JSON file downloads automatically — move it somewhere safe:
   ```
   mv ~/Downloads/shazzar-play-store-*.json ~/.secrets/play-store-key.json
   ```
8. **Never commit this file.** It gives full upload access to your Play Store app.

---

## Step 4 — Grant the service account access in Play Console

1. Go to [https://play.google.com/console](https://play.google.com/console)
2. Open the left menu → **Users and permissions** → **Invite new users**
3. Enter the service account email (it looks like `fastlane-play-store@your-project-id.iam.gserviceaccount.com`)
4. Under **App permissions**, select the Shazzar app
5. Grant the following permissions (minimum required for Fastlane upload):
   - **Release** → **Manage production releases**, **Manage testing track releases**
   - Or simply assign the **Release Manager** role if available
6. Click **Invite user** → **Send invite**

> Note: It can take up to 24 hours for permissions to propagate after the invite is accepted.

---

## Step 5 — Configure the environment variable

Add the path to your JSON key in your local shell profile and as a GitHub Actions secret.

### Local (development machine)

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export PLAY_STORE_JSON_KEY_PATH="$HOME/.secrets/play-store-key.json"
```

Then reload:

```bash
source ~/.zshrc
```

### GitHub Actions (CI)

1. In your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PLAY_STORE_JSON_KEY_PATH_B64`
4. Value: base64-encode the JSON key:
   ```bash
   base64 -i ~/.secrets/play-store-key.json | pbcopy  # macOS
   base64 -w 0 ~/.secrets/play-store-key.json          # Linux
   ```
5. In your CI workflow, decode the secret before running Fastlane:
   ```yaml
   - name: Decode Play Store key
     run: |
       echo "${{ secrets.PLAY_STORE_JSON_KEY_PATH_B64 }}" | base64 --decode > /tmp/play-store-key.json
       echo "PLAY_STORE_JSON_KEY_PATH=/tmp/play-store-key.json" >> $GITHUB_ENV
   ```

> **Security:** Keep the raw JSON file out of the repo. The `.gitignore` in this project already excludes `*service-account*.json` and `*play-store*.json` patterns. Do not add exceptions.

---

## Step 6 — Validate your credentials (no upload)

Before running a full ship, confirm the service account can reach the Play API:

```bash
bundle exec fastlane android validate_play_connection
```

This calls `upload_to_play_store(validate_only: true)` — it authenticates and checks permissions without uploading anything. A successful run means you are ready.

---

## Step 7 — Run a full release

```bash
bundle exec fastlane android ship version:"1.0.0"
```

This will:
1. Run Jest tests (`yarn test --passWithNoTests`)
2. Bump `versionCode` and set `versionName` to `1.0.0`
3. Build a signed release AAB (requires keystore env vars — see README Phase 4)
4. Upload the AAB to the **internal** track on Play Store

To promote from internal to another track, use `aab:` and `track:` options on the `deploy` lane directly:

```bash
bundle exec fastlane android deploy aab:"android/app/build/outputs/bundle/release/app-release.aab"
```

---

## Troubleshooting

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `Google Api Error: Invalid grant` | JSON key expired or deleted | Re-download key from Cloud Console |
| `The caller does not have permission` | Service account not invited in Play Console | Repeat Step 4 |
| `Package not found` | App not yet created in Play Console | Upload first build manually through Play Console web UI |
| `401 Unauthorized` | Wrong project — API not enabled | Check Step 2 |
| `PLAY_STORE_JSON_KEY_PATH not set` | Env var missing | Check Step 5 |

> **First upload note:** Google Play requires the very first APK/AAB to be uploaded manually through the Play Console web UI before the API can be used. After that, all subsequent uploads can go through Fastlane.

fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### test

```sh
[bundle exec] fastlane test
```



----


## Android

### android verify

```sh
[bundle exec] fastlane android verify
```

Run tests only — use on PRs before a full build

### android build

```sh
[bundle exec] fastlane android build
```

Build a signed release AAB

### android deploy

```sh
[bundle exec] fastlane android deploy
```

Upload a pre-built AAB to Play Store (internal track)

### android ship

```sh
[bundle exec] fastlane android ship
```

Test, bump, build, and deploy to Play Store (internal track)

### android bump

```sh
[bundle exec] fastlane android bump
```

Bump versionCode and versionName, then commit

----


## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS app (unsigned — simulator only until signing is configured)

### ios deploy

```sh
[bundle exec] fastlane ios deploy
```

Deploy to TestFlight (deferred)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

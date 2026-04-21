import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

// This file is the codegen spec — the single source of truth for the
// Haptics TurboModule interface. Codegen reads this at build time and
// generates C++ glue code (Android) and ObjC protocol (iOS) automatically.
//
// Rules for spec files:
//   - Must use Flow or TypeScript types (no `any`, no complex generics)
//   - Must export a `Spec` interface extending `TurboModule`
//   - Must export default via `TurboModuleRegistry.get/strictGet`
//   - File must be named Native*.ts (codegen convention)

export interface Spec extends TurboModule {
  impact(style: string): void;
  notification(type: string): void;
  selection(): void;
}

// getEnforcing throws if the module is missing at runtime — fail loud, not silent.
export default TurboModuleRegistry.getEnforcing<Spec>('Haptics');

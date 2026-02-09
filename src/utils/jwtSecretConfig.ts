// Shared config related to JWT secret bootstrapping / safety checks.
// Keep this in one place so handlers don't duplicate the sample value.

// IMPORTANT:
// This is a *sample* secret value used in `.dev.vars.example`.
// If the runtime JWT_SECRET equals this value, we treat it as unsafe.
export const DEFAULT_DEV_SECRET = 'Enter-your-JWT-key-here-at-least-32-characters';

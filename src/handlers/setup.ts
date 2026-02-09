import { Env, DEFAULT_DEV_SECRET } from '../types';
import { StorageService } from '../services/storage';
import { jsonResponse, htmlResponse, errorResponse } from '../utils/response';
import { renderJwtSecretWarningPage, JwtSecretState } from './setupPages';
import { handleRegisterPage } from './setupRegisterPage';

function getJwtSecretState(env: Env): JwtSecretState | null {
  const secret = (env.JWT_SECRET || '').trim();
  if (!secret) return 'missing';
  // Block common "forgot to change" sample value (matches .dev.vars.example)
  if (secret === DEFAULT_DEV_SECRET) return 'default';
  if (secret.length < 32) return 'too_short';
  return null;
}

// GET / - Setup page
export async function handleSetupPage(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const disabled = await storage.isSetupDisabled();
  if (disabled) {
    return new Response(null, { status: 404 });
  }

  // Guard: require a strong JWT_SECRET before allowing setup/registration.
  const jwtState = getJwtSecretState(env);
  if (jwtState) {
    return htmlResponse(renderJwtSecretWarningPage(request, jwtState), 200);
  }

  // Serve the registration/setup UI (split into a dedicated module).
  return handleRegisterPage(request, env);
}

// GET /setup/status
export async function handleSetupStatus(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const registered = await storage.isRegistered();
  const disabled = await storage.isSetupDisabled();
  return jsonResponse({ registered, disabled });
}

// POST /setup/disable
export async function handleDisableSetup(request: Request, env: Env): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  const registered = await storage.isRegistered();
  if (!registered) {
    return errorResponse('Registration required', 403);
  }
  await storage.setSetupDisabled();
  return jsonResponse({ success: true });
}

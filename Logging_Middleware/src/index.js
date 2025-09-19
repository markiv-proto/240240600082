const axios = require('axios');

const LOG_API_URL = process.env.LOG_API_URL || 'http://20.244.56.144/evaluation-service/logs';
const LOG_API_TOKEN = process.env.LOG_API_TOKEN || null; // set in backend env (DO NOT put secrets in front-end!)

const ALLOWED_STACKS = ['backend','frontend'];
const ALLOWED_LEVELS = ['debug','info','warn','error','fatal'];

const BACKEND_PACKAGES = ['cache','controller','cron_job','db','domain','handler','repository','route','service'];
const FRONTEND_PACKAGES = ['api','component','hook','page','state','style'];
const COMMON_PACKAGES = ['auth','config','middleware','utils'];

function validateInputs(stack, level, pkg) {
  if (!stack || !level || !pkg) throw new Error('stack, level and package are required');
  const s = String(stack).toLowerCase();
  const l = String(level).toLowerCase();
  const p = String(pkg).toLowerCase();

  if (!ALLOWED_STACKS.includes(s)) throw new Error(`invalid stack: ${s}`);
  if (!ALLOWED_LEVELS.includes(l))  throw new Error(`invalid level: ${l}`);

  const allowedForStack = (s === 'backend')
    ? BACKEND_PACKAGES.concat(COMMON_PACKAGES)
    : FRONTEND_PACKAGES.concat(COMMON_PACKAGES);

  if (!allowedForStack.includes(p)) throw new Error(`invalid package "${p}" for stack "${s}"`);
  return { s, l, p };
}

// low-latency, fire-and-forget helper. Returns Axios response if needed.
async function _postLog(payload) {
  const headers = { 'Content-Type': 'application/json' };
  if (LOG_API_TOKEN) headers['Authorization'] = `Bearer ${LOG_API_TOKEN}`;
  try {
    const res = await axios.post(LOG_API_URL, payload, { headers, timeout: 5000 });
    return res.data;
  } catch (err) {
    // Fail silently but log to local console for troubleshooting
    // Do not throw — logging should not crash app
    console.error('[loggingmiddleware] failed to send log:', err.message || err);
    return null;
  }
}

/**
 * Public function matching required shape:
 * Log(stack, level, package, message)
 * - stack: 'backend'|'frontend'
 * - level: 'debug'|'info'|'warn'|'error'|'fatal'
 * - package: allowed package name (see lists)
 * - message: string or object (if object it will be JSON-stringified)
 */
function Log(stack, level, packageName, message) {
  try {
    const { s, l, p } = validateInputs(stack, level, packageName);
    const msg = (typeof message === 'object') ? JSON.stringify(message) : String(message);
    const payload = { stack: s, level: l, package: p, message: msg };
    // Fire-and-forget to avoid blocking main thread. Call returns immediately.
    _postLog(payload).catch(() => {});
  } catch (err) {
    // If validation fails, print locally but don't throw.
    console.error('[loggingmiddleware] validation error:', err.message);
  }
}

// Export for CommonJS and also attach to module.exports.Log
module.exports = { Log };
module.exports.default = { Log }; // helpful if using bundlers / ESM

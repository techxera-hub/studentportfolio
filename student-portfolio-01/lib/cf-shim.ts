// Complete Shim for cloudflare:workers for Vercel, Node.js, and build environments
export const env: Record<string, unknown> = (typeof process !== 'undefined' ? process.env : {}) || {};
export class WorkerEntrypoint {}
export class DurableObject {}
export class WorkflowEntrypoint {}
export class RpcTarget {}

const cfShim = { env, WorkerEntrypoint, DurableObject, WorkflowEntrypoint, RpcTarget };
export default cfShim;

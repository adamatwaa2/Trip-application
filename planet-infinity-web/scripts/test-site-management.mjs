import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
const modules = new Map();
const calls = [];
let authorized = true;
let writes = 0;
const stubs = {
  './requests': { submitPublicRequest: async input => { calls.push(input); return { ok: true, requestNumber: 'TEST-ONLY' }; } },
  '@/lib/admin': { requireAdmin: async () => { if (!authorized) throw Error('unauthorized'); } },
  '@/lib/supabase/server': { createClient: async () => ({ from: () => ({ upsert: async () => { writes++; return { error: null }; } }) }) },
  'next/cache': { revalidatePath() {} },
};
function load(relative) {
  const filename = path.resolve(root, relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} }; modules.set(filename, module);
  const source = readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const localRequire = name => {
    if (stubs[name]) return stubs[name];
    const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
    return load(`${target}.ts`);
  };
  vm.runInThisContext(`(function(require,module,exports,process){${outputText}\n})`, { filename })(localRequire, module, module.exports, process);
  return module.exports;
}
const { PRESENTATION_DEFAULTS: defaults, validatePresentation, safePublicLink } = load('content/site-presentation.ts');
assert.equal(validatePresentation(defaults), true);
for (const url of ['javascript:alert(1)', 'data:image/svg+xml,test', '//evil.example', '/\\evil.example', 'https://u:p@example.com/test']) assert.equal(safePublicLink(url), false, url);
for (const url of ['/requests/event', 'https://www.instagram.com/planetinfinity.ent/']) assert.equal(safePublicLink(url), true);
assert.equal(validatePresentation({ ...defaults, seoTitle: '' }), false);
assert.equal(validatePresentation({ ...defaults, columns: [{ title: 'bad', items: [{ label: 'bad', href: 'javascript:alert(1)', soon: false, visible: true }] }] }), false);
assert.equal(validatePresentation({ ...defaults, pageSeo: [...defaults.pageSeo, defaults.pageSeo[0]] }), false);
assert.equal(validatePresentation({ ...defaults, headerLogo: 'https://example.com/logo.svg' }), false);
const { validatePlanning } = load('content/planning-requests.ts');
const { REQUEST_CATEGORIES } = load('content/planning-requests.ts');
const valid = { kind: 'individual', fullName: 'Test Only', email: 'test@example.invalid', phone: '01000000000', organisationType: '', organisationName: '', destination: 'Trip idea', preferredDate: '', flexible: true, guestCount: 1, budget: '', services: [], notes: '', consent: true, website: '' };
assert.equal(validatePlanning(valid), null);
for (const change of [{ kind: 'invalid' }, { consent: false }, { guestCount: 0 }, { guestCount: 1.5 }, { guestCount: 10001 }, { email: 'bad' }, { phone: '' }, { destination: '' }, { website: 'spam' }, { services: ['unrecognized'] }, { preferredDate: '2026-99-99' }, { preferredDate: '2026-02-30' }, { kind: 'organisation' }]) assert.notEqual(validatePlanning({ ...valid, ...change }), null);
const { submitPlanningRequest } = load('app/actions/planning-requests.ts');
for (const kind of ['individual', 'organisation', 'event']) {
  const input = { ...valid, kind, organisationType: 'University', organisationName: 'Test Institution' };
  assert.equal((await submitPlanningRequest(input)).ok, true);
  const payload = calls.at(-1);
  assert.equal(payload.requestType, kind === 'event' ? 'event' : 'trip');
  assert.equal(payload.subjectSlug, `planning-${kind}`);
  assert.equal(payload.selections.planningKind, kind);
  assert.equal(payload.productId, undefined);
  assert.equal(payload.whatsappOptIn, false);
}
assert.equal((await submitPlanningRequest({ ...valid, consent: false })).ok, false);
assert.equal(calls.length, 3);
for (const category of REQUEST_CATEGORIES) {
  const organisationType = ['prom','senior'].includes(category.id) ? 'School' : category.organisationType;
  const input = { ...valid, kind: category.kind, category: category.id, organisationType, organisationName: organisationType ? 'Test Institution' : '' };
  assert.equal(validatePlanning(input), null, category.id);
  assert.equal((await submitPlanningRequest(input)).ok, true);
  assert.equal(calls.at(-1).subjectTitle, category.label);
  assert.equal(calls.at(-1).selections.requestCategory, category.id);
  assert.equal(calls.at(-1).selections.organisationType, organisationType);
}
assert.notEqual(validatePlanning({ ...valid, category: 'school' }), null);
assert.notEqual(validatePlanning({ ...valid, kind: 'event', category: 'company-event', organisationType: 'Company', organisationName: '' }), null);
assert.notEqual(validatePlanning({ ...valid, kind: 'event', category: 'prom' }), null);
const prom = { ...valid, kind: 'event', category: 'prom', organisationType: 'School', organisationName: 'Test School', services: ['Decoration & theme', 'DJs', 'Sound & lighting'] };
assert.equal(validatePlanning(prom), null);
await submitPlanningRequest(prom);
assert.deepEqual(calls.at(-1).selections.services, prom.services);
assert.notEqual(validatePlanning({ ...valid, services: ['DJs'] }), null);
assert.equal(REQUEST_CATEGORIES.filter(item => item.world === 'trips')[0].id, 'senior');
assert.equal(REQUEST_CATEGORIES.filter(item => item.world === 'events')[0].id, 'prom');
const plan = defaults.columns.find(column => column.title === 'Plan');
assert.equal(plan.items.filter(item => item.href.startsWith('/requests')).length, 1);
assert.equal(plan.items.find(item => item.href === '/requests').label, 'Trip and Event Requests');
const { saveSitePresentation } = load('app/actions/site-presentation.ts');
authorized = false;
await assert.rejects(saveSitePresentation(defaults), /unauthorized/);
assert.equal(writes, 0);
authorized = true;
assert.equal((await saveSitePresentation({ ...defaults, instagram: 'javascript:alert(1)' })).ok, false);
assert.equal(writes, 0);
assert.equal((await saveSitePresentation(defaults)).ok, true);
assert.equal(writes, 1);
const env = load('lib/supabase/env.ts');
const oldPreview = process.env.PI_LOCAL_PREVIEW;
process.env.PI_LOCAL_PREVIEW = '1';
assert.equal(env.isSupabaseConfigured(), false);
assert.throws(() => env.getSupabaseEnvironment(), /disabled/);
if (oldPreview === undefined) delete process.env.PI_LOCAL_PREVIEW; else process.env.PI_LOCAL_PREVIEW = oldPreview;
console.log('PASS: request validation, all three server payloads, no booking side effects, CMS URL/SEO validation, admin authorization and isolated preview data guard. All writes mocked; no remote database used.');

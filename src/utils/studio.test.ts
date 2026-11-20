import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStudioSystemInstruction,
  extractGroundingSources,
  parseGroundingSourcesJson,
  resolveChatModel,
  resolveRolePresetId,
  validateStudioChatInput,
  validateStudioSearchInput,
  validateThreadCreateInput,
} from './studio';
import { serializeCatalogForAssistant } from './assistant';
import { LAUNCH_PRODUCTS, LAUNCH_SITE_SETTINGS } from '../data/launchCatalog';

test('resolveChatModel only permits supported free-tier chat models', () => {
  assert.equal(resolveChatModel('gemini-4-hydrogen'), 'gemini-4-hydrogen');
  assert.equal(resolveChatModel('gemini-3.1-flash-lite'), 'gemini-3.1-flash-lite');
  assert.equal(resolveChatModel('gemini-4-carbon'), 'gemini-4-hydrogen');
  assert.equal(resolveChatModel('unknown-model'), 'gemini-4-hydrogen');
});

test('resolveRolePresetId normalizes invalid presets to advisor', () => {
  assert.equal(resolveRolePresetId('researcher'), 'researcher');
  assert.equal(resolveRolePresetId('fast_helper'), 'fast_helper');
  assert.equal(resolveRolePresetId('custom'), 'custom');
  assert.equal(resolveRolePresetId('hacker'), 'advisor');
});

test('validateStudioChatInput checks message bounds, history, and search grounding model compatibility', () => {
  assert.equal(validateStudioChatInput(null).ok, false);
  assert.equal(validateStudioChatInput({ message: '   ' }).ok, false);

  const valid = validateStudioChatInput({
    message: '  Compare Energy Boost and SUNDEX-D  ',
    model: 'gemini-4-hydrogen',
    rolePreset: 'researcher',
    useSearchGrounding: true,
    history: [
      { role: 'user', text: 'Hello' },
      { role: 'model', text: 'Hi! Ask me anything.' },
    ],
  });

  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.model, 'gemini-4-hydrogen');
    assert.equal(valid.data.useSearchGrounding, true);
    assert.equal(valid.data.history.length, 2);
  }

  // Search grounding disables cleanly when paired with flash-lite
  const flashWithSearch = validateStudioChatInput({
    message: 'Quick question',
    model: 'gemini-3.1-flash-lite',
    useSearchGrounding: true,
  });
  assert.equal(flashWithSearch.ok, true);
  if (flashWithSearch.ok) {
    assert.equal(flashWithSearch.data.useSearchGrounding, false);
  }
});

test('extractGroundingSources deduplicates and filters unsafe URIs', () => {
  const chunks = [
    { web: { uri: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/', title: 'NIH Vitamin D' } },
    { web: { uri: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/', title: 'Duplicate' } },
    { web: { uri: 'javascript:alert(1)', title: 'Malicious' } },
    { web: { uri: 'http://example.org/nutrition', title: '' } },
  ];
  const sources = extractGroundingSources(chunks);
  assert.equal(sources.length, 2);
  assert.equal(sources[0].title, 'NIH Vitamin D');
  assert.equal(sources[1].title, 'example.org');
});

test('parseGroundingSourcesJson safely parses stored JSON links', () => {
  const parsed = parseGroundingSourcesJson(
    JSON.stringify([
      { title: 'WHO Nutrition', uri: 'https://www.who.int/health-topics/nutrition' },
      { title: 'Bad Link', uri: 'data:text/html,hi' },
    ])
  );
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, 'WHO Nutrition');
  assert.deepEqual(parseGroundingSourcesJson('not-json'), []);
});

test('buildStudioSystemInstruction incorporates catalog facts and active role directive', () => {
  const { products, site } = serializeCatalogForAssistant(LAUNCH_PRODUCTS, LAUNCH_SITE_SETTINGS);
  const prompt = buildStudioSystemInstruction({
    rolePreset: 'custom',
    customInstruction: 'Explain everything in simple bullet points for busy parents.',
    products,
    site,
  });

  assert.ok(prompt.includes('BrainAxis Energy Boost'));
  assert.ok(prompt.includes('SUNDEX-D'));
  assert.ok(prompt.includes('Explain everything in simple bullet points for busy parents.'));
});

test('validateThreadCreateInput and validateStudioSearchInput validate cleanly', () => {
  const thread = validateThreadCreateInput({ rolePreset: 'fast_helper' });
  assert.equal(thread.ok, true);
  if (thread.ok) {
    assert.equal(thread.data.model, 'gemini-3.1-flash-lite');
    assert.ok(thread.data.title.length > 0);
  }

  assert.equal(validateStudioSearchInput({ query: '' }).ok, false);
  assert.equal(validateStudioSearchInput({ query: 'Vitamin D3 daily limit' }).ok, true);
});

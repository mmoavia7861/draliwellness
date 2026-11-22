import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssistantSystemInstruction,
  extractReadableErrorMessage,
  serializeCatalogForAssistant,
  validateAssistantInput,
} from './assistant';
import { LAUNCH_PRODUCTS, LAUNCH_SITE_SETTINGS } from '../data/launchCatalog';

test('validateAssistantInput rejects empty or oversized messages', () => {
  assert.equal(validateAssistantInput(null).ok, false);
  assert.equal(validateAssistantInput({ message: '   ' }).ok, false);
  assert.equal(validateAssistantInput({ message: 'a'.repeat(801) }).ok, false);
});

test('validateAssistantInput sanitizes history and product context cleanly', () => {
  const { products, site } = serializeCatalogForAssistant(LAUNCH_PRODUCTS, LAUNCH_SITE_SETTINGS);
  const result = validateAssistantInput({
    message: '  How do I take SUNDEX-D?  ',
    history: [
      { role: 'user', text: 'Hi' },
      { role: 'invalid', text: 'Ignored' },
      { role: 'model', text: 'Hello! How can I help?' },
    ],
    products,
    site,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.message, 'How do I take SUNDEX-D?');
    assert.equal(result.data.history.length, 2);
    assert.equal(result.data.history[1].role, 'model');
    assert.equal(result.data.products.length, 2);
    assert.equal(result.data.site?.freeShippingThresholdPkr, 2000);
  }
});

test('buildAssistantSystemInstruction grounds prompt in BrainAxis catalog and safety rules', () => {
  const { products, site } = serializeCatalogForAssistant(LAUNCH_PRODUCTS, LAUNCH_SITE_SETTINGS);
  const instruction = buildAssistantSystemInstruction(products, site);

  assert.ok(instruction.includes('BrainAxis Energy Boost'));
  assert.ok(instruction.includes(`Rs. ${LAUNCH_PRODUCTS[0].pricePkr.toLocaleString('en-PK')}`));
  assert.ok(instruction.includes('SUNDEX-D'));
  assert.ok(instruction.includes('200,000 IU'));
  assert.ok(instruction.includes('Rs. 799'));
  assert.ok(instruction.includes('registered healthcare professional'));
  assert.ok(instruction.includes('Free shipping on orders of Rs. 2000'));
});

test('extractReadableErrorMessage unwraps nested JSON API error payloads cleanly', () => {
  const raw = JSON.stringify({
    error: {
      code: 503,
      message: 'This model is currently experiencing high demand.',
      status: 'UNAVAILABLE',
    },
  });
  assert.equal(
    extractReadableErrorMessage(new Error(raw)),
    'This model is currently experiencing high demand.'
  );
  assert.equal(extractReadableErrorMessage('Plain network timeout'), 'Plain network timeout');
});

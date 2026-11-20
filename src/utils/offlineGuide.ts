import type { AssistantProductBrief, AssistantSiteBrief } from './assistant';

/**
 * Non-AI fallback for static hosting and free-tier quota exhaustion.
 * The answer is always labelled as offline. This does not diagnose or
 * prescribe and uses only public product/shop fields already on the page.
 */
export function getOfflineGuideAnswer(
  question: string,
  products: AssistantProductBrief[],
  site?: AssistantSiteBrief
): string {
  const q = question.toLowerCase().trim();
  const intro = 'Offline product information (not an AI-generated answer):\n';
  const energy = products.find((p) => /energy boost/i.test(p.name));
  const sundex = products.find((p) => /sundex|cholecalciferol/i.test(p.name));
  const vitaminD = /sundex|200,?000|vitamin\s*d|d3|ڈی/i.test(q);
  const dose = /dose|dosage|how.*take|how.*use|when.*take|roz|kitn|len[aie]|ist[eia]mal|daily|frequency|khana|dawa|خوراک/i.test(q);
  const highDoseSafety =
    'SUNDEX-D contains high-dose Vitamin D3 (200,000 IU). Use it only as instructed by a registered healthcare professional; do not take it every day or repeat a dose without medical direction.';

  if (vitaminD && (dose || /safe|harm|side.effect|warning|caution/i.test(q))) {
    return intro + highDoseSafety + (sundex?.warnings ? ` Packaging caution: ${sundex.warnings}` : '');
  }

  if (/compare|difference|versus|\bvs\b|farq|dono/i.test(q)) {
    return (
      intro +
      `Energy Boost: ${energy?.packSize || '30 tablets'}, daily multivitamin/mineral formula. ` +
      `SUNDEX-D: ${sundex?.strength || '200,000 IU'} high-dose Vitamin D3 softgel. ` +
      highDoseSafety
    );
  }

  if (/deliver|shipping|courier|cod|cash|order|charge|fee|pais|payment|ship|bhej/i.test(q)) {
    if (!site) return intro + 'Cash on Delivery and order-related information is available on the website checkout and shipping policy pages.';
    const delivery = site.shippingFeePkr >= 0 ? `Standard shipping: Rs. ${site.shippingFeePkr}. ` : '';
    const threshold = site.freeShippingThresholdPkr > 0 ? `Free delivery threshold: Rs. ${site.freeShippingThresholdPkr}. ` : '';
    return intro + delivery + threshold + (site.codEnabled ? 'Cash on Delivery is offered where available. ' : '') + 'Confirm the final delivery charge at checkout.';
  }

  if (/price|cost|rate|mrp|kitne|kitna|rs\.?|pkr/i.test(q)) {
    if (!products.length) return intro + 'Please check the current product listing for confirmed prices.';
    return intro + products.map((p) => `${p.name}: Rs. ${p.pricePkr.toLocaleString('en-PK')}`).join('; ') + '. Confirm current prices at checkout.';
  }

  if (/energy|boost|multivitamin|tablet|stamina|focus|memory/i.test(q)) {
    return (
      intro +
      `${energy?.name || 'BrainAxis Energy Boost'} is a multivitamin and mineral supplement presented as ${energy?.packSize || '30 tablets'}. ` +
      (energy?.directions ? `Label directions: ${energy.directions} ` : '') +
      'Check the complete product label and ask a healthcare professional about individual suitability.'
    );
  }

  if (vitaminD) {
    return intro + highDoseSafety;
  }

  return (
    intro +
    'I can help with the two BrainAxis product labels, prices, and delivery details. ' +
    'For personal symptoms, treatment, lab results, medicines, or doses, consult a registered healthcare professional. ' +
    'Live AI responses require a configured secure backend.'
  );
}

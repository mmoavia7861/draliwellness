import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type {
  Category,
  ComplianceStatus,
  FaqItem,
  Product,
  ProductVariant,
  SupplementFactRow,
} from '../../types';

interface AdminProductEditorProps {
  initialProduct?: Product | null;
  categories: Category[];
  onSave: (product: Product, isNew: boolean) => Promise<void>;
  onClose: () => void;
}

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  initialProduct,
  categories,
  onSave,
  onClose,
}) => {
  const isNew = !initialProduct;

  const [id, setId] = useState(initialProduct?.id || `prod-${Date.now()}`);
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [name, setName] = useState(initialProduct?.name || '');
  const [subtitle, setSubtitle] = useState(initialProduct?.subtitle || '');
  const [brand, setBrand] = useState(initialProduct?.brand || 'BrainAxis');
  const [founderMention, setFounderMention] = useState(initialProduct?.founderMention || 'Dr. Ali');
  const [categoryIds, setCategoryIds] = useState<string[]>(initialProduct?.categoryIds ?? []);
  const [pricePkr, setPricePkr] = useState(String(initialProduct?.pricePkr ?? 0));
  const [compareAtPricePkr, setCompareAtPricePkr] = useState(
    String(initialProduct?.compareAtPricePkr ?? 0)
  );
  const [stock, setStock] = useState(String(initialProduct?.stock ?? 0));
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [format, setFormat] = useState(initialProduct?.format || '');
  const [packSize, setPackSize] = useState(initialProduct?.packSize || '');
  const [strength, setStrength] = useState(initialProduct?.strength || '');
  const [usageSummary, setUsageSummary] = useState(initialProduct?.usageSummary || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [galleryUrlsText, setGalleryUrlsText] = useState(
    (initialProduct?.galleryUrls ?? []).join('\n')
  );
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || '');
  const [overview, setOverview] = useState(initialProduct?.overview || '');
  const [benefitsText, setBenefitsText] = useState((initialProduct?.benefits ?? []).join('\n'));
  const [ingredientsSummary, setIngredientsSummary] = useState(
    initialProduct?.ingredientsSummary || ''
  );
  const [supplementFacts, setSupplementFacts] = useState<SupplementFactRow[]>(
    initialProduct?.supplementFacts ?? []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants ?? []);
  const [faqs, setFaqs] = useState<FaqItem[]>(initialProduct?.faqs ?? []);
  const [otherIngredients, setOtherIngredients] = useState(initialProduct?.otherIngredients || '');
  const [directions, setDirections] = useState(initialProduct?.directions || '');
  const [warnings, setWarnings] = useState(initialProduct?.warnings || '');
  const [storageInstructions, setStorageInstructions] = useState(
    initialProduct?.storageInstructions || ''
  );
  const [allergens, setAllergens] = useState(initialProduct?.allergens || '');
  const [interactions, setInteractions] = useState(initialProduct?.interactions || '');
  const [manufacturer, setManufacturer] = useState(initialProduct?.manufacturer || '');
  const [countryOfOrigin, setCountryOfOrigin] = useState(
    initialProduct?.countryOfOrigin || 'Pakistan'
  );
  const [batchNo, setBatchNo] = useState(initialProduct?.batchNo || '');
  const [mfgDate, setMfgDate] = useState(initialProduct?.mfgDate || '');
  const [expDate, setExpDate] = useState(initialProduct?.expDate || '');
  const [enlistmentNo, setEnlistmentNo] = useState(initialProduct?.enlistmentNo || '');
  const [form7No, setForm7No] = useState(initialProduct?.form7No || '');
  const [certificationsText, setCertificationsText] = useState(
    (initialProduct?.certifications ?? []).join(', ')
  );
  const [featured, setFeatured] = useState(initialProduct?.featured ?? true);
  const [published, setPublished] = useState(initialProduct?.published ?? false);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>(
    initialProduct?.complianceStatus ?? 'draft'
  );
  const [sortOrder, setSortOrder] = useState(String(initialProduct?.sortOrder ?? 10));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // For the single-pack launch products, the sellable variant must follow the
  // base price. Multi-variant products retain individually configured prices.
  const handleBasePriceChange = (raw: string) => {
    setPricePkr(raw);
    const amount = Number(raw);
    if (raw !== '' && Number.isFinite(amount) && amount >= 0 && variants.length === 1) {
      setVariants((current) =>
        current.map((variant) => ({ ...variant, pricePkr: amount }))
      );
    }
  };

  const handleToggleCat = (catId: string) => {
    setCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400_000) {
      setError('Uploaded image must be under 400KB or use a hosted/static image URL.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length <= 600) {
        setImageUrl(reader.result);
      } else {
        setError('For Firestore storage, paste an image URL path under 600 characters.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    const resolvedSlug =
      slug.trim() ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    setSaving(true);
    try {
      await onSave(
        {
          id: id.trim() || resolvedSlug,
          slug: resolvedSlug,
          name: name.trim(),
          subtitle: subtitle.trim(),
          brand: brand.trim() || 'BrainAxis',
          founderMention: founderMention.trim(),
          categoryIds,
          pricePkr: Number(pricePkr) || 0,
          compareAtPricePkr: Number(compareAtPricePkr) || 0,
          stock: Number(stock) || 0,
          sku: sku.trim(),
          format: format.trim(),
          packSize: packSize.trim(),
          strength: strength.trim(),
          usageSummary: usageSummary.trim(),
          imageUrl: imageUrl.trim(),
          galleryUrls: (() => {
            const parsed = galleryUrlsText
              .split('\n')
              .map((u) => u.trim())
              .filter(Boolean);
            if (imageUrl.trim() && !parsed.includes(imageUrl.trim())) {
              return [imageUrl.trim(), ...parsed].slice(0, 8);
            }
            return parsed.slice(0, 8);
          })(),
          shortDescription: shortDescription.trim(),
          overview: overview.trim(),
          benefits: benefitsText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          ingredientsSummary: ingredientsSummary.trim(),
          supplementFacts: supplementFacts.filter((r) => r.nutrient.trim()),
          otherIngredients: otherIngredients.trim(),
          directions: directions.trim(),
          warnings: warnings.trim(),
          storageInstructions: storageInstructions.trim(),
          allergens: allergens.trim(),
          interactions: interactions.trim(),
          manufacturer: manufacturer.trim(),
          countryOfOrigin: countryOfOrigin.trim(),
          batchNo: batchNo.trim(),
          mfgDate: mfgDate.trim(),
          expDate: expDate.trim(),
          enlistmentNo: enlistmentNo.trim(),
          form7No: form7No.trim(),
          certifications: certificationsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          faqs: faqs
            .filter((f) => f.question.trim() && f.answer.trim())
            .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
            .slice(0, 10),
          variants: variants
            .filter((v) => v.label.trim())
            .map((v, idx) => ({
              id: v.id.trim() || `var-${idx + 1}`,
              label: v.label.trim(),
              sku: v.sku.trim(),
              pricePkr: Math.max(0, Number(v.pricePkr) || 0),
              stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
            }))
            .slice(0, 12),
          featured,
          published,
          complianceStatus,
          sortOrder: Number(sortOrder) || 0,
        },
        isNew
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? 'Add New Product' : `Edit ${initialProduct?.name}`}
    >
      <div className="bg-[#FAF8F2] border border-[#174D40]/15 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#174D40]/12 pb-4">
          <h2 className="font-serif text-2xl font-semibold text-[#174D40]">
            {isNew ? 'Add New Supplement Product' : `Edit: ${initialProduct?.name}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product editor"
            className="p-2 rounded-lg hover:bg-[#E8F1EB] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Basic Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">URL Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-name"
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <p className="text-xs text-[#174D40]/80">
            For a product with one pack variant, changing the selling price also updates
            that variant. Products with multiple pack sizes have separate prices below.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Price / MRP (PKR) *</label>
              <input
                type="number"
                min={0}
                required
                value={pricePkr}
                onChange={(e) => handleBasePriceChange(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Compare-At Price</label>
              <input
                type="number"
                min={0}
                value={compareAtPricePkr}
                onChange={(e) => setCompareAtPricePkr(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Stock Quantity *</label>
              <input
                type="number"
                min={0}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
          </div>

          {/* Presentation & Image */}
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Format (Tablets / Softgel)</label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Pack Size</label>
              <input
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Strength</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Usage Summary</label>
              <input
                type="text"
                value={usageSummary}
                onChange={(e) => setUsageSummary(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Primary Product Image URL / Path</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/assets/aistudio/... or https://..."
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Upload Image File (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="w-full text-xs pt-1.5"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold">
                Additional Gallery Image URLs (one per line, max 8)
              </label>
              <textarea
                rows={2}
                value={galleryUrlsText}
                onChange={(e) => setGalleryUrlsText(e.target.value)}
                placeholder="/assets/aistudio/bottle-front.jpg&#10;/assets/aistudio/bottle-label.jpg"
                className="w-full p-2.5 rounded-lg border border-[#174D40]/20 bg-white text-xs"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-xs font-semibold block">Assigned Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#174D40]/20 bg-white text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(cat.id)}
                    onChange={() => handleToggleCat(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descriptions & Benefits */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Short Description</label>
              <textarea
                rows={3}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Key Benefits (one per line)</label>
              <textarea
                rows={3}
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Full Overview</label>
            <textarea
              rows={3}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
            />
          </div>

          {/* Supplement Facts Rows */}
          <div className="space-y-2 bg-white border border-[#174D40]/15 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Supplement Facts Table</label>
              <button
                type="button"
                onClick={() =>
                  setSupplementFacts([...supplementFacts, { nutrient: '', amount: '' }])
                }
                className="text-xs font-semibold text-[#174D40] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            {supplementFacts.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nutrient / Ingredient"
                  value={row.nutrient}
                  onChange={(e) => {
                    const next = [...supplementFacts];
                    next[idx] = { ...row, nutrient: e.target.value };
                    setSupplementFacts(next);
                  }}
                  className="flex-1 h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                />
                <input
                  type="text"
                  placeholder="Amount (e.g. 200,000 IU)"
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...supplementFacts];
                    next[idx] = { ...row, amount: e.target.value };
                    setSupplementFacts(next);
                  }}
                  className="w-40 h-9 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSupplementFacts(supplementFacts.filter((_, i) => i !== idx))
                  }
                  aria-label="Remove row"
                  className="p-1.5 text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pack Size Variants */}
          <div className="space-y-2 bg-white border border-[#174D40]/15 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Pack Size Variants (Optional)</label>
              <button
                type="button"
                onClick={() =>
                  setVariants([
                    ...variants,
                    {
                      id: `var-${Date.now()}-${variants.length + 1}`,
                      label: '',
                      sku: '',
                      pricePkr: Number(pricePkr) || 0,
                      stock: Number(stock) || 0,
                    },
                  ])
                }
                className="text-xs font-semibold text-[#174D40] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </button>
            </div>
            {variants.length === 0 ? (
              <p className="text-xs text-[#252B29]/60">
                No variants added. Single base pack size &amp; price will be used.
              </p>
            ) : (
              variants.map((v, idx) => (
                <div key={v.id || idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Label (e.g. 60 Tablets)"
                    value={v.label}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, label: e.target.value };
                      setVariants(next);
                    }}
                    className="col-span-4 h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                  />
                  <input
                    type="text"
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, sku: e.target.value };
                      setVariants(next);
                    }}
                    className="col-span-3 h-9 px-2.5 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Price PKR"
                    value={v.pricePkr}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, pricePkr: Number(e.target.value) || 0 };
                      setVariants(next);
                    }}
                    className="col-span-2 h-9 px-2 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs tabular-nums"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Stock"
                    value={v.stock}
                    onChange={(e) => {
                      const next = [...variants];
                      next[idx] = { ...v, stock: Number(e.target.value) || 0 };
                      setVariants(next);
                    }}
                    className="col-span-2 h-9 px-2 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                    aria-label="Remove variant"
                    className="col-span-1 p-1.5 text-red-700 cursor-pointer flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Product FAQs */}
          <div className="space-y-2 bg-white border border-[#174D40]/15 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Product FAQs (max 10)</label>
              <button
                type="button"
                onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                className="text-xs font-semibold text-[#174D40] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
            {faqs.length === 0 ? (
              <p className="text-xs text-[#252B29]/60">No product-specific FAQs added yet.</p>
            ) : (
              faqs.map((faq, idx) => (
                <div key={idx} className="space-y-1.5 p-2.5 rounded-lg bg-[#FAF8F2] border border-[#174D40]/10">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Question"
                      value={faq.question}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[idx] = { ...faq, question: e.target.value };
                        setFaqs(next);
                      }}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#174D40]/20 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                      aria-label="Remove product FAQ"
                      className="p-1.5 text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[idx] = { ...faq, answer: e.target.value };
                      setFaqs(next);
                    }}
                    className="w-full p-2.5 rounded-lg border border-[#174D40]/20 bg-white text-xs"
                  />
                </div>
              ))
            )}
          </div>

          {/* Dosage, Safety, Batch */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Ingredients Summary</label>
              <textarea
                rows={2}
                value={ingredientsSummary}
                onChange={(e) => setIngredientsSummary(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Other Ingredients</label>
              <textarea
                rows={2}
                value={otherIngredients}
                onChange={(e) => setOtherIngredients(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Dosage &amp; Directions</label>
              <textarea
                rows={3}
                value={directions}
                onChange={(e) => setDirections(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Warnings &amp; Caution</label>
              <textarea
                rows={3}
                value={warnings}
                onChange={(e) => setWarnings(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Storage Instructions</label>
              <input
                type="text"
                value={storageInstructions}
                onChange={(e) => setStorageInstructions(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Allergens / Interactions</label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Country of Origin</label>
              <input
                type="text"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Batch No.</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Mfg. Date</label>
              <input
                type="text"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Exp. Date</label>
              <input
                type="text"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Enlistment No.</label>
              <input
                type="text"
                value={enlistmentNo}
                onChange={(e) => setEnlistmentNo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Form 7 No.</label>
              <input
                type="text"
                value={form7No}
                onChange={(e) => setForm7No(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Certifications (comma-separated)</label>
              <input
                type="text"
                value={certificationsText}
                onChange={(e) => setCertificationsText(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-white"
              />
            </div>
          </div>

          {/* Publication & Compliance Controls */}
          <div className="bg-white border border-[#174D40]/15 rounded-xl p-4 grid sm:grid-cols-4 gap-4 items-center">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Compliance Status</label>
              <select
                value={complianceStatus}
                onChange={(e) => setComplianceStatus(e.target.value as ComplianceStatus)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs"
              >
                <option value="draft">Draft</option>
                <option value="awaiting_docs">Awaiting Documentation</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved for Publication</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#174D40]/20 bg-[#FAF8F2] text-xs tabular-nums"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              <span>Published on Storefront</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>Featured on Homepage</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-lg border border-[#174D40]/20 text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-lg bg-[#174D40] text-white text-sm font-semibold hover:bg-[#113A30] disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

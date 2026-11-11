import { useRef, useState, type ChangeEvent } from 'react';
import { X, Loader2, FileText, ImageIcon, AlertTriangle, Check } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { parseReceipt, type ReceiptItem } from '../../lib/gemini';

interface Props {
  existingItems: any[];
  onClose: () => void;
}

const norm = (s?: string) => (s || '').toLowerCase().trim();

/** Returns the closet item that looks like a duplicate of `item`, if any. */
function findSimilar(item: ReceiptItem, closet: any[]) {
  return closet.find((c) => {
    const sameCategory = norm(c.category) === norm(item.category);
    const sameBrand =
      norm(item.brand) !== 'unknown brand' && norm(c.brand) === norm(item.brand);
    const sameColor =
      norm(item.color) === 'unknown' || norm(c.color) === norm(item.color);
    const sameName = norm(c.name) === norm(item.name);
    return sameName || (sameCategory && sameBrand && sameColor);
  });
}

export function ReceiptImport({ existingItems, onClose }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptItem[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleParse = async () => {
    setError(null);
    setIsParsing(true);
    try {
      const result = await parseReceipt({ text, file: file ?? undefined });
      if (result.length === 0) {
        setError("We couldn't find any clothing items in that receipt.");
        setItems(null);
      } else {
        setItems(result);
        // Pre-select everything that is not already in the closet
        setSelected(
          new Set(result.map((r, i) => (findSimilar(r, existingItems) ? -1 : i)).filter((i) => i >= 0)),
        );
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Could not read that receipt. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const handleSave = async () => {
    if (!items) return;
    setIsSaving(true);
    try {
      await Promise.all(
        items
          .filter((_, i) => selected.has(i))
          .map((item) =>
            addDoc(collection(db, 'closet_items'), {
              name: item.name,
              brand: item.brand,
              category: item.category,
              type: item.type,
              color: item.color,
              material: item.material,
              emoji: item.emoji,
              purchaseDate: item.purchaseDate || '',
              price: item.price || '',
              retailer: item.retailer || '',
              source: 'receipt',
              wears: 0,
              createdAt: Date.now(),
            }),
          ),
      );
      onClose();
    } catch (e) {
      console.error(e);
      setError('Failed to save items. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canParse = (text.trim().length > 0 || file) && !isParsing;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Import from receipt</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-100">
            <X className="size-5" />
          </button>
        </div>

        {!items && (
          <>
            <p className="text-xs text-gray-500">
              Paste an order confirmation or receipt email, or upload a screenshot of it. We&apos;ll
              add the clothing items to your closet.
            </p>

            <div className="relative">
              <FileText className="absolute left-3 top-3 size-4 text-gray-400" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste email text here..."
                rows={6}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="text-center text-[10px] font-bold uppercase text-gray-400">or</div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-600 hover:bg-gray-50"
            >
              <ImageIcon className="size-4" />
              {file ? file.name : 'Upload a screenshot'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              onClick={handleParse}
              disabled={!canParse}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Reading receipt...
                </>
              ) : (
                'Find items'
              )}
            </button>
          </>
        )}

        {items && (
          <>
            <p className="text-xs text-gray-500">
              Found {items.length} item{items.length === 1 ? '' : 's'}. Choose what to add.
            </p>
            <div className="space-y-2">
              {items.map((item, i) => {
                const dup = findSimilar(item, existingItems);
                const isSel = selected.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(i)}
                    className={`w-full text-left rounded-xl border p-3 flex gap-3 items-start transition-colors ${
                      isSel ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{item.name}</span>
                      <span className="block text-[11px] text-gray-500 capitalize">
                        {item.brand} • {item.color}
                        {item.purchaseDate && ` • bought ${item.purchaseDate}`}
                        {item.price && ` • ${item.price}`}
                      </span>
                      {dup && (
                        <span className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
                          <AlertTriangle className="size-3" />
                          You already own something similar: {dup.name}
                        </span>
                      )}
                    </span>
                    <span
                      className={`size-5 rounded-full border flex items-center justify-center ${
                        isSel ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {isSel && <Check className="size-3" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setItems(null)}
                className="flex-1 border border-gray-200 rounded-xl p-3 text-sm text-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={selected.size === 0 || isSaving}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-3 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : `Add ${selected.size} to closet`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

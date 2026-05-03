import { useState, useRef, type ChangeEvent } from 'react';
import { Camera, Upload, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export function SustainabilityChecker() {
  const [showResults, setShowResults] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const openCamera = () => cameraInputRef.current?.click();
  const openUploader = () => uploadInputRef.current?.click();

  const handleImageSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log('Selected image:', file);
    setShowResults(true);
  };

  const analysisResults = {
    itemName: 'Floral Summer Dress',
    price: 45,
    versatilityScore: 62,
    matches: 8,
    totalItems: 47,
    recommendation: 'moderate',
    costPerWear: 5.63,
    reasons: [
      { type: 'positive', text: 'Matches 8 items in your wardrobe' },
      { type: 'negative', text: 'Similar to 3 dresses you already own' },
      { type: 'neutral', text: 'Seasonal item - limited wear months' },
    ],
    matchingItems: [
      { name: 'Denim Jacket', emoji: '🧥' },
      { name: 'White Sneakers', emoji: '👟' },
      { name: 'Beige Sandals', emoji: '👡' },
      { name: 'Straw Hat', emoji: '👒' },
      { name: 'Brown Belt', emoji: '👔' },
      { name: 'Gold Necklace', emoji: '📿' },
    ],
  };

  return (
    <div className="size-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Upload Section */}
        {!showResults ? (
          <>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="size-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <AlertCircle className="size-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Should You Buy It?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Snap a photo and I'll check if it matches your wardrobe.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={openCamera}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-3 flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                >
                  <Camera className="size-4" />
                  <span className="font-medium text-sm">Take Photo</span>
                </button>
                <button
                  type="button"
                  onClick={openUploader}
                  className="flex-1 bg-white text-gray-700 rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <Upload className="size-4" />
                  <span className="font-medium text-sm">Upload</span>
                </button>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                className="hidden"
                onChange={handleImageSelected}
              />
              <input
                type="file"
                accept="image/*"
                ref={uploadInputRef}
                className="hidden"
                onChange={handleImageSelected}
              />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <span className="text-3xl mb-2 block">♻️</span>
                <h3 className="font-semibold text-gray-900 mb-1 text-xs">Reduce Waste</h3>
                <p className="text-[10px] text-gray-600">Avoid impulse buys</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <span className="text-3xl mb-2 block">💰</span>
                <h3 className="font-semibold text-gray-900 mb-1 text-xs">Save Money</h3>
                <p className="text-[10px] text-gray-600">Smarter choices</p>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                <span className="text-3xl mb-2 block">✨</span>
                <h3 className="font-semibold text-gray-900 mb-1 text-xs">Versatile</h3>
                <p className="text-[10px] text-gray-600">Works with more</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Analysis Results */}
            <div className={`rounded-xl p-4 shadow-lg border-2 ${
              analysisResults.recommendation === 'positive' ? 'bg-green-50 border-green-300' :
              analysisResults.recommendation === 'negative' ? 'bg-red-50 border-red-300' :
              'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-0.5">{analysisResults.itemName}</h2>
                  <p className="text-base text-gray-700">${analysisResults.price}</p>
                </div>
                <div className={`size-12 rounded-full flex items-center justify-center ${
                  analysisResults.recommendation === 'positive' ? 'bg-green-600' :
                  analysisResults.recommendation === 'negative' ? 'bg-red-600' :
                  'bg-amber-600'
                }`}>
                  {analysisResults.recommendation === 'positive' ? (
                    <CheckCircle className="size-6 text-white" />
                  ) : analysisResults.recommendation === 'negative' ? (
                    <TrendingDown className="size-6 text-white" />
                  ) : (
                    <AlertCircle className="size-6 text-white" />
                  )}
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-900 text-sm">Versatility Score</span>
                  <span className="text-xl font-bold text-gray-900">{analysisResults.versatilityScore}/100</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      analysisResults.versatilityScore >= 70 ? 'bg-green-600' :
                      analysisResults.versatilityScore >= 50 ? 'bg-amber-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${analysisResults.versatilityScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{analysisResults.matches}</p>
                  <p className="text-xs text-gray-600">Matching Items</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">${analysisResults.costPerWear.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Cost Per Wear</p>
                </div>
              </div>

              <div className={`rounded-xl p-3 ${
                analysisResults.recommendation === 'positive' ? 'bg-green-600' :
                analysisResults.recommendation === 'negative' ? 'bg-red-600' :
                'bg-amber-600'
              } text-white font-semibold text-center text-sm`}>
                {analysisResults.recommendation === 'positive' ? '✓ Great Addition!' :
                 analysisResults.recommendation === 'negative' ? '⚠ Think Twice' :
                 '⚡ Your Call'}
              </div>
            </div>

            {/* Analysis Breakdown */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Analysis Breakdown</h3>
              <div className="space-y-2">
                {analysisResults.reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className={`size-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      reason.type === 'positive' ? 'bg-green-100' :
                      reason.type === 'negative' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      {reason.type === 'positive' ? (
                        <TrendingUp className="size-3 text-green-600" />
                      ) : reason.type === 'negative' ? (
                        <TrendingDown className="size-3 text-red-600" />
                      ) : (
                        <AlertCircle className="size-3 text-gray-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-700">{reason.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Matching Items */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Works Well With</h3>
              <div className="grid grid-cols-3 gap-2">
                {analysisResults.matchingItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <span className="text-3xl mb-1 block">{item.emoji}</span>
                    <p className="text-[10px] font-medium text-gray-700">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-4">
              <button
                onClick={() => setShowResults(false)}
                className="flex-1 bg-white text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors border border-gray-200 text-sm"
              >
                Check Another
              </button>
              <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3 font-medium hover:from-purple-700 hover:to-pink-700 transition-all text-sm">
                Add to Wishlist
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

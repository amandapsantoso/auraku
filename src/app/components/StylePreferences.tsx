import { useState } from 'react';
import { Check, X } from 'lucide-react';

export function StylePreferences() {
  const [selectedVibes, setSelectedVibes] = useState<string[]>(['minimalist', 'academic']);
  const [bodyType, setBodyType] = useState('petite');
  const [modestMode, setModestMode] = useState(true);
  const [culturalStyle, setCulturalStyle] = useState('western');

  const styleVibes = [
    { id: 'minimalist', name: 'Minimalist', emoji: '⚪' },
    { id: 'academic', name: 'Academic', emoji: '📚' },
    { id: 'streetwear', name: 'Streetwear', emoji: '🧢' },
    { id: 'bohemian', name: 'Bohemian', emoji: '🌸' },
    { id: 'classic', name: 'Classic', emoji: '👔' },
    { id: 'romantic', name: 'Romantic', emoji: '💕' },
    { id: 'edgy', name: 'Edgy', emoji: '🖤' },
    { id: 'preppy', name: 'Preppy', emoji: '🎀' },
    { id: 'athletic', name: 'Athletic', emoji: '⚡' },
  ];

  const bodyTypes = [
    { id: 'petite', name: 'Petite', desc: 'Under 5\'4"' },
    { id: 'average', name: 'Average', desc: '5\'4" - 5\'7"' },
    { id: 'tall', name: 'Tall', desc: 'Over 5\'7"' },
    { id: 'plus', name: 'Plus Size', desc: 'Size 14+' },
  ];

  const culturalStyles = [
    { id: 'western', name: 'Western', emoji: '🇺🇸' },
    { id: 'asian', name: 'Asian', emoji: '🇯🇵' },
    { id: 'african', name: 'African', emoji: '🇳🇬' },
    { id: 'hijabi', name: 'Hijabi/Modest', emoji: '🧕' },
    { id: 'european', name: 'European', emoji: '🇫🇷' },
    { id: 'mixed', name: 'Mixed/Global', emoji: '🌍' },
  ];

  const toggleVibe = (vibeId: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibeId)
        ? prev.filter(id => id !== vibeId)
        : [...prev, vibeId]
    );
  };

  return (
    <div className="size-full overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white">
          <h2 className="text-lg font-bold mb-1">Your Style Profile</h2>
          <p className="text-xs text-purple-100">Help Auraku understand your preferences</p>
        </div>

        {/* Cultural Style Preferences */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Cultural Style Influence</h3>
          <p className="text-xs text-gray-600 mb-3">What aesthetics resonate with you?</p>
          <div className="grid grid-cols-3 gap-2">
            {culturalStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setCulturalStyle(style.id)}
                className={`p-2.5 rounded-xl text-center transition-all ${
                  culturalStyle === style.id
                    ? 'bg-purple-600 text-white shadow-md scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="text-2xl mb-1 block">{style.emoji}</span>
                <span className="text-[10px] font-medium block">{style.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style Vibes */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Style Vibes</h3>
          <p className="text-xs text-gray-600 mb-3">Select all that resonate (multi-select)</p>
          <div className="grid grid-cols-3 gap-2">
            {styleVibes.map((vibe) => (
              <button
                key={vibe.id}
                onClick={() => toggleVibe(vibe.id)}
                className={`p-2.5 rounded-xl text-center transition-all relative ${
                  selectedVibes.includes(vibe.id)
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {selectedVibes.includes(vibe.id) && (
                  <div className="absolute top-1 right-1 size-4 bg-white rounded-full flex items-center justify-center">
                    <Check className="size-2.5 text-purple-600" />
                  </div>
                )}
                <span className="text-xl mb-1 block">{vibe.emoji}</span>
                <span className="text-[10px] font-medium">{vibe.name}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">{selectedVibes.length} style(s) selected</p>
        </div>

        {/* Body Type */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Body Type</h3>
          <p className="text-xs text-gray-600 mb-3">For flattering silhouettes</p>
          <div className="grid grid-cols-2 gap-2">
            {bodyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setBodyType(type.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  bodyType === type.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <p className="font-medium mb-0.5 text-xs">{type.name}</p>
                <p className="text-[10px] opacity-80">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Modesty & Coverage */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Modest Fashion Mode</h3>
              <p className="text-xs text-gray-600 mt-0.5">Prioritize coverage</p>
            </div>
            <button
              onClick={() => setModestMode(!modestMode)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                modestMode ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 size-5 bg-white rounded-full transition-transform ${
                  modestMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              ></div>
            </button>
          </div>
          {modestMode && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <p className="text-xs text-purple-900">
                ✓ Recommendations will prioritize:
              </p>
              <ul className="text-[10px] text-purple-700 mt-1.5 space-y-0.5 ml-3">
                <li>• Full coverage tops and bottoms</li>
                <li>• Longer hemlines and sleeves</li>
                <li>• Layering-friendly pieces</li>
                <li>• Loose, flowing silhouettes</li>
              </ul>
            </div>
          )}
        </div>

        {/* Avoid Styles */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Styles to Avoid</h3>
          <p className="text-xs text-gray-600 mb-3">What you don't like</p>
          <div className="flex flex-wrap gap-1.5">
            {['Formal', 'Athleisure', 'Patterns', 'Bright', 'Logos'].map((avoid) => (
              <button
                key={avoid}
                className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-[10px] border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1"
              >
                <X className="size-2.5" />
                {avoid}
              </button>
            ))}
            <button className="px-2.5 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-[10px] border border-gray-200 hover:bg-gray-100 transition-colors">
              + Add
            </button>
          </div>
        </div>

        {/* Inspiration Board */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Inspiration Board</h3>
            <button className="text-[10px] text-purple-600 hover:text-purple-700 font-medium">
              Browse →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📌</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Pin outfits from our curated lookbooks
          </p>
        </div>

        {/* Save Button */}
        <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl py-3 font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md text-sm mb-4">
          Save Preferences
        </button>
      </div>
    </div>
  );
}

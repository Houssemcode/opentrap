// src/components/FrictionUnlockModal.tsx
import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Timer, X } from 'lucide-react';
import { generateFrictionPhrase } from '../utils/focusEngine';

interface Props {
  cooldownSeconds: number;
  challengeLength: number;
  onUnlockSuccess: () => void;
  onCancel: () => void;
}

export const FrictionUnlockModal: React.FC<Props> = ({
  cooldownSeconds,
  challengeLength,
  onUnlockSuccess,
  onCancel,
}) => {
  const [remainingCooldown, setRemainingCooldown] = useState(cooldownSeconds);
  const [targetPhrase] = useState(() => generateFrictionPhrase(challengeLength));
  const [typedInput, setTypedInput] = useState('');
  const [pasteAttempted, setPasteAttempted] = useState(false);

  useEffect(() => {
    if (remainingCooldown <= 0) return;
    const timer = setInterval(() => {
      setRemainingCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Prevent sudden multi-character jumps (autofill/clipboard bypass)
    if (val.length - typedInput.length > 1) {
      setPasteAttempted(true);
      return;
    }
    setTypedInput(val);
    if (val === targetPhrase) {
      onUnlockSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between p-4 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
          <Lock className="w-4 h-4"/>
          <span>Friction Lock Active</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          <X className="w-4 h-4"/>
        </button>
      </div>

      <div className="my-auto space-y-4">
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200 leading-relaxed">
          To prevent impulse scrolling, wait for the cooldown timer and type the exact
          case-sensitive string below. Unlocks expire automatically after 5 minutes.
        </div>

        {remainingCooldown > 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-zinc-900/70 rounded-xl border border-zinc-800">
            <Timer className="w-7 h-7 text-amber-400 animate-pulse mb-2"/>
            <span className="text-xs text-zinc-400">Mindful Cooldown</span>
            <span className="text-2xl font-mono font-bold text-amber-400 mt-1">
              {remainingCooldown}s
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 select-none">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Challenge String ({targetPhrase.length} chars)
              </div>
              <div className="font-mono text-xs break-all tracking-wider leading-relaxed">
                {targetPhrase.split('').map((char, idx) => {
                  const typedChar = typedInput[idx];
                  let colorClass = 'text-zinc-400';
                  if (typedChar !== undefined) {
                    colorClass =
                      typedChar === char
                        ? 'text-emerald-400 bg-emerald-950/50'
                        : 'text-rose-400 bg-rose-950/80 underline';
                  }
                  return (
                    <span key={idx} className={colorClass}>
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              autoFocus
              value={typedInput}
              onChange={handleInputChange}
              onPaste={(e) => {
                e.preventDefault();
                setPasteAttempted(true);
              }}
              onDrop={(e) => e.preventDefault()}
              placeholder="Type the exact string above..."
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-100"
            />

            {pasteAttempted && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5"/>
                <span>Copy-paste is disabled. Type each character manually.</span>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition"
      >
        Stay Focused (Cancel)
      </button>
    </div>
  );
};

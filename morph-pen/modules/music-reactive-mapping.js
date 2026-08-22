export function getMusicReactiveDeformState({ elapsed, musicReactiveState }) {
  const mode = musicReactiveState.mode ?? "detail";
  const musicLow = musicReactiveState.isActive ? musicReactiveState.low : 0;
  const musicLowPulse = musicReactiveState.isActive ? musicReactiveState.lowPulse : 0;
  const musicMid = musicReactiveState.isActive ? musicReactiveState.mid : 0;
  const musicMidPulse = musicReactiveState.isActive ? musicReactiveState.midPulse : 0;
  const musicHigh = musicReactiveState.isActive ? musicReactiveState.high : 0;
  const playRoundness = musicReactiveState.isPlaying || musicReactiveState.isActive ? 1 : 0;
  const musicLowPulseSoft = Math.min(musicLowPulse, 0.92);
  const musicHighSoft = Math.min(musicHigh, 0.38);
  const musicMidSoft = Math.min(musicMid, 0.72);
  const soloKeyboardMask = Math.max(0, 1 - Math.min(1, musicHighSoft * 1.35));
  const soloKeyboard = musicMidSoft * soloKeyboardMask;
  const crowdDensity = Math.min(1, musicMidSoft * 0.58 + musicHighSoft * 0.86);
  const lowDominance = Math.min(1, Math.max(0, musicLow - (musicMidSoft * 0.22 + musicHighSoft * 0.32)) * 4.4);
  const kickLift = Math.max(0, musicLowPulseSoft - (musicMidSoft * 0.12 + musicHighSoft * 0.09));
  const kickHit = mode === "thump" ? Math.min(1, kickLift * 3.5) : Math.min(1, kickLift * 2.1);
  const dominantKickHit = kickHit * Math.max(0.45, lowDominance, 1 - crowdDensity * 0.26);
  const highTransientMask = Math.min(1, musicHighSoft * 1.55 + musicMidSoft * 0.34);
  const lowBody = Math.min(1, Math.max(0, (musicLow - 0.16) * 3.35));
  const midBody = Math.min(1, Math.max(0, (musicMidSoft - 0.18) * 2.55));
  const highOnlyMask = Math.min(1, Math.max(0, musicHighSoft - musicMidSoft * 0.72) * 3.4);
  const bassBedImpact =
    Math.min(0.26, Math.max(0, musicLow - 0.3) * 0.82) * Math.max(0.22, lowDominance);
  const clapCoreImpact = musicMidPulse * Math.max(0, midBody - highOnlyMask * 0.28) * (1 - crowdDensity * 0.34) * 0.54;
  const kickCoreImpact = dominantKickHit * Math.max(0.42, lowDominance) * (1 - crowdDensity * 0.16);
  const coreMassImpact = Math.max(
    0,
    Math.min(1, Math.max(kickCoreImpact, clapCoreImpact) + bassBedImpact) -
      highTransientMask * (0.24 + crowdDensity * 0.16),
  );
  const impact = Math.min(
    1,
    coreMassImpact + (musicHighSoft * 0.06 + musicMidSoft * 0.025) * (1 - crowdDensity * 0.45),
  );
  const transientMask = Math.min(1, musicHighSoft * 1.9 + musicMidSoft * 0.46);
  const drumWeight = Math.max(0, lowBody - transientMask * 0.22);
  const bassBedLimbImpact = Math.min(0.18, drumWeight * Math.max(0.28, lowDominance) * 0.22);
  const kickLimbImpact =
    bassBedLimbImpact +
    dominantKickHit * drumWeight * Math.max(0.42, lowDominance) * 1.08;
  const clapLimbImpact = musicMidPulse * midBody * (1 - highOnlyMask) * (1 - crowdDensity * 0.42) * 0.82;
  const limbImpact = Math.min(1, Math.max(kickLimbImpact, clapLimbImpact));
  const centerRoundness = Math.max(0, playRoundness * (0.82 - impact * 0.62));

  return {
    centerRoundness,
    impact,
    coreMassImpact,
    limbImpact,
    blobSpreadMultiplier: 1 - centerRoundness * 0.46 + soloKeyboard * 0.025 + impact * 0.58,
    surfaceBoost:
      musicMidSoft * 0.045 +
      musicHighSoft * 0.035 +
      soloKeyboard * 0.025 +
      impact * 0.32,
    pointerBoost: musicHighSoft * 0.025 + impact * 0.035,
    flowSpeed: 1 + musicMidSoft * 0.015 + musicHighSoft * 0.055 + soloKeyboard * 0.006 + impact * 0.085,
    flowPhase:
      elapsed * (musicLow * 0.025 + musicMidSoft * 0.012 + soloKeyboard * 0.01) +
      musicHighSoft * 0.12 +
      impact * 0.22,
    rippleShift: musicHighSoft * 0.24 + soloKeyboard * 0.035 + impact * 0.58,
  };
}

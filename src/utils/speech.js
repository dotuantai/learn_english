// Web Speech API utility for English pronunciation

export function speakEnglish(text) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // If text contains slash or parentheses, clean it up for pronunciation
  // e.g. "painkiller(s)" -> "painkillers", "cavity / cavities" -> "cavity, cavities"
  const cleanText = text
    .replace(/\(.*?\)/g, '')
    .replace(/\//g, ',')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // Slightly slower for better clarity
  utterance.pitch = 1.0;

  // Try to pick a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    v => (v.lang === 'en-US' || v.lang === 'en-GB') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Alex'))
  ) || voices.find(v => v.lang.startsWith('en'));

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

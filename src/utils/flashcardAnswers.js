export function normalizeAnswer(value, direction = 'en_vi') {
  let normalized = value.toLowerCase()
  if (direction === 'en_vi') {
    normalized = normalized
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
  }
  return normalized
    .replace(/[’‘]/g, "'")
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function englishAlternatives(word) {
  // Accept each listed spelling and both forms of optional plural suffixes.
  const variants = [word, ...word.split('/')]
  return variants.flatMap((variant) => [
    variant,
    variant.replace(/\((s|es)\)/gi, ''),
    variant.replace(/\((s|es)\)/gi, '$1'),
  ])
}

export function isFlashcardAnswerCorrect(answer, word, direction = 'en_vi') {
  const normalized = normalizeAnswer(answer, direction)
  if (!normalized) return false
  const alternatives =
    direction === 'vi_en'
      ? englishAlternatives(word.word)
      : word.meaning.replace(/\([^)]*\)/g, ' ').split(/[,;/]+/)
  return alternatives.some(
    (variant) => normalizeAnswer(variant, direction) === normalized,
  )
}

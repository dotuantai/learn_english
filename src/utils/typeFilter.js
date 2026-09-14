export const TYPE_OPTIONS = [
  { value: 'all', title: 'Tất cả từ loại', abbreviation: 'Aa', label: 'Tất cả từ loại' },
  { value: 'n', title: 'Danh từ', abbreviation: 'n.', label: 'Danh từ (n, n. phr, n/adj...)' },
  { value: 'v', title: 'Động từ', abbreviation: 'v.', label: 'Động từ (v, v. phr...)' },
  { value: 'adj', title: 'Tính từ', abbreviation: 'adj.', label: 'Tính từ (adj, adj. phr...)' },
  { value: 'adv', title: 'Trạng từ', abbreviation: 'adv.', label: 'Trạng từ (adv, adv/adj...)' },
  { value: 'phr', title: 'Cụm từ', abbreviation: 'phr.', label: 'Cụm từ (phr, n. phr, v. phr...)' },
]

export function matchesTypeFilter(wordType, selectedType) {
  if (!selectedType || selectedType === 'all') return true
  if (!wordType) return false

  const type = wordType.toLowerCase().trim()
  const filter = selectedType.toLowerCase().trim().replace(/\.$/, '')

  switch (filter) {
    case 'n':
      // Matches n., n. phr., n./adj.
      return (
        type === 'n.' ||
        type.startsWith('n.') ||
        type.startsWith('n/') ||
        type.includes('/n') ||
        type.includes(' n.')
      )
    case 'v':
      // Matches v., v. phr. (excludes adv.)
      return (
        type === 'v.' ||
        type.startsWith('v.') ||
        type.startsWith('v/') ||
        type.includes('/v')
      )
    case 'adj':
      // Matches adj., adj. phr., n./adj., adv./adj.
      return type.includes('adj')
    case 'adv':
      // Matches adv., adv./adj.
      return type.includes('adv')
    case 'phr':
      // Matches phr., n. phr., v. phr., adj. phr.
      return type.includes('phr')
    default:
      return type === selectedType.toLowerCase().trim()
  }
}

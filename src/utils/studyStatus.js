export const STUDY_STATUS_OPTIONS = [
  {
    value: 'all',
    title: 'Tất cả',
    description: 'Học toàn bộ từ trong nhóm đã chọn',
    icon: 'book',
  },
  {
    value: 'learning',
    title: 'Cần ôn',
    description: 'Tập trung vào những từ chưa thuộc',
    icon: 'pulse',
  },
  {
    value: 'mastered',
    title: 'Đã thuộc',
    description: 'Ôn lại những từ bạn đã đánh dấu',
    icon: 'star',
  },
]

export function isValidStudyStatus(status) {
  return STUDY_STATUS_OPTIONS.some((option) => option.value === status)
}

export function matchesStudyStatus(word, status, masteredIds = []) {
  if (status === 'mastered') return masteredIds.includes(word.id)
  if (status === 'learning') return !masteredIds.includes(word.id)
  return true
}

export function filterByStudyStatus(words, status, masteredIds = []) {
  return words.filter((word) => matchesStudyStatus(word, status, masteredIds))
}

// All current vocabulary belongs to Lesson 1. Add future lessons here with
// their own wordIds; keep IDs unique in words.json so saved mastery stays valid.
export const lessonDefinitions = [
  {
    id: 'lesson-1',
    title: 'Y tế & chăm sóc sức khỏe',
    english: 'Medical & healthcare English',
    description:
      'Bài 1 gồm các từ vựng về sức khỏe, thăm khám, điều trị, thuốc và chăm sóc răng miệng. Học và ôn tập tất cả trong cùng một bài.',
    icon: 'book',
    color: 'violet',
    key: 'bai1',
    wordIds: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
      14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    ],
  },
  {
    id: 'lesson-2',
    title: 'Họ từ vựng Y tế & Sức khỏe',
    english: 'Word Families: Health, Clinic & Hospital',
    description:
      'Bài 2 gồm các họ từ vựng (Noun, Verb, Adj, Adv) về quy trình khám bệnh, nha khoa, bảo hiểm y tế và bệnh viện.',
    icon: 'medical',
    color: 'blue',
    key: 'bai2',
    wordIds: [
      53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
      67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
      81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
      95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
      109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
      123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136,
      137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148,
    ],
  },
]
export function buildLessons(words, masteredIds = []) {
  const flatWords = Array.isArray(words) ? words : Object.values(words).flat()
  const mastered = new Set(masteredIds)
  return lessonDefinitions.map((lesson, index) => {
    const ids = new Set(lesson.wordIds)
    const lessonWords =
      !Array.isArray(words) && lesson.key && words[lesson.key]
        ? words[lesson.key]
        : flatWords.filter((word) => ids.has(word.id))
    const masteredCount = lessonWords.filter((word) =>
      mastered.has(word.id),
    ).length
    return {
      ...lesson,
      number: index + 1,
      words: lessonWords,
      masteredCount,
      progress: lessonWords.length
        ? Math.round((masteredCount / lessonWords.length) * 100)
        : 0,
    }
  })
}

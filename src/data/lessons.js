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
    wordIds: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
      14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
    ],
  },
]
export function buildLessons(words, masteredIds = []) {
  const mastered = new Set(masteredIds)
  return lessonDefinitions.map((lesson, index) => {
    const ids = new Set(lesson.wordIds)
    const lessonWords = words.filter((word) => ids.has(word.id))
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

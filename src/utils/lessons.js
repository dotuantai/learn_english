export function buildLessons(lessonRecords, masteredIds = []) {
  const mastered = new Set(masteredIds)

  return lessonRecords.map((lesson, index) => {
    const words = Array.isArray(lesson.words) ? lesson.words : []
    const masteredCount = words.filter((word) => mastered.has(word.id)).length

    return {
      ...lesson,
      number: lesson.number ?? index + 1,
      words,
      masteredCount,
      progress: words.length
        ? Math.round((masteredCount / words.length) * 100)
        : 0,
    }
  })
}

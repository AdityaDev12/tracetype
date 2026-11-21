import { BOOK_TITLES, type BookId, type Lesson } from '../engine/types.ts'

/** "Chapter 6. The Dynamic Typing Interlude" becomes "Ch. 6: The Dynamic Typing Interlude". */
function shortChapter(title: string): string {
  return title.replace(/^Chapter\s+(\d+)\.\s*/, 'Ch. $1: ')
}

export function ReadMore({ lesson }: { lesson: Lesson }) {
  const byBook = new Map<BookId, string[]>()
  for (const r of lesson.bookRefs) byBook.set(r.book, [...(byBook.get(r.book) ?? []), shortChapter(r.chapter)])
  return (
    <div className="read-more">
      <span className="read-more-title">Read more</span>
      <ul>
        {lesson.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer">
              {l.title} ↗
            </a>
          </li>
        ))}
      </ul>
      {byBook.size > 0 && (
        <p className="also-in">
          Also in:{' '}
          {[...byBook].map(([book, chapters], i) => (
            <span key={book}>
              {i > 0 && '; '}
              <em>{BOOK_TITLES[book]}</em>, {chapters.join(', ')}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

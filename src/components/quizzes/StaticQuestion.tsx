import type { Question } from '../../domain/schema';
import { shuffledPieces } from '../../domain/quiz';

/** Non-interactive question for the print view. Answers appear only in the answer key. */
export function StaticQuestion({ question, number }: { question: Question; number: number }) {
  return (
    <li className="static-question">
      <p className="static-question__prompt">
        <strong>{number}.</strong> {question.prompt}
      </p>
      {question.type === 'multipleChoice' && (
        <>
          {question.sentence && (
            <p lang="ko" className="static-question__korean">
              {question.sentence.korean}
            </p>
          )}
          <ol className="static-question__options" type="A">
            {question.options.map((o) => (
              <li key={o.id}>{o.text}</li>
            ))}
          </ol>
        </>
      )}
      {question.type === 'selfCheck' && (
        <>
          {question.source && <p className="static-question__korean">{question.source}</p>}
          <div className="static-question__blank" aria-hidden="true" />
        </>
      )}
      {question.type === 'tokenSelect' && (
        <p lang="ko" className="static-question__korean">
          {question.sentence.korean}
        </p>
      )}
      {question.type === 'ordering' && (
        <>
          <p lang="ko" className="static-question__korean">
            {shuffledPieces(question).join('  /  ')}
          </p>
          <div className="static-question__blank" aria-hidden="true" />
        </>
      )}
    </li>
  );
}

export function answerKeyText(question: Question): string {
  switch (question.type) {
    case 'multipleChoice': {
      const index = question.options.findIndex((o) => o.id === question.correctOptionId);
      return `${String.fromCharCode(65 + index)}. ${question.options[index].text}`;
    }
    case 'selfCheck':
      return [question.answer.korean, question.answer.romanization, question.answer.english].filter(Boolean).join(' — ');
    case 'tokenSelect':
      return question.correctTokenIndexes.map((i) => question.sentence.tokens[i].text).join(', ');
    case 'ordering':
      return `${question.sentence.korean} (${question.sentence.romanization})`;
  }
}

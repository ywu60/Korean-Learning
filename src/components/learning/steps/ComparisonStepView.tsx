import type { ComparisonStep } from '../../../domain/schema';
import { useDisplay } from '../../../hooks/useDisplay';
import { AudioButton } from '../AudioButton';
import { HighlightedKorean } from '../SentenceCard';

/**
 * Renders as a table on wide screens and as stacked cards on narrow screens
 * (pure CSS; same markup), so there is no horizontal scrolling on mobile.
 */
export function ComparisonStepView({ step }: { step: ComparisonStep }) {
  const { showRomanization, showTranslation } = useDisplay();
  return (
    <div>
      {step.intro && <p className="lead">{step.intro}</p>}
      <table className={`comparison comparison--cols-${step.columns.length}`}>
        <caption className="visually-hidden">{step.title}</caption>
        <thead>
          <tr>
            <th scope="col">Action</th>
            {step.columns.map((c) => (
              <th key={c.id} scope="col">
                <span className="comparison__col-label">{c.label}</span>
                {c.pattern && (
                  <span className="comparison__col-pattern" lang="ko">
                    {c.pattern}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="comparison__row-label">
                {row.label}
              </th>
              {step.columns.map((c) => {
                const cell = row.cells[c.id];
                return (
                  <td key={c.id} data-label={c.label}>
                    <span className="comparison__cell-label" aria-hidden="true">
                      {c.label}
                    </span>
                    <span className="comparison__korean" lang="ko">
                      <span>
                        <HighlightedKorean text={cell.korean} highlight={cell.highlight} />
                      </span>
                      <AudioButton text={cell.korean} label={cell.korean} size="sm" />
                    </span>
                    {showRomanization && <span className="comparison__romanization">{cell.romanization}</span>}
                    {showTranslation && <span className="comparison__english">{cell.english}</span>}
                    {cell.pronunciationNote && <span className="comparison__note">{cell.pronunciationNote}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {step.takeaway && (
        <aside className="callout">
          <p>{step.takeaway}</p>
        </aside>
      )}
    </div>
  );
}

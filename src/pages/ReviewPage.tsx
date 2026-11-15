import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../content';
import { getSectionProgress } from '../domain/progress';
import { normalizeAnswer } from '../domain/quiz';
import { useProgress } from '../hooks/useProgress';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { learnPath } from '../app/paths';
import { VocabularyCard } from '../components/learning/VocabularyCard';

type Tab = 'vocabulary' | 'grammar';
type StatusFilter = 'all' | 'started' | 'saved';

export function ReviewPage() {
  useDocumentTitle('Review');
  const { progress } = useProgress();
  const [tab, setTab] = useState<Tab>('vocabulary');
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const lessonSections = useMemo(
    () =>
      content.modules
        .filter((m) => m.status === 'available')
        .flatMap((m) => content.getSectionsForModule(m.id))
        .filter((s) => s.kind === 'lesson'),
    [],
  );
  const startedSections = new Set(
    lessonSections.filter((s) => getSectionProgress(progress, s).started).map((s) => s.id),
  );

  const q = normalizeAnswer(query);
  const matches = (...fields: (string | undefined)[]) => !q || fields.some((f) => f && normalizeAnswer(f).includes(q));

  const words = content.vocabulary.filter((v) => {
    const source = content.getVocabularySource(v.id);
    if (sectionFilter !== 'all' && source?.sectionId !== sectionFilter) return false;
    if (status === 'started' && (!source || !startedSections.has(source.sectionId))) return false;
    if (status === 'saved' && !progress.savedVocabularyIds.includes(v.id)) return false;
    return matches(v.hangul, v.romanization, v.gloss, v.notes);
  });

  const concepts = content.grammar.filter((g) => {
    const source = content.getGrammarSource(g.id);
    if (sectionFilter !== 'all' && source?.sectionId !== sectionFilter) return false;
    if (status === 'started' && (!source || !startedSections.has(source.sectionId))) return false;
    if (status === 'saved') return false;
    return matches(g.name, g.label, g.description, ...g.rules.map((r) => r.pattern + r.explanation));
  });

  const sectionName = (id: string | undefined) => lessonSections.find((s) => s.id === id)?.label;

  return (
    <div className="page">
      <h1>Review</h1>
      <p className="lead">
        Every word and grammar pattern introduced so far, linked back to the lesson where you first met it.
      </p>

      <div className="tabs" role="tablist" aria-label="Review type">
        {(['vocabulary', 'grammar'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            className="tab"
            onClick={() => setTab(t)}
          >
            {t === 'vocabulary' ? `Vocabulary (${content.vocabulary.length})` : `Grammar (${content.grammar.length})`}
          </button>
        ))}
      </div>

      <div className="filters" role="search">
        <label className="filter">
          <span className="field-label">Search</span>
          <input
            type="search"
            className="text-input"
            placeholder="Hangul, romanization, or English"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="filter">
          <span className="field-label">Section</span>
          <select className="text-input" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
            <option value="all">All sections</option>
            {lessonSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}: {s.title}
              </option>
            ))}
          </select>
        </label>
        <label className="filter">
          <span className="field-label">Show</span>
          <select className="text-input" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">Everything</option>
            <option value="started">From sections I’ve started</option>
            {tab === 'vocabulary' && <option value="saved">Saved words</option>}
          </select>
        </label>
      </div>

      {tab === 'vocabulary' ? (
        <section id="panel-vocabulary" role="tabpanel" aria-labelledby="tab-vocabulary">
          <p className="muted" aria-live="polite">
            {words.length} word{words.length === 1 ? '' : 's'}
          </p>
          {words.length === 0 ? (
            <p className="panel">
              {status === 'saved'
                ? 'No saved words yet. Use the star on any vocabulary card to save it here.'
                : status === 'started'
                  ? 'Start a lesson to see its words here.'
                  : 'No words match your search.'}
            </p>
          ) : (
            <div className="vocab-grid">
              {words.map((v) => {
                const source = content.getVocabularySource(v.id);
                return (
                  <VocabularyCard key={v.id} entry={v}>
                    {source && (
                      <Link className="text-link small" to={learnPath(source.moduleId, source.sectionId, source.stepId)}>
                        Introduced in {sectionName(source.sectionId)}
                      </Link>
                    )}
                  </VocabularyCard>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section id="panel-grammar" role="tabpanel" aria-labelledby="tab-grammar">
          <p className="muted" aria-live="polite">
            {concepts.length} pattern{concepts.length === 1 ? '' : 's'}
          </p>
          {concepts.length === 0 ? (
            <p className="panel">No grammar patterns match your filters.</p>
          ) : (
            <div className="grammar-list">
              {concepts.map((g) => {
                const source = content.getGrammarSource(g.id);
                return (
                  <article key={g.id} className="card grammar-card">
                    <p className="chip" lang="ko">
                      {g.label}
                    </p>
                    <h2 className="card__title">{g.name}</h2>
                    <p>{g.description}</p>
                    <dl className="rule-list">
                      {g.rules.map((r) => (
                        <div key={r.pattern} className="rule">
                          <dt className="rule__pattern">{r.pattern}</dt>
                          <dd className="rule__explanation">{r.explanation}</dd>
                        </div>
                      ))}
                    </dl>
                    {g.pitfalls.length > 0 && (
                      <details>
                        <summary>Watch out for</summary>
                        <ul>
                          {g.pitfalls.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {source && (
                      <Link className="text-link small" to={learnPath(source.moduleId, source.sectionId, source.stepId)}>
                        Taught in {sectionName(source.sectionId) ?? 'lesson'}
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

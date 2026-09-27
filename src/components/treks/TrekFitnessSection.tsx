'use client';

import { useMemo, useState } from 'react';
import type { Trek } from '@/lib/data';
import type { TrekRichSection } from '@/lib/treks/trek-extended-types';
import { RichBlocks } from '@/components/treks/TrekExtendedSections';
import {
  assessTrekFitness,
  type FitnessAssessmentInput,
} from '@/lib/treks/fitness-calculator';
import './trek-fitness.css';

const DEFAULT_INPUT: FitnessAssessmentInput = {
  exerciseDays: '2-3',
  jog5km: 'breaks',
  stairs10Floors: 'breaks',
  priorHighAltitude: 'never',
  weeklyHiking: 'sometimes',
};

const LEVEL_CLASS: Record<string, string> = {
  'needs-preparation': 'kg-fit-level--prep',
  'building-base': 'kg-fit-level--base',
  'trek-ready': 'kg-fit-level--ready',
  'strong-ready': 'kg-fit-level--strong',
};

type Props = {
  trek: Trek;
  section: TrekRichSection;
};

export default function TrekFitnessSection({ trek, section }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState<FitnessAssessmentInput>(DEFAULT_INPUT);
  const [assessed, setAssessed] = useState(false);

  const result = useMemo(() => assessTrekFitness(input, trek.title), [input, trek.title]);
  const visibleBlocks = expanded ? section.blocks : section.blocks.slice(0, 3);
  const planMeta = useMemo(
    () => ({
      trekTitle: trek.title,
      trekId: trek.id,
      maxAltitude: trek.maxAltitude,
      startEndPoint: trek.startEndPoint,
    }),
    [trek],
  );

  const update = <K extends keyof FitnessAssessmentInput>(
    key: K,
    value: FitnessAssessmentInput[K],
  ) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setAssessed(false);
  };

  return (
    <>
      <section id={section.id} className="kg-section">
        <div className="kg-overview-card">
          <div className="kg-overview-head">
            <div>
              <span className="kg-overview-kicker">
                <i className="fa-solid fa-dumbbell" aria-hidden /> {section.kicker}
              </span>
              <h2>{section.title}</h2>
              {section.intro ? <p>{section.intro}</p> : null}
            </div>
          </div>

          <div className="kg-overview-text kg-extended-rich">
            <RichBlocks blocks={visibleBlocks} />
          </div>

          <div className="kg-overview-footer">
            <div className="kg-overview-actions">
              <button
                type="button"
                className="kg-overview-btn kg-overview-btn-primary"
                onClick={() => setExpanded((open) => !open)}
              >
                {expanded ? 'Read Less' : 'Read More'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="fitness-calculator" className="kg-section">
        <div className="kg-fit-card">
          <div className="kg-fit-head">
            <span className="kg-overview-kicker">
              <i className="fa-solid fa-heart-pulse" aria-hidden /> Fitness calculator
            </span>
            <h2>Check your {trek.title} readiness</h2>
            <p>
              Answer five quick questions to get a personalised preparation plan with weekly exercises
              tailored to your fitness level.
            </p>
          </div>

          <div className="kg-fit-grid">
            <form
              className="kg-fit-form kg-detail-inset"
              onSubmit={(e) => {
                e.preventDefault();
                setAssessed(true);
              }}
            >
              <label className="kg-fit-field">
                <span>How many days per week do you exercise?</span>
                <select
                  value={input.exerciseDays}
                  onChange={(e) => update('exerciseDays', e.target.value as FitnessAssessmentInput['exerciseDays'])}
                >
                  <option value="0-1">0–1 days</option>
                  <option value="2-3">2–3 days</option>
                  <option value="4-5">4–5 days</option>
                  <option value="6-7">6–7 days</option>
                </select>
              </label>

              <label className="kg-fit-field">
                <span>Can you jog 5 km?</span>
                <select
                  value={input.jog5km}
                  onChange={(e) => update('jog5km', e.target.value as FitnessAssessmentInput['jog5km'])}
                >
                  <option value="no">Not yet</option>
                  <option value="breaks">With walking breaks</option>
                  <option value="yes">Yes, comfortably</option>
                </select>
              </label>

              <label className="kg-fit-field">
                <span>Can you climb 10 floors without severe breathlessness?</span>
                <select
                  value={input.stairs10Floors}
                  onChange={(e) =>
                    update('stairs10Floors', e.target.value as FitnessAssessmentInput['stairs10Floors'])
                  }
                >
                  <option value="no">No</option>
                  <option value="breaks">With pauses</option>
                  <option value="yes">Yes</option>
                </select>
              </label>

              <label className="kg-fit-field">
                <span>Prior trek above 3,000 m (10,000 ft)?</span>
                <select
                  value={input.priorHighAltitude}
                  onChange={(e) =>
                    update('priorHighAltitude', e.target.value as FitnessAssessmentInput['priorHighAltitude'])
                  }
                >
                  <option value="never">Never</option>
                  <option value="once">Once</option>
                  <option value="multiple">Multiple times</option>
                </select>
              </label>

              <label className="kg-fit-field">
                <span>Weekly hiking or long outdoor walks?</span>
                <select
                  value={input.weeklyHiking}
                  onChange={(e) => update('weeklyHiking', e.target.value as FitnessAssessmentInput['weeklyHiking'])}
                >
                  <option value="rarely">Rarely</option>
                  <option value="sometimes">1–2 times per month</option>
                  <option value="regular">Regularly (weekly)</option>
                </select>
              </label>

              <button type="submit" className="kg-pill-btn kg-pill-btn--primary kg-fit-form-submit">
                <i className="fa-solid fa-heart-pulse" aria-hidden /> Calculate my fitness level
              </button>
            </form>

            <div className="kg-fit-result kg-detail-inset" aria-live="polite">
              {assessed ? (
                <>
                  <div className={`kg-fit-level ${LEVEL_CLASS[result.level.id] ?? ''}`}>
                    <span className="kg-fit-level-label">Your level</span>
                    <strong>{result.level.label}</strong>
                    <span className="kg-fit-score">Score: {result.score} / 100</span>
                  </div>
                  <p className="kg-fit-summary">{result.level.summary}</p>
                  <p className="kg-fit-readiness">{result.level.readiness}</p>

                  <h3>Recommended timeline</h3>
                  <p className="kg-fit-timeline">{result.level.weeksRecommended} of structured training</p>

                  <h3>Weekly plan highlights</h3>
                  <ul className="kg-rich-list kg-rich-list--compact">
                    {result.level.weeklyPlan.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <h3>Personal tips</h3>
                  <ul className="kg-rich-list kg-rich-list--compact">
                    {result.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>

                  <div className="kg-fit-downloads">
                    <button
                      type="button"
                      className="kg-pill-btn kg-pill-btn--primary"
                      onClick={() => {
                        void (async () => {
                          const { downloadFitnessPlanPdf } = await import('@/lib/treks/fitness-plan-pdf');
                          await downloadFitnessPlanPdf(result, planMeta);
                        })();
                      }}
                    >
                      <i className="fa-solid fa-download" aria-hidden /> Download training plan (PDF)
                    </button>
                    <button
                      type="button"
                      className="kg-pill-btn"
                      onClick={() => {
                        void (async () => {
                          const { printFitnessPlanPdf } = await import('@/lib/treks/fitness-plan-pdf');
                          await printFitnessPlanPdf(result, planMeta);
                        })();
                      }}
                    >
                      <i className="fa-solid fa-print" aria-hidden /> Print plan
                    </button>
                  </div>
                </>
              ) : (
                <div className="kg-fit-placeholder">
                  <i className="fa-solid fa-clipboard-list" aria-hidden />
                  <p>Complete the form and tap calculate to see your personalised {trek.title} fitness plan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

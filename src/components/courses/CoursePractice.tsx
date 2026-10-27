import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InteractiveBlockPlayer } from '../editor/blocks/InteractiveBlockPlayer';
import { listenToReviewBlocks, rememberPractice } from '../../lib/review';
import { coursePracticePool, pickReviewBlocks, type BlockMemory, type ReviewPick } from '../../utils/review';
import type { Course, CoursePost } from '../../lib/courses';

export function CourseReview({
  course,
  posts,
  onClose,
}: {
  course: Course;
  posts: CoursePost[];
  onClose: () => void;
}) {
  const { user, cards, showToast } = useApp();
  const [memory, setMemory] = useState<BlockMemory[]>([]);
  const [ready, setReady] = useState(false);
  const [queue, setQueue] = useState<ReviewPick[] | null>(null);
  const [index, setIndex] = useState(0);
  const [validated, setValidated] = useState<{ isCorrect: boolean } | null>(null);
  const [results, setResults] = useState<{ isCorrect: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => listenToReviewBlocks(user.id, items => {
    setMemory(items);
    setReady(true);
  }), [user.id]);

  useEffect(() => {
    if (!ready || queue) return;
    const cardIds = posts.map(post => post.cardId).filter((id): id is string => Boolean(id));
    if (cardIds.length > 0 && cards.length === 0) return;
    setQueue(pickReviewBlocks(coursePracticePool(cards, cardIds), memory));
  }, [ready, queue, posts, cards, memory]);

  const current = queue?.[index];

  const finish = (answered: { isCorrect: boolean }[]) => {
    setResults(answered);
    setFinished(true);
  };

  const remember = (pick: ReviewPick, correct: boolean) => {
    void rememberPractice({
      cardId: pick.cardId,
      blockId: pick.block.id,
      subjectName: course.subjectName,
      correct,
      username: user.username,
      fullName: user.fullName,
      isIncognito: false,
    }).catch(() => showToast('No se pudo guardar este resultado.'));
  };

  const next = () => {
    if (!current || !queue) return;
    const result = validated ?? { isCorrect: true };
    remember(current, result.isCorrect);
    const answered = [...results, result];
    setValidated(null);
    if (index + 1 < queue.length) {
      setResults(answered);
      setIndex(index + 1);
      return;
    }
    finish(answered);
  };

  if (!queue) return <p className="text-sm text-zinc-500">Armando el repaso…</p>;

  if (queue.length === 0) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={onClose} className="text-xs font-semibold text-zinc-400 hover:text-zinc-200">Volver</button>
        <p className="text-sm text-zinc-400">Lo que fallaste vuelve mañana. En el muro puedes abrir el cuaderno completo.</p>
      </div>
    );
  }

  const correctCount = results.filter(item => item.isCorrect).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <span className="text-xs text-zinc-500">
          {finished ? 'Listo' : `${index + 1} de ${queue.length}`}
        </span>
      </div>

      {finished ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {correctCount} de {results.length} bien
          </p>
          <p className="text-sm text-zinc-400">Lo que fallaste vuelve mañana en este mismo repaso. Tu precisión ya está en el ranking del curso.</p>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-100">Ver el curso</button>
        </div>
      ) : current && (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Repaso de 5 minutos · {course.subjectName}</p>
            <p className="text-sm text-zinc-400 mt-1">{current.cardTitle}{current.missed ? ' · Lo fallaste antes' : ''}</p>
          </div>
          <InteractiveBlockPlayer
            key={current.block.id}
            block={current.block}
            onComplete={isCorrect => setValidated({ isCorrect })}
            onNext={next}
            nextLabel={index + 1 < queue.length ? 'Siguiente' : 'Terminar'}
            isGameMode={false}
          />
        </div>
      )}
    </div>
  );
}

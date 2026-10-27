import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Gamepad2, Search } from 'lucide-react';
import { CatalogSearch } from '../common/CatalogSearch';
import {
  isCourseStaff,
  listenToPosts,
  listenToPublicCourses,
  syncCourseMaterials,
  type Course,
  type CoursePost,
} from '../../lib/courses';
import type { StudyItemCard } from '../../types';

function fold(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

const OPEN_COURSE_KEY = 'notea_open_course';
const CARD_COURSES_KEY = 'notea_card_courses';
const FROM_EXPLORE_KEY = 'notea_from';

interface ExploreMaterial {
  card: StudyItemCard;
  courses: { code: string; name: string }[];
}

export const SubjectDetailView: React.FC = () => {
  const { cards, user, universities, subjects, setActiveCardId, setCurrentView, openAuthModal, authReady } = useApp();
  const [query, setQuery] = useState('');
  const [universityFilter, setUniversityFilter] = useState(user.university || '');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [handleFilter, setHandleFilter] = useState('');
  const universityTouched = useRef(false);
  const [tab, setTab] = useState<'courses' | 'materials'>('courses');
  const [publicCourses, setPublicCourses] = useState<Course[]>([]);
  const [postsByCode, setPostsByCode] = useState<Record<string, CoursePost[]>>({});
  const guest = authReady && user.isGuest;

  useEffect(() => {
    if (universityTouched.current || !user.university) return;
    setUniversityFilter(user.university);
  }, [user.university]);

  useEffect(() => {
    if (guest) return;
    return listenToPublicCourses(setPublicCourses);
  }, [guest]);

  const courseKey = publicCourses.map(course => course.code).join(',');
  const coursesRef = useRef(publicCourses);
  coursesRef.current = publicCourses;

  useEffect(() => {
    const courses = coursesRef.current;
    if (guest || courses.length === 0) return;
    const stops = courses.map(course => listenToPosts(course.code, posts => {
      setPostsByCode(current => ({ ...current, [course.code]: posts }));
      if (isCourseStaff(course, user.id)) void syncCourseMaterials(course, posts);
    }));
    return () => stops.forEach(stop => stop());
  }, [guest, courseKey, user.id]);

  const materials = useMemo(() => {
    const byId = new Map<string, ExploreMaterial>();
    for (const card of cards) {
      if (card.visibility !== 'public') continue;
      byId.set(card.id, { card, courses: [] });
    }
    const attach = (cardId: string, course: { code: string; name: string }) => {
      const existing = byId.get(cardId);
      if (!existing || existing.courses.some(item => item.code === course.code)) return;
      existing.courses.push(course);
    };
    for (const course of publicCourses) {
      const place = { code: course.code, name: course.name };
      for (const post of postsByCode[course.code] || []) {
        if (post.cardId) attach(post.cardId, place);
      }
      for (const card of cards) {
        if (card.publishedCourses?.some(item => item.code === course.code)) attach(card.id, place);
      }
    }
    return [...byId.values()].sort((a, b) => a.card.title.localeCompare(b.card.title, 'es', { sensitivity: 'base' }));
  }, [cards, publicCourses, postsByCode]);

  const needle = fold(query.trim());
  const handle = fold(handleFilter.trim().replace(/^@/, ''));
  const same = (left: string, right: string) => fold(left) === fold(right);
  const visibleCourses = publicCourses.filter(course => {
    if (universityFilter && !same(course.university, universityFilter)) return false;
    if (subjectFilter && !same(course.subjectName, subjectFilter)) return false;
    const owner = course.members[course.ownerId]?.username || '';
    if (handle && !fold(owner).includes(handle)) return false;
    if (!needle) return true;
    return [course.name, course.code, course.description].some(value => fold(value || '').includes(needle));
  });
  const visibleMaterials = materials.filter(item => {
    const university = item.card.universityName || item.card.authorUniversity;
    if (universityFilter && !same(university, universityFilter)) return false;
    if (subjectFilter && !same(item.card.subjectName, subjectFilter)) return false;
    if (!needle) return true;
    return [item.card.title, item.card.authorUsername, item.card.accessCode, item.card.description]
      .some(value => fold(value || '').includes(needle));
  });

  const openCourse = (code: string) => {
    if (guest) {
      openAuthModal('login');
      return;
    }
    sessionStorage.setItem(OPEN_COURSE_KEY, code);
    sessionStorage.removeItem(FROM_EXPLORE_KEY);
    setCurrentView('courses');
  };

  const openMaterial = (item: ExploreMaterial) => {
    sessionStorage.removeItem(OPEN_COURSE_KEY);
    sessionStorage.setItem(CARD_COURSES_KEY, JSON.stringify(item.courses));
    sessionStorage.setItem(FROM_EXPLORE_KEY, 'explore');
    setActiveCardId(item.card.id);
    setCurrentView('content_preview');
  };

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`;
  const universityItems = universities.map(item => ({ id: item.id, name: item.name }));
  const subjectItems = subjects.map(item => ({ id: item.id, name: item.name }));
  const pickUniversity = (name: string) => {
    universityTouched.current = true;
    setUniversityFilter(name);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      <div className="flex gap-1">
        <button type="button" onClick={() => setTab('courses')} className={tabClass(tab === 'courses')}>Cursos</button>
        <button type="button" onClick={() => setTab('materials')} className={tabClass(tab === 'materials')}>Materiales</button>
      </div>
      {!guest && (
        <div className="space-y-3">
          <div className={`grid gap-3 ${tab === 'courses' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Universidad</p>
              <CatalogSearch
                placeholder="Buscar universidad"
                selected={universityFilter}
                items={universityItems}
                emptyLabel="No hay universidades con ese nombre."
                onSelect={pickUniversity}
                onClear={() => pickUniversity('')}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Materia</p>
              <CatalogSearch
                placeholder="Buscar materia"
                selected={subjectFilter}
                items={subjectItems}
                emptyLabel="No hay materias con ese nombre."
                onSelect={setSubjectFilter}
                onClear={() => setSubjectFilter('')}
              />
            </div>
            {tab === 'courses' && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Usuario</p>
                <input
                  type="search"
                  value={handleFilter}
                  onChange={event => setHandleFilter(event.target.value)}
                  placeholder="@usuario"
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={tab === 'courses' ? 'Buscar por nombre' : 'Buscar cuaderno o juego'}
              className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>
      )}

      {guest ? (
        <div className="space-y-3">
          <p className="text-base text-zinc-300">Inicia sesión para ver los cursos y el material publicado.</p>
          <button type="button" onClick={() => openAuthModal('login')} className="text-base font-semibold text-zinc-100">
            Iniciar sesión
          </button>
        </div>
      ) : (
        <>
          {tab === 'courses' && (
          <section className="space-y-3">
            {visibleCourses.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {universityFilter || subjectFilter || handle || needle
                  ? 'Ningún curso coincide con esos filtros.'
                  : 'Todavía no hay cursos públicos.'}
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleCourses.map(course => {
                  const owner = course.members[course.ownerId]?.username;
                  const meta = [course.subjectName, course.university, owner ? `@${owner}` : ''].filter(Boolean).join(' · ');
                  return (
                    <button
                      key={course.code}
                      type="button"
                      onClick={() => openCourse(course.code)}
                      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-left"
                    >
                      <div
                        className="relative min-h-36 p-5 flex flex-col justify-end"
                        style={course.coverUrl
                          ? { backgroundImage: `url(${course.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)' }}
                      >
                        <div className="absolute inset-0 bg-black/45" />
                        <div className="relative">
                          <p className="text-xl font-bold text-white">{course.name}</p>
                          {meta && <p className="text-sm text-zinc-200 mt-1">{meta}</p>}
                        </div>
                      </div>
                      {course.description && (
                        <p className="px-5 py-4 text-base text-zinc-300 line-clamp-3">{course.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
          )}

          {tab === 'materials' && (
          <section className="space-y-3">
            {visibleMaterials.length === 0 ? (
              <p className="text-sm text-zinc-500">
                {universityFilter || subjectFilter || needle
                  ? 'Ningún material coincide con esos filtros.'
                  : 'Todavía no hay cuadernos ni juegos públicos.'}
              </p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {visibleMaterials.map(item => (
                  <button key={item.card.id} type="button" onClick={() => openMaterial(item)} className="w-full py-3 text-left space-y-1">
                    <p className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                      {item.card.contentType === 'game'
                        ? <Gamepad2 className="w-3.5 h-3.5 text-zinc-500" />
                        : <BookOpen className="w-3.5 h-3.5 text-zinc-500" />}
                      {item.card.title}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {item.card.contentType === 'game' ? 'Juego' : 'Cuaderno'}
                      {item.card.authorUsername ? ` · @${item.card.authorUsername}` : ''}
                      {item.courses.length > 0 ? ` · ${item.courses.map(course => course.name).join(', ')}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
          )}
        </>
      )}
    </div>
  );
};

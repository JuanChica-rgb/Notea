import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { listenToMemberCourses, type Course } from '../../lib/courses';

const OPEN_KEY = 'notea_open_course';

export function AccountCourses({ personId, mine }: { personId: string; mine?: boolean }) {
  const { user, setCurrentView, openAuthModal } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!personId || user.isGuest) {
      setCourses([]);
      return;
    }
    return listenToMemberCourses(personId, setCourses);
  }, [personId, user.isGuest]);

  const open = (code: string) => {
    if (user.isGuest) {
      openAuthModal('login');
      return;
    }
    sessionStorage.setItem(OPEN_KEY, code);
    setCurrentView('courses');
  };

  if (user.isGuest) {
    return <p className="text-sm text-zinc-500">Inicia sesión para ver los cursos de esta cuenta.</p>;
  }

  const listed = mine
    ? courses
    : courses.filter(course => course.visibility !== 'private' || course.memberIds.includes(user.id) || course.ownerId === user.id);
  const created = listed.filter(course => course.ownerId === personId);
  const joined = listed.filter(course => course.ownerId !== personId);
  if (created.length === 0 && joined.length === 0) {
    return <p className="text-sm text-zinc-500">{mine ? 'Todavía no estás en ningún curso.' : 'Todavía no está en ningún curso.'}</p>;
  }

  const group = (title: string, list: Course[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</h3>
        <div className="grid gap-2">
          {list.map(course => (
            <button
              key={course.code}
              type="button"
              onClick={() => open(course.code)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left"
            >
              <span className="block text-sm font-semibold text-zinc-100">{course.name}</span>
              <span className="block text-xs text-zinc-500 mt-0.5">
                {[course.subjectName, course.university, course.code].filter(Boolean).join(' · ')}
                {course.visibility === 'private' ? ' · Privado' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {group(mine ? 'Cursos que creaste' : 'Cursos que creó', created)}
      {group(mine ? 'Cursos en los que estás' : 'Cursos en los que está', joined)}
    </div>
  );
}

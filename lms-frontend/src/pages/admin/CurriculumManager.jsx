import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AuthContext } from '../../contexts/AuthContext';

// ─────────────────────────────────────────────
// Tiny icon components
// ─────────────────────────────────────────────
const ChevronDown = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
);
const ChevronRight = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
);

// ─────────────────────────────────────────────
// Curriculum colour palette per level (cycles)
// ─────────────────────────────────────────────
const LEVEL_COLORS = [
    { ring: 'border-l-school-primary', badge: 'bg-red-100 text-red-700', dot: 'bg-school-primary' },
    { ring: 'border-l-school-secondary', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-school-secondary' },
    { ring: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    { ring: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    { ring: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    { ring: 'border-l-sky-500', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
];

export default function CurriculumManager() {
    const navigate = useNavigate();
    const { user: currentUser } = useContext(AuthContext);

    // ── Data ──────────────────────────────────
    const [subjects, setSubjects] = useState([]);
    const [academicLevels, setAcademicLevels] = useState([]);
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Expansion State ───────────────────────
    const [expandedLevels, setExpandedLevels] = useState([]);      // academic level ids
    const [expandedSubjects, setExpandedSubjects] = useState([]);   // subject ids
    const [expandedUnits, setExpandedUnits] = useState([]);         // unit ids
    const [expandedSubUnits, setExpandedSubUnits] = useState([]);   // sub-unit ids

    // ── Modal ─────────────────────────────────
    const [modal, setModal] = useState({ isOpen: false, type: '', mode: 'create', parentId: null, editId: null });
    const [form, setForm] = useState({ title: '', academic_level_id: '', teacher_id: '', teacher_ids: [] });
    const [isSaving, setIsSaving] = useState(false);

    // ── Fetch ─────────────────────────────────
    const fetchAll = async () => {
        try {
            setIsLoading(true);
            const [subjectsRes, levelsRes, staffRes] = await Promise.all([
                api.get('subjects'),
                api.get('academic-levels'),
                api.get('staff-list'),
            ]);
            setSubjects(subjectsRes.data);
            setAcademicLevels(levelsRes.data);
            setStaff(staffRes.data);
        } catch (err) {
            console.error('Failed to fetch curriculum:', err);
            setError('Failed to load curriculum data. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        fetchAll(); 
        const onFocus = () => fetchAll();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    // ── Group subjects by academic_level_id ───
    const groupedByLevel = useMemo(() => {
        const map = {};
        subjects.forEach(subject => {
            const lvlId = subject.academic_level_id;
            if (!map[lvlId]) map[lvlId] = [];
            map[lvlId].push(subject);
        });
        return map;
    }, [subjects]);

    // Build the ordered list of levels that actually have subjects or exist in DB
    const orderedLevels = useMemo(() => {
        // Merge all levels from DB, marking which have subjects
        return academicLevels.map(lvl => {
            let lvlSubjects = groupedByLevel[lvl.id] || [];

            // TEACHER FILTER: Only show subjects they teach
            if (currentUser?.role === 'teacher') {
                lvlSubjects = lvlSubjects.filter(sub =>
                    currentUser.taught_subjects?.some(ts => ts.id === sub.id)
                );
            }

            return {
                ...lvl,
                subjects: lvlSubjects,
            };
        }).filter(lvl =>
            // If teacher, only show levels that have at least one of their subjects
            currentUser?.role === 'teacher' ? lvl.subjects.length > 0 : true
        );
    }, [academicLevels, groupedByLevel, currentUser]);

    // ── Helpers ───────────────────────────────
    const toggle = (id, state, setState) => {
        setState(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const openModal = (type, mode = 'create', parentId = null, existingItem = null) => {
        setModal({ isOpen: true, type, mode, parentId, editId: existingItem?.id || null });
        setForm({
            title: existingItem?.title || existingItem?.name || '',
            academic_level_id: existingItem?.academic_level_id || (academicLevels[0]?.id || '').toString(),
            teacher_id: existingItem?.class_teacher_id || '',
            teacher_ids: existingItem?.teachers?.map(t => t.id) || []
        });
    };

    const closeModal = () => {
        setModal({ isOpen: false, type: '', mode: 'create', parentId: null, editId: null });
        setForm({ title: '', academic_level_id: '', teacher_id: '', teacher_ids: [] });
    };

    // ── Submit ────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { type, mode, parentId, editId } = modal;
            let endpoint = '';
            let payload = {};
            let usePut = mode !== 'create';

            if (type === 'subject') {
                endpoint = 'subjects';
                payload = { name: form.title, academic_level_id: form.academic_level_id };
            } else if (type === 'unit') {
                endpoint = mode === 'create' ? 'units' : `units/${editId}`;
                payload = { title: form.title, order: 1 };
                if (mode === 'create') payload.subject_id = parentId;
            } else if (type === 'subunit') {
                endpoint = mode === 'create' ? 'subunits' : `subunits/${editId}`;
                payload = { title: form.title, order: 1 };
                if (mode === 'create') payload.unit_id = parentId;
            } else if (type === 'lesson') {
                endpoint = mode === 'create' ? 'lessons' : `lessons/${editId}`;
                payload = { title: form.title, order: 1 };
                if (mode === 'create') payload.sub_unit_id = parentId;
            } else if (type === 'assign_class_teacher') {
                endpoint = `academic-levels/${editId}/teacher`;
                payload = { class_teacher_id: form.teacher_id || null };
                usePut = true;
            } else if (type === 'assign_subject_teachers') {
                endpoint = `subjects/${editId}/teachers`;
                payload = { teacher_ids: form.teacher_ids };
                usePut = true;
            }

            if (!usePut) await api.post(endpoint, payload);
            else await api.put(endpoint, payload);

            await fetchAll();
            closeModal();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save. Please check your connection and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Modal label helpers ───────────────────
    const typeLabel = {
        subject: 'Subject',
        unit: 'Unit / Strand',
        subunit: 'Topic / Sub-Strand',
        lesson: 'Lesson',
        assign_class_teacher: 'Class Teacher',
        assign_subject_teachers: 'Subject Teachers'
    };

    if (isLoading) return (
        <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-school-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading curriculum structure…</p>
            </div>
        </div>
    );
    if (error) return <div className="p-4 text-red-500 font-medium bg-red-50 rounded-xl">{error}</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Curriculum Builder</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Classes (Class Teacher) → Subjects (Subject Teachers) → Content Structure
                    </p>
                </div>
                {currentUser?.role !== 'teacher' && (
                    <Button variant="primary" onClick={() => openModal('subject')}>
                        + Add Subject to a Class
                    </Button>
                )}
            </div>

            {/* ── LEGEND ── */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                {[
                    { color: 'bg-school-primary', label: 'Class / Grade level' },
                    { color: 'bg-blue-500', label: 'Subject' },
                    { color: 'bg-indigo-400', label: 'Unit / Strand' },
                    { color: 'bg-purple-400', label: 'Topic / Sub-Strand' },
                    { color: 'bg-gray-300', label: 'Lesson' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        {item.label}
                    </div>
                ))}
            </div>

            {/* ── MAIN TREE ── */}
            <div className="space-y-4">
                {orderedLevels.length === 0 ? (
                    <Card className="p-8 text-center text-gray-400">
                        No classes or subjects yet. Click "Add Subject to a Class" to begin.
                    </Card>
                ) : (
                    orderedLevels.map((level, levelIdx) => {
                        const colors = LEVEL_COLORS[levelIdx % LEVEL_COLORS.length];
                        const isLevelOpen = expandedLevels.includes(level.id);

                        return (
                            <Card key={level.id} noPadding className={`overflow-hidden border border-gray-100 border-l-4 ${colors.ring}`}>

                                {/* ════ LEVEL (CLASS/GRADE) HEADER ════ */}
                                <div
                                    className="flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggle(level.id, expandedLevels, setExpandedLevels)}
                                >
                                    <div className="flex items-center gap-3">
                                        <button className="text-gray-400 hover:text-gray-700 transition-colors">
                                            {isLevelOpen ? <ChevronDown /> : <ChevronRight />}
                                        </button>
                                        <div className={`w-8 h-8 rounded-lg ${colors.dot} flex items-center justify-center flex-shrink-0`}>
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900">{level.name}</h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-gray-400">
                                                    {level.curriculum?.name || 'No framework'} · {level.subjects.length} subject{level.subjects.length !== 1 ? 's' : ''}
                                                </p>
                                                <div className="h-1 w-1 rounded-full bg-gray-300" />
                                                <button
                                                    onClick={(e) => {
                                                        if (currentUser?.role === 'teacher') return;
                                                        e.stopPropagation();
                                                        openModal('assign_class_teacher', 'edit', null, level);
                                                    }}
                                                    className={`text-[10px] font-medium text-gray-500 ${currentUser?.role !== 'teacher' ? 'hover:text-school-primary hover:underline' : ''} transition-colors`}
                                                >
                                                    Teacher: {level.class_teacher?.name || 'Unassigned'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                        <span className={`hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                                            {level.curriculum?.name || 'Framework'}
                                        </span>
                                        {currentUser?.role !== 'teacher' && (
                                            <Button size="sm" variant="outline" onClick={() => {
                                                openModal('subject');
                                                setForm(f => ({ ...f, academic_level_id: level.id.toString() }));
                                            }}>
                                                + Add Subject
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* ════ SUBJECTS LIST ════ */}
                                {isLevelOpen && (
                                    <div className="bg-gray-50/50 border-t border-gray-100 divide-y divide-gray-100">
                                        {level.subjects.length === 0 ? (
                                            <div className="px-10 py-6 text-sm text-gray-400 flex items-center gap-2">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                                No subjects in this class yet. Use the "+ Add Subject" button above.
                                            </div>
                                        ) : (
                                            level.subjects.map(subject => {
                                                const isSubjectOpen = expandedSubjects.includes(subject.id);
                                                return (
                                                    <div key={subject.id} className="pl-4">

                                                        {/* ── SUBJECT ROW ── */}
                                                        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-l-4 border-blue-400 hover:bg-blue-50/30 transition-colors">
                                                            <div
                                                                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                                                onClick={() => toggle(subject.id, expandedSubjects, setExpandedSubjects)}
                                                            >
                                                                <button className="text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0">
                                                                    {isSubjectOpen ? <ChevronDown /> : <ChevronRight />}
                                                                </button>
                                                                <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                                                                    {subject.name.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-gray-800 text-sm">{subject.name}</p>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <p className="text-[10px] text-gray-400">{subject.units?.length || 0} unit{subject.units?.length !== 1 ? 's' : ''}</p>
                                                                        <div className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                                                                        <button
                                                                            onClick={(e) => {
                                                                                if (currentUser?.role === 'teacher') return;
                                                                                e.stopPropagation();
                                                                                openModal('assign_subject_teachers', 'edit', null, subject);
                                                                            }}
                                                                            className={`text-[9px] font-medium text-blue-500 ${currentUser?.role !== 'teacher' ? 'hover:underline' : ''}`}
                                                                        >
                                                                            Staff: {subject.teachers?.length ? subject.teachers.map(t => t.name.split(' ')[0]).join(', ') : 'Assign Teachers'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm" variant="ghost"
                                                                onClick={() => openModal('unit', 'create', subject.id)}
                                                                className="text-blue-600 hover:text-blue-800 text-xs flex-shrink-0"
                                                            >
                                                                + Add Unit
                                                            </Button>
                                                        </div>

                                                        {/* ── UNITS LIST ── */}
                                                        {isSubjectOpen && (
                                                            <div className="pl-6 divide-y divide-gray-50">
                                                                {(!subject.units || subject.units.length === 0) && (
                                                                    <div className="px-6 py-3 text-xs text-gray-400">No units / strands added yet.</div>
                                                                )}
                                                                {subject.units?.map(unit => {
                                                                    const isUnitOpen = expandedUnits.includes(unit.id);
                                                                    return (
                                                                        <div key={unit.id} className="pl-2">

                                                                            {/* ── UNIT ROW ── */}
                                                                            <div className="flex items-center justify-between px-5 py-3 bg-white border-l-4 border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                                                                                <div
                                                                                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                                                                    onClick={() => toggle(unit.id, expandedUnits, setExpandedUnits)}
                                                                                >
                                                                                    <button className="text-gray-300 hover:text-indigo-500 transition-colors flex-shrink-0">
                                                                                        {isUnitOpen ? <ChevronDown /> : <ChevronRight />}
                                                                                    </button>
                                                                                    <span className="font-medium text-gray-700 text-sm truncate">
                                                                                        📦 {unit.title}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{unit.sub_units?.length || 0} topics</span>
                                                                                </div>
                                                                                <div className="flex gap-2 flex-shrink-0">
                                                                                    <button onClick={() => openModal('unit', 'edit', null, unit)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">Edit</button>
                                                                                    <button onClick={() => openModal('subunit', 'create', unit.id)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">+ Topic</button>
                                                                                </div>
                                                                            </div>

                                                                            {/* ── SUBUNITS LIST ── */}
                                                                            {isUnitOpen && (
                                                                                <div className="pl-6 divide-y divide-gray-50 bg-gray-50/70">
                                                                                    {(!unit.sub_units || unit.sub_units.length === 0) && (
                                                                                        <div className="px-5 py-3 text-xs text-gray-400">No topics added yet.</div>
                                                                                    )}
                                                                                    {unit.sub_units?.map(subUnit => {
                                                                                        const isSubUnitOpen = expandedSubUnits.includes(subUnit.id);
                                                                                        return (
                                                                                            <div key={subUnit.id} className="pl-2">

                                                                                                {/* ── SUBUNIT ROW ── */}
                                                                                                <div className="flex items-center justify-between px-5 py-2.5 hover:bg-purple-50/30 transition-colors border-l-4 border-purple-400">
                                                                                                    <div
                                                                                                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                                                                                        onClick={() => toggle(subUnit.id, expandedSubUnits, setExpandedSubUnits)}
                                                                                                    >
                                                                                                        <button className="text-gray-300 hover:text-purple-500 transition-colors flex-shrink-0">
                                                                                                            {isSubUnitOpen ? <ChevronDown /> : <ChevronRight />}
                                                                                                        </button>
                                                                                                        <span className="text-sm text-gray-700 truncate">
                                                                                                            📌 {subUnit.title}
                                                                                                        </span>
                                                                                                        <span className="text-[10px] text-gray-400 flex-shrink-0">{subUnit.lessons?.length || 0} lessons</span>
                                                                                                    </div>
                                                                                                    <div className="flex gap-2 flex-shrink-0">
                                                                                                        <button onClick={() => openModal('subunit', 'edit', null, subUnit)} className="text-xs text-gray-400 hover:text-purple-600 transition-colors">Edit</button>
                                                                                                        <button onClick={() => openModal('lesson', 'create', subUnit.id)} className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors">+ Lesson</button>
                                                                                                    </div>
                                                                                                </div>

                                                                                                {/* ── LESSONS LIST ── */}
                                                                                                {isSubUnitOpen && (
                                                                                                    <div className="pl-8 py-1 bg-white divide-y divide-gray-50">
                                                                                                        {(!subUnit.lessons || subUnit.lessons.length === 0) && (
                                                                                                            <div className="px-4 py-2.5 text-xs text-gray-400">No lessons added yet.</div>
                                                                                                        )}
                                                                                                        {subUnit.lessons?.map(lesson => (
                                                                                                            <div key={lesson.id} className="flex items-center justify-between px-4 py-2.5 group hover:bg-gray-50 transition-colors rounded-md">
                                                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                                                    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                                                    </svg>
                                                                                                                    <span className="text-sm text-gray-700 truncate">{lesson.title}</span>
                                                                                                                    {!lesson.is_published && (
                                                                                                                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase flex-shrink-0">Draft</span>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-3 flex-shrink-0">
                                                                                                                    <button
                                                                                                                        onClick={() => openModal('lesson', 'edit', null, lesson)}
                                                                                                                        className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                                                                                                                    >
                                                                                                                        Rename
                                                                                                                    </button>
                                                                                                                    <button
                                                                                                                        onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                                                                                                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                                                                                                                    >
                                                                                                                        Build Content →
                                                                                                                    </button>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>

            {/* ══════════════════════════════════════════
                CREATE / EDIT MODAL
            ══════════════════════════════════════════ */}
            {modal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-base font-bold text-gray-900">
                                {modal.mode === 'create' ? 'Create' : 'Edit'} {typeLabel[modal.type] || modal.type}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                {modal.type !== 'assign_class_teacher' && modal.type !== 'assign_subject_teachers' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {modal.type === 'subject' ? 'Subject Name' : 'Title'}
                                        </label>
                                        <input
                                            type="text" required autoFocus
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-school-primary/30 focus:border-school-primary outline-none transition-all text-sm"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            placeholder={`Enter ${typeLabel[modal.type]?.toLowerCase() || 'title'}…`}
                                        />
                                    </div>
                                )}

                                {/* Class Teacher Assignment */}
                                {modal.type === 'assign_class_teacher' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Select Class Teacher
                                        </label>
                                        <select
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-school-primary/30 focus:border-school-primary outline-none bg-white text-sm"
                                            value={form.teacher_id}
                                            onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                                        >
                                            <option value="">— Unassigned —</option>
                                            {staff.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {member.name} ({member.role.replace('_', ' ')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Subject Teachers Assignment */}
                                {modal.type === 'assign_subject_teachers' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Select Subject Teachers
                                        </label>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {staff.map(member => (
                                                <label key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-school-primary rounded border-gray-300 focus:ring-school-primary/30"
                                                        checked={form.teacher_ids.includes(member.id)}
                                                        onChange={e => {
                                                            const ids = e.target.checked
                                                                ? [...form.teacher_ids, member.id]
                                                                : form.teacher_ids.filter(id => id !== member.id);
                                                            setForm({ ...form, teacher_ids: ids });
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{member.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{member.role.replace('_', ' ')}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Class (Academic Level) selector — only when creating a Subject */}
                                {modal.type === 'subject' && modal.mode === 'create' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Assign to Class
                                        </label>
                                        <select
                                            required
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-school-primary/30 focus:border-school-primary outline-none bg-white text-sm"
                                            value={form.academic_level_id}
                                            onChange={e => setForm({ ...form, academic_level_id: e.target.value })}
                                        >
                                            <option value="">— Select a class —</option>
                                            {academicLevels.map(lvl => (
                                                <option key={lvl.id} value={lvl.id}>
                                                    {lvl.name}{lvl.curriculum?.name ? ` (${lvl.curriculum.name})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isSaving}>
                                    {modal.mode === 'create' ? 'Create' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
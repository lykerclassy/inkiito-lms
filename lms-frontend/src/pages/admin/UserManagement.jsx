import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EnrollmentIndicator from '../../components/common/EnrollmentIndicator';
import { useNotification } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function UserManagement() {
    const { user: currentUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('students');
    const [searchQuery, setSearchQuery] = useState('');
    const { showNotification, askConfirmation } = useNotification();

    // Database State
    const [users, setUsers] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]); // Needed for the "Add Subject" dropdown
    const [academicLevels, setAcademicLevels] = useState([]);
    const [curriculums, setCurriculums] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Add User Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addError, setAddError] = useState('');

    // Edit User Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editError, setEditError] = useState('');

    // Import CSV State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [importRole, setImportRole] = useState('student');

    // Form Data State
    const initialFormState = {
        name: '', role: 'student', email: '', password: '',
        admission_number: '', curriculum_id: '', academic_level_id: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    // Enrollment Modal State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingEnrollments, setEditingEnrollments] = useState([]);
    const [isSavingEnrollments, setIsSavingEnrollments] = useState(false);
    const [subjectToAdd, setSubjectToAdd] = useState('');

    const fetchData = async () => {
        try {
            const [usersRes, subjectsRes, levelsRes, curriculumsRes] = await Promise.all([
                api.get('users'),
                api.get('subjects'),
                api.get('academic-levels'),
                api.get('settings/curriculums') // Assuming this endpoint exists, or adjust as needed
            ]);
            setUsers(usersRes.data);
            setAllSubjects(subjectsRes.data);
            setAcademicLevels(levelsRes.data);
            
            // If settings/curriculums doesn't exist yet, we can extract from academicLevels or fetch separately
            // For now, let's assume we need an endpoint for it or we can derive it
            if (curriculumsRes) {
                setCurriculums(curriculumsRes.data);
            } else {
                // Fallback: derive from academic levels
                const uniqueCurriculums = [];
                const seenIds = new Set();
                levelsRes.data.forEach(lvl => {
                    if (lvl.curriculum && !seenIds.has(lvl.curriculum.id)) {
                        uniqueCurriculums.push(lvl.curriculum);
                        seenIds.add(lvl.curriculum.id);
                    }
                });
                setCurriculums(uniqueCurriculums);
            }

            // Set default IDs if not set ONLY if adding a new user and we have data
            if (levelsRes.data.length > 0 && !formData.academic_level_id) {
                // Do not auto-set if we are already editing or have interaction
            }

        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Could not load database. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ENROLLMENT MODAL LOGIC ---

    const openEnrollmentModal = (student) => {
        setSelectedStudent(student);
        // Map the database relationships into a flat, editable array for the modal
        const currentEnrollments = (student.subjects || []).map(sub => ({
            subject_id: sub.id,
            name: sub.name,
            status: sub.pivot.status
        }));
        setEditingEnrollments(currentEnrollments);
        setSubjectToAdd('');
    };

    const handleStatusChange = (subjectId, newStatus) => {
        setEditingEnrollments(prev => prev.map(env =>
            env.subject_id === subjectId ? { ...env, status: newStatus } : env
        ));
    };

    const handleRemoveSubject = (subjectId) => {
        setEditingEnrollments(prev => prev.filter(env => env.subject_id !== subjectId));
    };

    const handleAddSubject = () => {
        if (!subjectToAdd) return;
        const subject = allSubjects.find(s => s.id === parseInt(subjectToAdd));
        if (subject && !editingEnrollments.find(e => e.subject_id === subject.id)) {
            setEditingEnrollments([...editingEnrollments, {
                subject_id: subject.id,
                name: subject.name,
                status: 'active' // Default status when adding a new subject
            }]);
        }
        setSubjectToAdd('');
    };

    const saveEnrollments = async () => {
        setIsSavingEnrollments(true);
        try {
            // Convert the array into the exact Object format Laravel's sync() method expects
            // e.g., { 1: {status: 'active'}, 3: {status: 'dropped'} }
            const formattedData = {};
            editingEnrollments.forEach(e => {
                formattedData[e.subject_id] = { status: e.status };
            });

            await api.put(`users/${selectedStudent.id}/enrollments`, {
                enrollments: formattedData
            });

            // Refresh background data to show updated ticks
            await fetchData();
            setSelectedStudent(null);
            showNotification("Enrollments successfully updated!", "success");
        } catch (err) {
            console.error(err);
            showNotification("Failed to save enrollments.", "error");
        } finally {
            setIsSavingEnrollments(false);
        }
    };

    // --- CREATE USER LOGIC ---

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAddError('');

        try {
            const response = await api.post('users', formData);
            await fetchData();
            setIsAddModalOpen(false);
            setFormData(initialFormState);

            if (formData.role === 'student') {
                const newStudent = response.data.user;
                showNotification(`SUCCESS! Student Created.\n\nName: ${newStudent.name}\nAdmission Number: ${newStudent.admission_number}\nACCESS KEY: ${newStudent.access_key || 'N/A'}\n\nPlease copy this Access Key for the student.`, "success", "Student Onboarded");
            } else {
                showNotification(`SUCCESS! Staff member created successfully.`, "success");
            }
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to create user. Ensure emails or admission numbers are unique.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        setEditError('');

        try {
            await api.put(`users/${editingUser.id}`, formData);
            await fetchData();
            setIsEditModalOpen(false);
            showNotification("User updated successfully!", "success");
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmed = await askConfirmation("This will permanently delete this user and all their records (grades, etc). This cannot be undone.", "Delete Account?");
        if (!confirmed) return;

        try {
            await api.delete(`users/${userId}`);
            await fetchData();
            showNotification("User deleted successfully.", "success");
        } catch (err) {
            showNotification(err.response?.data?.message || "Failed to delete user.", "error");
        }
    };

    const handleImportCSV = async (e) => {
        e.preventDefault();
        if (!importFile) return;

        setIsImporting(true);
        setImportError('');

        const data = new FormData();
        data.append('file', importFile);
        data.append('role', importRole);

        try {
            const res = await api.post('users/import-csv', data, {
                headers: { 'Content-Type': undefined }
            });
            await fetchData();
            setIsImportModalOpen(false);
            setImportFile(null);
            showNotification(res.data.message, "success", "Import Complete");
        } catch (err) {
            setImportError(err.response?.data?.message || 'Import failed. Check CSV format.');
        } finally {
            setIsImporting(false);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name || '',
            role: user.role || 'student',
            email: user.email || '',
            admission_number: user.admission_number || '',
            curriculum_id: user.curriculum_id?.toString() || '',
            academic_level_id: user.academic_level_id?.toString() || '',
            password: '', // Leave clear
            access_key: user.access_key || ''
        });
        setIsEditModalOpen(true);
    };

    // --- HELPER FORMATTING ---
    const formatRole = (role) => {
        const roles = {
            student: 'Student',
            teacher: 'Teacher',
            class_teacher: 'Class Teacher',
            dos: 'Director of Studies (DOS)',
            deputy_principal: 'Deputy Principal',
            principal: 'Principal',
            developer: 'Developer',
            admin: 'System Admin'
        };
        return roles[role] || role;
    };

    // Filters
    const filteredUsers = users.filter(user => {
        // Show students in Student tab, and ALL other roles in Staff tab
        const matchesTab = activeTab === 'students' ? user.role === 'student' : user.role !== 'student';
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.admission_number && user.admission_number.toLowerCase().includes(searchLower));
        return matchesTab && matchesSearch;
    });

    // Compute which subjects the student is NOT currently enrolled in for the dropdown
    const availableToAdd = allSubjects.filter(sub =>
        !editingEnrollments.some(env => env.subject_id === sub.id)
    );

    if (isLoading) return <div className="p-4 text-gray-500 font-medium">Loading user database...</div>;
    if (error) return <div className="p-4 text-red-500 font-medium">{error}</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto relative">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage staff access and student enrollments across frameworks.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>Import CSV</Button>
                    <Button variant="primary" onClick={() => {
                        setFormData(initialFormState);
                        setIsAddModalOpen(true);
                    }}>
                        + Add New User
                    </Button>
                </div>
            </div>

            <Card noPadding={true} className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('students')} className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Students</button>
                        <button onClick={() => setActiveTab('staff')} className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Staff & Admins</button>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 uppercase  text-xs">
                            <tr>
                                {activeTab === 'students' ? (
                                    <>
                                        <th className="px-6 py-4">Name & Adm No</th>
                                        <th className="px-6 py-4">Access Key</th>
                                        <th className="px-6 py-4">Curriculum</th>
                                        <th className="px-6 py-4">Level</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4">Name & Email</th>
                                        <th className="px-6 py-4">System Role</th>
                                        <th className="px-6 py-4">Status</th>
                                    </>
                                )}
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        {activeTab === 'students' ? (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                                    <div className="text-gray-500 text-xs mt-0.5">{user.admission_number || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-200 text-xs font-bold">{user.access_key || '------'}</span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">{user.curriculum?.name || 'Unassigned'}</td>
                                                <td className="px-6 py-4">{user.academic_level?.name || 'Unassigned'}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="font-semibold text-gray-900">{user.name}</div>
                                                    <div className="text-gray-500 text-xs mt-0.5">{user.email || 'No email provided'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase  ${['admin', 'developer'].includes(user.role) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {formatRole(user.role)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-green-600 font-medium text-sm">Active</td>
                                            </>
                                        )}
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            {activeTab === 'students' && (
                                                <Button size="sm" variant="outline" onClick={() => openEnrollmentModal(user)}>
                                                    Enrollments
                                                </Button>
                                            )}
                                            {/* Restrict DOS from editing/deleting administrative roles */}
                                            {!(currentUser?.role === 'dos' && ['admin', 'principal', 'deputy_principal', 'dos', 'developer'].includes(user.role)) && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-1 px-3 text-blue-600 hover:bg-blue-50 rounded border border-blue-100 font-medium transition-colors text-xs uppercase"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1 px-3 text-red-500 hover:bg-red-50 rounded border border-red-100 font-medium transition-colors text-xs uppercase"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* === ADD NEW USER MODAL === */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser}>
                            <div className="p-6 space-y-4">
                                {addError && <div className="p-3 bg-red-50 text-red-700 rounded text-sm border border-red-100">{addError}</div>}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                                    <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <optgroup label="Learners">
                                            <option value="student">Student</option>
                                        </optgroup>
                                        <optgroup label="Teaching Staff">
                                            <option value="teacher">Teacher</option>
                                            <option value="class_teacher">Class Teacher</option>
                                            <option value="dos">Director of Studies (DOS)</option>
                                        </optgroup>
                                        {currentUser?.role !== 'dos' && (
                                            <optgroup label="Administration">
                                                <option value="deputy_principal">Deputy Principal</option>
                                                <option value="principal">Principal</option>
                                                <option value="admin">System Admin</option>
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Jane Doe" />
                                </div>
                                {formData.role === 'student' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
                                            <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none uppercase focus:ring-2 focus:ring-blue-500" value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value.toUpperCase() })} placeholder="e.g. IM-2026-001" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum</label>
                                                <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={formData.curriculum_id} onChange={(e) => setFormData({ ...formData, curriculum_id: e.target.value })}>
                                                    <option value="">Select Curriculum</option>
                                                    {curriculums.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                                <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={formData.academic_level_id} onChange={(e) => setFormData({ ...formData, academic_level_id: e.target.value })}>
                                                    <option value="">Select Level</option>
                                                    {academicLevels
                                                        .filter(lvl => !formData.curriculum_id || lvl.curriculum_id.toString() === formData.curriculum_id.toString())
                                                        .map(lvl => (
                                                            <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input type="email" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="staff@inkiito.edu" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                                            <input type="text" required minLength="6" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min. 6 characters" />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isSubmitting}>Create User</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === EDIT USER MODAL === */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Edit User Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {editError && <div className="p-3 bg-red-50 text-red-700 rounded text-sm border border-red-100">{editError}</div>}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">User Role</label>
                                    <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <optgroup label="Learners">
                                            <option value="student">Student</option>
                                        </optgroup>
                                        <optgroup label="Staff">
                                            <option value="teacher">Teacher</option>
                                            <option value="class_teacher">Class Teacher</option>
                                            <option value="dos">Director of Studies</option>
                                            {currentUser?.role !== 'dos' && (
                                                <option value="admin">System Admin</option>
                                            )}
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
                                    <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                {formData.role === 'student' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Admission Number</label>
                                            <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none uppercase focus:ring-2 focus:ring-blue-500" value={formData.admission_number} onChange={(e) => setFormData({ ...formData, admission_number: e.target.value.toUpperCase() })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Access Key (Visible to Student)</label>
                                            <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none uppercase bg-gray-50 font-bold" value={formData.access_key} onChange={(e) => setFormData({ ...formData, access_key: e.target.value.toUpperCase() })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Curriculum</label>
                                                <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={formData.curriculum_id} onChange={(e) => setFormData({ ...formData, curriculum_id: e.target.value })}>
                                                    {curriculums.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Level</label>
                                                <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-blue-500" value={formData.academic_level_id} onChange={(e) => setFormData({ ...formData, academic_level_id: e.target.value })}>
                                                    {academicLevels
                                                        .filter(lvl => !formData.curriculum_id || lvl.curriculum_id.toString() === formData.curriculum_id.toString())
                                                        .map(lvl => (
                                                            <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
                                            <input type="email" required className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">New Password (Leave blank to keep current)</label>
                                            <input type="password" minLength="6" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isUpdating}>Save Update</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === IMPORT CSV MODAL === */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Bulk User Import</h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleImportCSV}>
                            <div className="p-6 space-y-4">
                                {importError && <div className="p-3 bg-red-50 text-red-700 rounded text-sm border border-red-100">{importError}</div>}

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-700 space-y-2">
                                    <p className="font-bold">CSV Required Columns:</p>
                                    <p>Students: <code className="bg-white px-1">name, admission_number, curriculum_id, academic_level_id</code></p>
                                    <p>Staff: <code className="bg-white px-1">name, email, password</code></p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Import Type</label>
                                    <select className="w-full p-2.5 border border-gray-300 rounded-lg outline-none bg-white font-medium" value={importRole} onChange={(e) => setImportRole(e.target.value)}>
                                        <option value="student">Students</option>
                                        <option value="teacher">Teachers / Staff</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Select CSV File</label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                        onChange={(e) => setImportFile(e.target.files[0])}
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" isLoading={isImporting}>Start Import</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* === STUDENT ENROLLMENT MODAL === */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Subject Enrollments</h3>
                                <p className="text-sm text-gray-500">{selectedStudent.name} • {selectedStudent.admission_number}</p>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

                            {/* Render Existing Enrollments */}
                            <div className="space-y-2">
                                {editingEnrollments.length > 0 ? (
                                    editingEnrollments.map((env) => (
                                        <div key={env.subject_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                                            <div className="flex items-center gap-3">
                                                <EnrollmentIndicator status={env.status} />
                                                <span className={`font-medium ${env.status === 'dropped' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {env.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="text-sm border border-gray-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                    value={env.status}
                                                    onChange={(e) => handleStatusChange(env.subject_id, e.target.value)}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="dropped">Dropped</option>
                                                </select>
                                                <button onClick={() => handleRemoveSubject(env.subject_id)} className="text-red-500 hover:text-red-700 p-1" title="Remove Subject">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 text-center">
                                        No subjects assigned yet.
                                    </div>
                                )}
                            </div>

                            {/* Add New Subject Dropdown */}
                            {availableToAdd.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                    <select
                                        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={subjectToAdd}
                                        onChange={(e) => setSubjectToAdd(e.target.value)}
                                    >
                                        <option value="" disabled>Select subject to enroll...</option>
                                        {availableToAdd.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                    <Button variant="outline" onClick={handleAddSubject} disabled={!subjectToAdd}>
                                        Add
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setSelectedStudent(null)}>Cancel</Button>
                            <Button variant="primary" onClick={saveEnrollments} isLoading={isSavingEnrollments}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
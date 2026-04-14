import React from 'react';
import api from '../../services/api';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import PageLoader from '../../components/common/PageLoader';
import Card from '../../components/common/Card';

// Professional PDF generation using jsPDF and AutoTable
// Note: If you encounter an error "Cannot find module 'jspdf-autotable'", please run:
// npm install jspdf jspdf-autotable
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AttendanceReport() {
    const [reportData, setReportData] = React.useState([]);
    const [startDate, setStartDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
    const [reportType, setReportType] = React.useState('daily');
    const [isLoading, setIsLoading] = React.useState(true);
    
    const [academicLevels, setAcademicLevels] = React.useState([]);
    const [curriculums, setCurriculums] = React.useState([]);
    const [selectedLevel, setSelectedLevel] = React.useState('');
    const [selectedCurriculum, setSelectedCurriculum] = React.useState('');
    
    const [stats, setStats] = React.useState({ total_school_days: 1 });

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/attendance`, {
                params: { 
                    start_date: startDate, 
                    end_date: endDate,
                    academic_level_id: selectedLevel,
                    curriculum_id: selectedCurriculum
                }
            });
            setReportData(res.data.report);
            setStats({ total_school_days: res.data.total_school_days });
            if (res.data.academic_levels) setAcademicLevels(res.data.academic_levels);
            if (res.data.curriculums) setCurriculums(res.data.curriculums);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchReport();
    }, [startDate, endDate, selectedLevel, selectedCurriculum]);

    const handleQuickFilter = (type) => {
        setReportType(type);
        const today = new Date();
        if (type === 'daily') {
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (type === 'weekly') {
            setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        } else if (type === 'monthly') {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
            setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        }
    };

    const generateNicePDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Report Branding & Colors
        const primaryColor = [79, 70, 229]; // Indigo-600
        const grayColor = [107, 114, 128]; // Gray-500
        
        // 1. Header Section
        doc.setFontSize(22);
        doc.setTextColor(31, 41, 55); // Gray-900
        doc.setFont('helvetica', 'bold');
        doc.text('Attendance Analytics Report', 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 14, 28);
        
        // 2. Report Details Line
        doc.setDrawColor(243, 244, 246); // Gray-100
        doc.setLineWidth(0.5);
        doc.line(14, 32, 283, 32);
        
        doc.setFontSize(11);
        doc.setTextColor(55, 65, 81); // Gray-700
        doc.setFont('helvetica', 'bold');
        doc.text('Date Coverage:', 14, 40);
        doc.setFont('helvetica', 'normal');
        doc.text(`${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 48, 40);
        
        const filterText = (selectedLevel ? `Level: ${academicLevels.find(l => l.id == selectedLevel)?.name} | ` : '') + 
                          (selectedCurriculum ? `Curriculum: ${curriculums.find(c => c.id == selectedCurriculum)?.name}` : 'All Curricula/Levels');
        doc.text(filterText, 14, 46);
        
        // 3. Quick Stats Cards in PDF
        const totalStudents = reportData.length;
        const avgAttendance = reportData.length > 0 
            ? Math.round(reportData.reduce((acc, curr) => acc + (curr.days_present / stats.total_school_days) * 100, 0) / reportData.length)
            : 0;

        doc.setFillColor(249, 250, 251); // Gray-50
        doc.roundedRect(14, 52, 60, 15, 2, 2, 'F');
        doc.setFontSize(8);
        doc.text('TOTAL STUDENTS', 18, 57);
        doc.setFontSize(12);
        doc.text(`${totalStudents}`, 18, 63);

        doc.setFillColor(240, 253, 244); // Green-50
        doc.roundedRect(80, 52, 60, 15, 2, 2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(21, 128, 61); // Green-700
        doc.text('AVG ATTENDANCE', 84, 57);
        doc.setFontSize(12);
        doc.text(`${avgAttendance}%`, 84, 63);
        
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]); // Reset

        // 4. Detailed Registry Table
        const tableColumn = ["Student Registry", "Admission #"];
        if (stats.total_school_days === 1) {
            tableColumn.push("Status");
        } else {
            tableColumn.push("Days Present", "Days Absent", "Consistency");
        }

        const tableRows = reportData.map(student => {
            const perc = Math.round((student.days_present / stats.total_school_days) * 100) || 0;
            const data = [student.name, student.admission_number || '---'];
            if (stats.total_school_days === 1) {
                data.push(student.present_today ? "PRESENT" : "ABSENT");
            } else {
                data.push(student.days_present, student.days_absent, `${perc}%`);
            }
            return data;
        });

        autoTable(doc, {
            startY: 75,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'left'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [55, 65, 81],
                cellPadding: 4
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                // Colorize consistency column or status
                if (data.section === 'body' && data.column.index === tableColumn.length - 1) {
                    const val = data.cell.raw;
                    if (val === 'ABSENT' || (typeof val === 'string' && val.includes('%') && parseInt(val) < 75)) {
                        data.cell.styles.textColor = [220, 38, 38]; // Red-600
                        data.cell.styles.fontStyle = 'bold';
                    } else if (val === 'PRESENT' || (typeof val === 'string' && val.includes('%') && parseInt(val) >= 85)) {
                        data.cell.styles.textColor = [16, 185, 129]; // Emerald-500
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        // 5. Footer Page Numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
            doc.text(`Inkiito Manoh Senior School - Page ${i} of ${pageCount}`, 14, 203);
            doc.text('System Generated Professional Registry', 240, 203);
        }

        doc.save(`Attendance_Report_${format(new Date(startDate), 'yyyy-MM-dd')}.pdf`);
    };

    // Calculate aggregate stats for the current view
    const aggregateStats = {
        totalStudents: reportData.length,
        avgAttendance: reportData.length > 0 
            ? Math.round(reportData.reduce((acc, curr) => acc + (curr.days_present / stats.total_school_days) * 100, 0) / reportData.length)
            : 0,
        presentToday: reportData.filter(s => s.present_today).length,
        atRisk: reportData.filter(s => (s.days_present / stats.total_school_days) < 0.75).length
    };

    if (isLoading && academicLevels.length === 0) return <PageLoader message="Generating Analytics..." color="indigo" />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-8">
            {/* Header & Main Controls */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 print:hidden">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Attendance Analytics</h1>
                            <p className="text-gray-500 text-xs md:text-sm font-semibold tracking-wide">Detailed tracking across all categories & curricula</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <button
                        onClick={generateNicePDF}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Nice PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Native Print
                    </button>
                </div>
            </header>

            {/* Filter Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2">
                    <select 
                        value={selectedCurriculum} 
                        onChange={(e) => setSelectedCurriculum(e.target.value)}
                        className="w-full p-3 bg-transparent border-none text-xs font-black uppercase text-gray-700 focus:ring-0 outline-none"
                    >
                        <option value="">All Curricula</option>
                        {curriculums.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2">
                    <select 
                        value={selectedLevel} 
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="w-full p-3 bg-transparent border-none text-xs font-black uppercase text-gray-700 focus:ring-0 outline-none"
                    >
                        <option value="">All Academic Levels</option>
                        {academicLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col sm:flex-row items-center px-4 gap-3 sm:gap-0">
                    <div className="flex bg-gray-50 border border-gray-100 rounded-xl p-1 shrink-0 sm:mr-4 w-full sm:w-auto">
                        <button onClick={() => handleQuickFilter('daily')} className={`flex-1 sm:px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${reportType === 'daily' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Day</button>
                        <button onClick={() => handleQuickFilter('weekly')} className={`flex-1 sm:px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${reportType === 'weekly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Week</button>
                        <button onClick={() => handleQuickFilter('monthly')} className={`flex-1 sm:px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${reportType === 'monthly' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Month</button>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 w-full mb-2 sm:mb-0">
                        <input type="date" value={startDate} onChange={(e) => {setStartDate(e.target.value); setReportType('custom');}} className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-xs font-bold text-gray-900 w-full outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        <span className="text-gray-300 font-bold">-</span>
                        <input type="date" value={endDate} onChange={(e) => {setEndDate(e.target.value); setReportType('custom');}} className="bg-gray-50 border border-gray-100 rounded-xl p-2 text-xs font-bold text-gray-900 w-full outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <Card className="hover:border-indigo-100 transition-all cursor-default">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Students</p>
                    <p className="text-2xl font-black text-gray-900">{aggregateStats.totalStudents}</p>
                </Card>
                <Card className="hover:border-green-100 transition-all cursor-default">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg Attendance</p>
                    <p className="text-2xl font-black text-green-600">{aggregateStats.avgAttendance}%</p>
                </Card>
                <Card className="hover:border-blue-100 transition-all cursor-default">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Present Today</p>
                    <p className="text-2xl font-black text-blue-600">{aggregateStats.presentToday}</p>
                </Card>
                <Card className="hover:border-red-100 transition-all cursor-default">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Below Target</p>
                    <p className="text-2xl font-black text-red-600">{aggregateStats.atRisk}</p>
                </Card>
            </div>

            {/* Main Report Table Container */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
                <div>
                    <div className="p-8 md:p-10 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">Attendance Registry</h2>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                Coverage: {format(new Date(startDate), 'MMMM dd, yyyy')} — {format(new Date(endDate), 'MMMM dd, yyyy')}
                            </p>
                        </div>
                        <div className="px-5 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total School Days:</span>
                            <span className="ml-2 text-indigo-600 font-black">{stats.total_school_days}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black border-b border-gray-100">
                                    <th className="p-6 pl-10">Student Identity</th>
                                    <th className="p-6">Admission #</th>
                                    {stats.total_school_days === 1 ? (
                                        <th className="p-6 text-center">Current Status</th>
                                    ) : (
                                        <>
                                            <th className="p-6 text-center">Days Present</th>
                                            <th className="p-6 text-center">Days Absent</th>
                                            <th className="p-6 text-center">Consistency</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Records...</td></tr>
                                ) : reportData.length === 0 ? (
                                    <tr><td colSpan="6" className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records available for this group.</td></tr>
                                ) : (
                                    reportData.map((student) => {
                                        const perc = Math.round((student.days_present / stats.total_school_days) * 100) || 0;
                                        return (
                                            <tr key={student.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                                <td className="p-6 pl-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-black text-gray-900 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{student.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{student.academic_level || 'General Student'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-bold text-gray-500 uppercase tracking-widest text-[10px]">{student.admission_number || '---'}</td>
                                                
                                                {stats.total_school_days === 1 ? (
                                                    <td className="p-6 text-center">
                                                        {student.present_today ? (
                                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                Present
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100 shadow-sm shadow-rose-100/50">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                                                Absent
                                                            </span>
                                                        )}
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="p-6 text-center font-black text-indigo-600 text-lg">{student.days_present}</td>
                                                        <td className="p-6 text-center font-black text-gray-300 text-lg">{student.days_absent}</td>
                                                        <td className="p-6">
                                                            <div className="flex flex-col items-center gap-1.5">
                                                                <div className="text-[11px] font-black text-gray-900">{perc}%</div>
                                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${perc >= 85 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : perc >= 70 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                                                                        style={{ width: `${perc}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .rounded-\\[40px\\] { border-radius: 0 !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}} />
        </div>
    );
}

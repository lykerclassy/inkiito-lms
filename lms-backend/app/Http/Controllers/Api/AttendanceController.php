<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    /**
     * Get attendance reports based on filters (daily, weekly, monthly, specific date range)
     */
    public function index(Request $request)
    {
        // Require management roles or teachers
        $user = $request->user();
        if ($user->role === 'student') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $startDate = $request->query('start_date', Carbon::today()->toDateString());
        $endDate = $request->query('end_date', Carbon::today()->toDateString());
        $levelId = $request->query('academic_level_id');
        $curriculumId = $request->query('curriculum_id');
        
        $query = User::where('role', 'student')->orderBy('name');
        
        if ($levelId) {
            $query->where('academic_level_id', $levelId);
        }
        
        if ($curriculumId) {
            $query->where('curriculum_id', $curriculumId);
        }

        $students = $query->get(['id', 'name', 'admission_number', 'academic_level_id']);
            
        // Fetch all attendance records inside the date window for students
        $attendances = Attendance::whereBetween('date', [$startDate, $endDate])
            ->get(['id', 'user_id', 'date']);
            
        // Group attendances by user_id
        $groupedAttendances = $attendances->groupBy('user_id');
        
        // Calculate total days in range
        $diffInDays = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;

        $report = $students->map(function($student) use ($groupedAttendances, $diffInDays, $startDate) {
            $studentAttendances = $groupedAttendances->get($student->id, collect());
            
            // Present dates count
            $daysPresent = $studentAttendances->unique('date')->count();
            
            return [
                'id' => $student->id,
                'name' => $student->name,
                'admission_number' => $student->admission_number ?? 'N/A',
                'academic_level_id' => $student->academic_level_id,
                'days_present' => $daysPresent,
                'days_absent' => max(0, $diffInDays - $daysPresent),
                'total_days' => $diffInDays,
                // Helpful shortcut for daily view
                'present_today' => $studentAttendances->contains('date', $startDate),
            ];
        });

        return response()->json([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_school_days' => $diffInDays,
            'report' => $report,
            'academic_levels' => \App\Models\AcademicLevel::all(),
            'curriculums' => \App\Models\Curriculum::all()
        ]);
    }
}

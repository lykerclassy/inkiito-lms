<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TypingScoreController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\HardwareItemController;
use App\Http\Controllers\Api\ScienceLabController;

// TEMPORARY: Emergency Developer Injection
// Access this via browser: https://backend.inkiitomanohseniorschool.co.ke/api/inject-dev
Route::get('/inject-dev', function () {
    $user = \App\Models\User::updateOrCreate(
        ['email' => 'developer@inkiitomanoh.com'],
        [
            'name' => 'System Developer',
            'password' => \Illuminate\Support\Facades\Hash::make('Developer2026!'),
            'role' => 'developer',
        ]
    );
    return response()->json([
        'message' => 'Developer user ready!',
        'email' => $user->email,
        'password' => 'Developer2026!'
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

// Public Branding & Settings (For Login Page)
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/branding', function() {
    try {
        $primary = \App\Models\Setting::where('key', 'brand_primary')->first()?->value ?? '#d81d22';
        $secondary = \App\Models\Setting::where('key', 'brand_secondary')->first()?->value ?? '#4b4da3';
        $accent = \App\Models\Setting::where('key', 'brand_accent')->first()?->value ?? '#f8af18';
        
        return response()->json([
            'brand_primary' => $primary,
            'brand_secondary' => $secondary,
            'brand_accent' => $accent,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'brand_primary' => '#d81d22',
            'brand_secondary' => '#4b4da3',
            'brand_accent' => '#f8af18',
        ]);
    }
});


Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [\App\Http\Controllers\Api\DashboardController::class, 'index']);

    // --- CURRICULUM MANAGER (All Staff can view; All staff can build content for their subjects) ---
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{id}', [SubjectController::class, 'show']);
    Route::get('/academic-levels', [SubjectController::class, 'academicLevels']);
    Route::get('/staff-list', [UserController::class, 'getStaff']);

    // Subject/Unit CREATION restricted to management (they define the structure)
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin,developer,principal,deputy_principal,dos')->group(function () {
        Route::post('/subjects', [SubjectController::class, 'store']);
        Route::post('/units', [SubjectController::class, 'storeUnit']);
        Route::put('/units/{id}', [SubjectController::class, 'updateUnit']);
        Route::post('/subunits', [SubjectController::class, 'storeSubUnit']);
        Route::put('/subunits/{id}', [SubjectController::class, 'updateSubUnit']);
        
        // NEW: Teacher Assignments
        Route::put('/academic-levels/{id}/teacher', [SubjectController::class, 'assignClassTeacher']);
        Route::put('/subjects/{id}/teachers', [SubjectController::class, 'assignSubjectTeachers']);
    });

    // --- LESSON BUILDER (All Staff — Teachers fill in lesson content) ---
    Route::get('/lessons/{id}', [LessonController::class, 'show']);
    Route::post('/lessons', [LessonController::class, 'store']);
    Route::put('/lessons/{id}', [LessonController::class, 'update']);
    Route::post('/lessons/{id}/blocks', [LessonController::class, 'updateBlocks']);
    Route::post('/lessons/{id}/complete', [LessonController::class, 'complete']);

    // --- USER MANAGEMENT (Management Only) ---
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin,developer,principal,deputy_principal,dos')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/import-csv', [UserController::class, 'importCSV']);
        Route::put('/users/{id}/enrollments', [UserController::class, 'updateEnrollments']);
    });
    Route::post('/user/profile', [UserController::class, 'updateProfile']); // Own profile — all users

    // --- QUIZZES ---
    Route::post('/quizzes/submit', [QuizController::class, 'submitAnswer']);
    Route::get('/student/grades', [QuizController::class, 'myGrades']);
    
    // --- ASSIGNMENTS & SUBMISSIONS (All Staff can create/grade) ---
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments', [AssignmentController::class, 'store']);
    Route::put('/assignments/{id}', [AssignmentController::class, 'update']);
    Route::post('/assignments/{id}/update-content', [AssignmentController::class, 'updateContent']);
    Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);
    Route::get('/assignments/{id}/submissions', [AssignmentController::class, 'getSubmissions']);
    Route::put('/submissions/{id}/grade', [AssignmentController::class, 'gradeSubmission']);
    
    // Student Routes
    Route::get('/student/assignments', [AssignmentController::class, 'studentAssignments']);
    Route::post('/assignments/{id}/submit', [AssignmentController::class, 'submitWork']);

    // --- SETTINGS (Admins & Developer Only) ---
    Route::middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin,developer')->group(function () {
        Route::get('/settings/curriculums', [SettingController::class, 'getCurriculums']);
        Route::post('/settings', [SettingController::class, 'update']);
    });

    // --- NOTIFICATIONS ---
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // --- TYPING TRACKER ---
    Route::get('/typing-scores', [TypingScoreController::class, 'index']);
    Route::post('/typing-scores', [TypingScoreController::class, 'store']);
    Route::get('/typing-leaderboard', [TypingScoreController::class, 'leaderboard']);

    // --- AI / INTELLIGENCE ---
    Route::get('/ai/vocabulary/generate', [AIController::class, 'generateVocabulary']);
    Route::post('/ai/vocabulary/mark-learned', [AIController::class, 'markLearned']);
    
    // --- STANDALONE QUIZZES ---
    // Staff/Admin Management
    Route::get('/admin/quizzes', [\App\Http\Controllers\Api\QuizManagementController::class, 'index']);
    Route::post('/admin/quizzes', [\App\Http\Controllers\Api\QuizManagementController::class, 'store']);
    Route::get('/admin/quizzes/{id}', [\App\Http\Controllers\Api\QuizManagementController::class, 'show']);
    Route::put('/admin/quizzes/{id}', [\App\Http\Controllers\Api\QuizManagementController::class, 'update']);
    Route::delete('/admin/quizzes/{id}', [\App\Http\Controllers\Api\QuizManagementController::class, 'destroy']);
    Route::post('/admin/quizzes/{id}/questions', [\App\Http\Controllers\Api\QuizManagementController::class, 'addQuestion']);
    Route::put('/admin/quiz-questions/{id}', [\App\Http\Controllers\Api\QuizManagementController::class, 'updateQuestion']);
    Route::delete('/admin/quiz-questions/{id}', [\App\Http\Controllers\Api\QuizManagementController::class, 'deleteQuestion']);

    // Student Routes
    Route::get('/student/quizzes', [\App\Http\Controllers\Api\StudentQuizController::class, 'index']);
    Route::get('/student/quizzes/{id}', [\App\Http\Controllers\Api\StudentQuizController::class, 'show']);
    Route::post('/student/quizzes/{id}/submit', [\App\Http\Controllers\Api\StudentQuizController::class, 'submit']);

    // Vocabulary Management (All Staff — Teachers can also manage vocab content)
    Route::get('/admin/vocabularies', [AIController::class, 'index']);
    Route::post('/admin/vocabularies', [AIController::class, 'store']);
    Route::get('/admin/ai-test', [AIController::class, 'testGemini']);
    Route::post('/admin/ai-replenish', [AIController::class, 'replenishPool']);
    Route::delete('/admin/vocabularies/{id}', [AIController::class, 'destroy']);

    // --- HARDWARE ITEMS (ICT LAB) — All Staff can view; management can edit ---
    Route::get('/hardware-items', [HardwareItemController::class, 'index']);
    Route::get('/admin/hardware-items', [HardwareItemController::class, 'adminIndex']);
    Route::post('/hardware-items', [HardwareItemController::class, 'store']);
    Route::get('/hardware-items/{id}', [HardwareItemController::class, 'show']);
    Route::put('/hardware-items/{id}', [HardwareItemController::class, 'update']);
    Route::delete('/hardware-items/{id}', [HardwareItemController::class, 'destroy']);
    
    // --- SCIENCE LABS (All Staff can create & manage experiments) ---
    Route::get('/science-labs', [ScienceLabController::class, 'index']);
    Route::get('/science-labs/curriculums', [ScienceLabController::class, 'getCurriculums']);
    Route::get('/science-labs/{id}', [ScienceLabController::class, 'show']);
    Route::post('/science-labs/experiments', [ScienceLabController::class, 'storeExperiment']);
    Route::put('/science-labs/experiments/{id}', [ScienceLabController::class, 'updateExperiment']);
    Route::delete('/science-labs/experiments/{id}', [ScienceLabController::class, 'destroyExperiment']);
    Route::patch('/science-labs/{id}/toggle-status', [ScienceLabController::class, 'toggleLabStatus']);
    Route::put('/science-labs/{id}/coordinator', [ScienceLabController::class, 'assignCoordinator']);
    
    // Lab Questions
    Route::post('/science-labs/{id}/ask', [ScienceLabController::class, 'askQuestion']);
    Route::get('/lab-questions', [ScienceLabController::class, 'getQuestions']);
    Route::post('/lab-questions/{id}/answer', [ScienceLabController::class, 'answerQuestion']);

    // --- CAREERS & PATHWAYS (All Staff — Teachers guide students) ---
    Route::get('/pathways', [\App\Http\Controllers\Api\CareerController::class, 'getPathways']);
    Route::post('/pathways', [\App\Http\Controllers\Api\CareerController::class, 'storePathway']);
    Route::put('/pathways/{id}', [\App\Http\Controllers\Api\CareerController::class, 'updatePathway']);
    Route::delete('/pathways/{id}', [\App\Http\Controllers\Api\CareerController::class, 'destroyPathway']);
    Route::get('/careers', [\App\Http\Controllers\Api\CareerController::class, 'index']);
    Route::post('/careers', [\App\Http\Controllers\Api\CareerController::class, 'store']);
    Route::put('/careers/{id}', [\App\Http\Controllers\Api\CareerController::class, 'update']);
    Route::delete('/careers/{id}', [\App\Http\Controllers\Api\CareerController::class, 'destroy']);
    Route::post('/careers/recommend', [\App\Http\Controllers\Api\CareerController::class, 'getRecommendedCareers']);
    Route::post('/careers/set-goal', [\App\Http\Controllers\Api\CareerController::class, 'setCareerGoal']);

    // --- GRADES & REPORTS (All Staff) ---
    Route::get('/admin/gradebook', [\App\Http\Controllers\Api\GradeController::class, 'index']);
    Route::get('/admin/gradebook/{userId}', [\App\Http\Controllers\Api\GradeController::class, 'show']);

    // --- DOWNLOADABLE RESOURCES (All Staff can manage resources) ---
    Route::get('/downloadables', [\App\Http\Controllers\Api\DownloadableController::class, 'index']);
    Route::get('/admin/downloadables', [\App\Http\Controllers\Api\DownloadableController::class, 'adminIndex']);
    Route::post('/admin/downloadables', [\App\Http\Controllers\Api\DownloadableController::class, 'store']);
    Route::delete('/admin/downloadables/{id}', [\App\Http\Controllers\Api\DownloadableController::class, 'destroy']);
});
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\AssignmentController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- CURRICULUM MANAGER ---
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/{id}', [SubjectController::class, 'show']);
    Route::post('/subjects', [SubjectController::class, 'store']);
    Route::post('/units', [SubjectController::class, 'storeUnit']);
    Route::put('/units/{id}', [SubjectController::class, 'updateUnit']);
    Route::post('/subunits', [SubjectController::class, 'storeSubUnit']);
    Route::put('/subunits/{id}', [SubjectController::class, 'updateSubUnit']);

    // --- LESSON BUILDER ---
    Route::get('/lessons/{id}', [LessonController::class, 'show']);
    Route::post('/lessons', [LessonController::class, 'store']);
    Route::put('/lessons/{id}', [LessonController::class, 'update']);
    Route::put('/lessons/{id}/blocks', [LessonController::class, 'updateBlocks']);

    // --- USER MANAGEMENT ---
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}/enrollments', [UserController::class, 'updateEnrollments']);

    // --- QUIZZES ---
    Route::post('/quizzes/submit', [QuizController::class, 'submitAnswer']);
    Route::get('/student/grades', [QuizController::class, 'myGrades']);
    
    // --- ASSIGNMENTS & SUBMISSIONS (UPGRADED) ---
    // Teacher Routes
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments', [AssignmentController::class, 'store']);
    Route::put('/assignments/{id}', [AssignmentController::class, 'update']);
    Route::put('/assignments/{id}/update-content', [AssignmentController::class, 'updateContent']); // The new block editor save
    Route::delete('/assignments/{id}', [AssignmentController::class, 'destroy']);
    Route::get('/assignments/{id}/submissions', [AssignmentController::class, 'getSubmissions']);
    Route::put('/submissions/{id}/grade', [AssignmentController::class, 'gradeSubmission']); // Handles Score & Feedback
    
    // Student Routes
    Route::get('/student/assignments', [AssignmentController::class, 'studentAssignments']);
    Route::post('/assignments/{id}/submit', [AssignmentController::class, 'submitWork']); // Submits JSON answers
    
});
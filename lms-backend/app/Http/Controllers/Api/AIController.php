<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AIController extends Controller
{
    /**
     * Fetch a word for the student.
     * Tries Gemini AI first. If it fails or key is missing, falls back to the local database pool.
     */
    public function generateVocabulary(Request $request)
    {
        $user = $request->user();
        $wordData = null;
        $apiKey = config('services.gemini.key');

        // --- Step 1: Always serve from the LOCAL DATABASE pool first ---
        // This prevents quota exhaustion by not calling AI on every request.
        // The database pool should always have words.

        // Get IDs of words the student has ALREADY mastered
        $masteredWordIds = \App\Models\Vocabulary::whereHas('users', function ($q) use ($user) {
            $q->where('user_id', $user->id)->whereNotNull('mastered_at');
        })->pluck('id');

        // Find a word from the pool they haven't seen recently or mastered
        $seenWordIds = \App\Models\Vocabulary::whereHas('users', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->pluck('id');

        // Prefer: unseen > seen but not mastered > anything at all
        $word = \App\Models\Vocabulary::whereNotIn('id', $seenWordIds)->inRandomOrder()->first()
            ?? \App\Models\Vocabulary::whereNotIn('id', $masteredWordIds)->inRandomOrder()->first()
            ?? \App\Models\Vocabulary::inRandomOrder()->first();

        if ($word) {
            $wordData = [
                'id' => $word->id,
                'word' => $word->word,
                'definition' => $word->definition,
                'phonetic' => $word->phonetic,
                'category' => $word->category,
                'is_ai_generated' => false
            ];
        }

        // --- Step 2: Smart Background Replenishment ---
        // Only call Gemini if: API key exists AND enough time has passed since last call.
        // This prevents burning the entire daily quota on a single student session.
        // We use the Laravel file cache to rate-limit calls (max 1 every 2 hours).
        $cacheKey = 'gemini_vocab_last_fetch';
        $lastFetch = \Illuminate\Support\Facades\Cache::get($cacheKey);
        $isLocked = \Illuminate\Support\Facades\Cache::get($cacheKey . '_lock');
        $shouldFetchFromAi = !empty($apiKey) && !$isLocked && (!$lastFetch || now()->diffInMinutes($lastFetch) >= 120);

        if ($shouldFetchFromAi) {
            // Mark that we're fetching now to prevent other requests triggering simultaneously
            \Illuminate\Support\Facades\Cache::put($cacheKey . '_lock', true, now()->addMinutes(2));

            try {
                // Fetch a small batch to enrich the pool (not to show directly)
                $batchData = $this->fetchFromGemini($apiKey, 3);

                if (!empty($batchData) && is_array($batchData)) {
                    $newlyAdded = null;
                    foreach ($batchData as $wd) {
                        if (isset($wd['word'])) {
                            $savedWord = \App\Models\Vocabulary::updateOrCreate(
                                ['word' => $wd['word']],
                                [
                                    'definition' => $wd['definition'] ?? '',
                                    'phonetic' => $wd['phonetic'] ?? '-',
                                    'category' => $wd['category'] ?? 'General',
                                    'difficulty' => 3
                                ]
                            );
                            if (!$newlyAdded) {
                                $newlyAdded = $savedWord;
                            }
                        }
                    }

                    // On success, update the last fetch timestamp to lock out for 2 hours
                    \Illuminate\Support\Facades\Cache::put($cacheKey, now(), now()->addHours(3));

                    // If the user has not seen this new word, serve it instead
                    if ($newlyAdded && !$seenWordIds->contains($newlyAdded->id)) {
                        $wordData = [
                            'id' => $newlyAdded->id,
                            'word' => $newlyAdded->word,
                            'definition' => $newlyAdded->definition,
                            'phonetic' => $newlyAdded->phonetic,
                            'category' => $newlyAdded->category,
                            'is_ai_generated' => true
                        ];
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Gemini AI Hub Error: " . $e->getMessage());
                // Fallback gracefully - the local wordData will be returned
                // If it is a hard rate limit error, back off for 15 minutes instead of 2 hours
                if (str_contains(strtolower($e->getMessage()), 'rate limit') || str_contains(strtolower($e->getMessage()), '429') || str_contains(strtolower($e->getMessage()), 'quota')) {
                     \Illuminate\Support\Facades\Cache::put($cacheKey, now()->subMinutes(105), now()->addHours(1)); // 120 - 105 = 15 mins backoff
                }
            } finally {
                \Illuminate\Support\Facades\Cache::forget($cacheKey . '_lock');
            }
        }

        // Log the viewing in our user relationship
        if ($wordData && isset($wordData['id'])) {
            $user->vocabularies()->syncWithoutDetaching([
                $wordData['id'] => ['last_seen_at' => now()]
            ]);
        }

        if (!$wordData) {
            return response()->json([
                'status' => 'error',
                'message' => 'No vocabulary available. The admin needs to add words to the vocabulary bank.'
            ], 404);
        }

        $isMastered = $user->vocabularies()
            ->where('vocabulary_id', $wordData['id'])
            ->whereNotNull('mastered_at')
            ->exists();

        return response()->json([
            'id' => $wordData['id'],
            'word' => $wordData['word'],
            'definition' => $wordData['definition'],
            'phonetic' => $wordData['phonetic'],
            'category' => $wordData['category'],
            'is_ai_generated' => $wordData['is_ai_generated'] ?? false,
            'is_mastered' => $isMastered,
            'mastered_count' => $user->vocabularies()->whereNotNull('mastered_at')->count(),
            'total_library_count' => \App\Models\Vocabulary::count()
        ]);
    }

    /**
     * Internal: Connect to Google Gemini API
     * Optimized for high-school intelligence level & diversity.
     */
    private function fetchFromGemini($apiKey, $count = 1)
    {
        // Using v1beta endpoint for latest model support (Gemini 2.5)
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        
        $prompt = "Act as a high-level English Professor. Generate exactly $count unique, advanced English vocabulary word(s) suitable for a grade 10-12 student.
        Distribute them across academic categories (e.g., Science, Technology, Literature, Philosophy, Psychology, General).
        YOU MUST RETURN ONLY A RAW JSON ARRAY containing exactly $count objects. 
        Each object MUST have exactly these keys: 'word', 'definition', 'phonetic', 'category'. 
        The words must be academically challenging.
        CRITICAL: Inside the 'definition' string, you MUST first write the meaning, followed by a bolded example sentence like so: 'Meaning here. <br><br><b>Example:</b> The sentence here.'
        Example Format: [{\"word\": \"Ephemeral\", \"definition\": \"Lasting for a very short time. <br><br><b>Example:</b> Fashions are ephemeral and constantly changing.\", \"phonetic\": \"/ɪˈfɛm(ə)rəl/\", \"category\": \"General\"}]";

        $client = new \GuzzleHttp\Client(['timeout' => 45]);
        
        try {
            $response = $client->post($url, [
                'headers' => [
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'temperature' => 1.0,
                        'maxOutputTokens' => 2048,
                        'responseMimeType' => 'application/json'
                    ]
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            
            // Robust JSON extraction: Find the first [ and last ]
            $start = strpos($text, '[');
            $end = strrpos($text, ']');
            
            if ($start !== false && $end !== false) {
                $cleanJson = substr($text, $start, $end - $start + 1);
            } else {
                $cleanJson = preg_replace('/```(json)?|```/s', '', $text);
            }

            $decoded = json_decode(trim($cleanJson), true);

            if (!$decoded || !is_array($decoded)) {
                 throw new \Exception("AI returned invalid JSON structure. Content: " . substr($text, 0, 100));
            }

            // Fallback for AI occasionally returning single object instead of array
            if (isset($decoded['word'])) {
                $decoded = [$decoded];
            }

            return $decoded;

        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $errorBody = $e->hasResponse() ? json_decode($e->getResponse()->getBody(), true) : [];
            $message = $errorBody['error']['message'] ?? $e->getMessage();
            throw new \Exception("Gemini API Error: " . $message);
        }
    }

    /**
     * TEST: Verify if Gemini API is responding correctly.
     */
    public function testGemini()
    {
        $apiKey = config('services.gemini.key');
        if (empty($apiKey)) return response()->json(['status' => 'error', 'message' => 'API Key missing from .env'], 400);

        $client = new \GuzzleHttp\Client(['timeout' => 10]);
        $testResults = [];

        // Try to fetch available models to debug
        try {
            $modelsResponse = $client->get("https://generativelanguage.googleapis.com/v1beta/models", [
                'headers' => ['x-goog-api-key' => $apiKey]
            ]);
            $testResults['available_models'] = array_slice(json_decode($modelsResponse->getBody(), true)['models'] ?? [], 0, 3);
        } catch (\Exception $e) {
            $testResults['model_list_error'] = $e->getMessage();
        }

        try {
            $words = $this->fetchFromGemini($apiKey, 1);
            return response()->json([
                'status' => 'success',
                'api_connected' => true,
                'test_sample' => $words[0] ?? null,
                'diagnostics' => $testResults
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'diagnostics' => $testResults
            ], 500);
        }
    }

    /**
     * ADMIN: Force replenish the vocabulary bank using Gemini AI.
     */
    public function replenishPool(Request $request)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers cannot trigger AI generation.'], 403);
        }

        $apiKey = config('services.gemini.key');
        if (empty($apiKey)) {
            return response()->json(['status' => 'error', 'message' => 'Gemini API Key is missing.'], 400);
        }

        try {
            $count = $request->input('count', 5);
            $batchData = $this->fetchFromGemini($apiKey, $count);
            $addedCount = 0;

            if (!empty($batchData) && is_array($batchData)) {
                foreach ($batchData as $wd) {
                    if (isset($wd['word'])) {
                        \App\Models\Vocabulary::updateOrCreate(
                            ['word' => $wd['word']],
                            [
                                'definition' => $wd['definition'] ?? '',
                                'phonetic' => $wd['phonetic'] ?? '-',
                                'category' => $wd['category'] ?? 'General',
                                'difficulty' => 3
                            ]
                        );
                        $addedCount++;
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Successfully added $addedCount new words to the library using AI.",
                'words' => $batchData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'AI Replenishment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark a word as learned/mastered by the user.
     */
    public function markLearned(Request $request)
    {
        $request->validate([
            'word_id' => 'required|exists:vocabularies,id',
            'score' => 'nullable|integer'
        ]);

        $user = $request->user();
        $wordId = $request->word_id;
        $score = $request->score ?? 0;

        // Update the pivot table
        $user->vocabularies()->syncWithoutDetaching([
            $wordId => [
                'mastered_at' => now(),
                'attempts' => \Illuminate\Support\Facades\DB::raw('attempts + 1'),
                'best_score' => \Illuminate\Support\Facades\DB::raw("GREATEST(best_score, $score)")
            ]
        ]);

        return response()->json(['message' => 'Vocabulary mastered! AI will prioritize new ones now.']);
    }

    /**
     * ADMIN: Fetch all vocabularies in the pool (with pagination).
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $vocabularies = \App\Models\Vocabulary::latest()->paginate($perPage);
        
        return response()->json([
            'count' => \App\Models\Vocabulary::count(),
            'vocabularies' => $vocabularies->items(),
            'pagination' => [
                'current_page' => $vocabularies->currentPage(),
                'last_page' => $vocabularies->lastPage(),
                'total' => $vocabularies->total(),
            ]
        ]);
    }

    /**
     * ADMIN: Manually add a word to the pool.
     */
    public function store(Request $request)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view vocabulary content.'], 403);
        }

        $request->validate([
            'word' => 'required|string|unique:vocabularies',
            'definition' => 'required|string',
            'phonetic' => 'nullable|string',
            'category' => 'required|string',
        ]);

        $vocabulary = \App\Models\Vocabulary::create($request->all());

        return response()->json([
            'message' => 'Word manually added to the AI bank.',
            'vocabulary' => $vocabulary
        ], 201);
    }

    /**
     * Generic AI Chat for learners.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'chat_id' => 'nullable|integer|exists:ai_chats,id',
            'context' => 'nullable|string',
        ]);

        $apiKey = config('services.gemini.key');
        if (empty($apiKey)) {
            return response()->json(['status' => 'error', 'message' => 'AI Service is currently unavailable.'], 503);
        }

        $user = $request->user();
        $message = $request->message;
        $chatId = $request->chat_id;
        $context = $request->context ?? 'General Learning';

        // Load or Create Chat Thread
        if ($chatId) {
            $chat = \App\Models\AIChat::where('id', $chatId)->where('user_id', $user->id)->firstOrFail();
            $messages = $chat->messages ?? [];
        } else {
            $chat = new \App\Models\AIChat();
            $chat->user_id = $user->id;
            $chat->title = count(explode(' ', $message)) > 8 ? substr($message, 0, 40) . '...' : $message;
            $messages = [];
        }

        // Add User Message
        $messages[] = ['role' => 'user', 'content' => $message, 'timestamp' => now()->toIso8601String()];

        // Prepare History Context (last 8 messages)
        $history = array_slice($messages, -10);
        $historyText = "";
        foreach ($history as $m) {
            $historyText .= ($m['role'] === 'user' ? "Student: " : "Assistant: ") . $m['content'] . "\n";
        }

        $prompt = "You are Inkiito AI, an Elite Tutor for all subjects.
        Student: {$user->name}
        Context: $context
        
        Recent Conversation History:
        $historyText

        Rules:
        1. Professional, encouraging, and clear high-school level explanations.
        2. Use rich Markdown (headers, lists, bold).
        3. If requested, generate 3-5 revision questions.
        4. If you don't know, say so. Stay academic.

        Current Query: $message";

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 60]);
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

            $response = $client->post($url, [
                'headers' => [
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 2048,
                    ]
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? "I'm having trouble thinking clearly right now. Please try again.";

            // Save AI Reply
            $messages[] = ['role' => 'ai', 'content' => $reply, 'timestamp' => now()->toIso8601String()];
            $chat->messages = $messages;
            $chat->save();

            return response()->json([
                'reply' => $reply,
                'chat_id' => $chat->id,
                'status' => 'success'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Gemini Chat Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'AI brain is currently recalibrating.'], 500);
        }
    }

    /**
     * List user's past AI chats.
     */
    public function getChats(Request $request)
    {
        $chats = \App\Models\AIChat::where('user_id', $request->user()->id)
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'title', 'updated_at']);
            
        return response()->json($chats);
    }

    /**
     * Get a specific chat thread.
     */
    public function getChat($id, Request $request)
    {
        $chat = \App\Models\AIChat::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
            
        return response()->json($chat);
    }

    /**
     * Delete a chat history.
     */
    public function deleteChat($id, Request $request)
    {
        $chat = \App\Models\AIChat::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
            
        $chat->delete();
        return response()->json(['message' => 'Chat history cleared.']);
    }

    /**
     * Specialized: Generate revision questions for a specific topic/subject.
     */
    public function generateRevision(Request $request)
    {
        $request->validate([
            'topic' => 'required|string',
            'subject' => 'nullable|string',
        ]);

        $apiKey = config('services.gemini.key');
        if (empty($apiKey)) {
            return response()->json(['status' => 'error', 'message' => 'AI Service is currently unavailable.'], 503);
        }

        $topic = $request->topic;
        $subject = $request->subject ?? 'General';

        $prompt = "Act as an Expert Examiner. Generate 5 high-quality revision questions for a high school student on the topic: '$topic' in the subject of '$subject'.
        Provide a mix of multiple choice and short answer questions.
        Include the correct answers at the bottom of your response, clearly separated.
        Format the output nicely using Markdown.";

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 60]);
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

            $response = $client->post($url, [
                'headers' => [
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => [
                        'temperature' => 0.8,
                        'maxOutputTokens' => 2048,
                    ]
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            $content = $data['candidates'][0]['content']['parts'][0]['text'] ?? "I couldn't generate the questions right now.";

            return response()->json([
                'content' => $content,
                'status' => 'success'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Gemini Revision Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Failed to generate revision questions.'], 500);
        }
    }

    /**
     * ADMIN: Remove a word from the pool.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role === 'teacher') {
            return response()->json(['message' => 'Teachers can only view vocabulary content.'], 403);
        }

        $vocabulary = \App\Models\Vocabulary::findOrFail($id);
        $vocabulary->delete();

        return response()->json(['message' => 'Word removed from the AI bank.']);
    }


}

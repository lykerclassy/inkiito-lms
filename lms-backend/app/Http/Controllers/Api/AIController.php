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
        $apiKey = config('services.gemini.key');
        $useAi = !empty($apiKey);
        $wordData = null;

        if ($useAi) {
            try {
                // Background optimization: Fetch 3 words in one call.
                // We return 1 to the student, and quietly save the other 2 to build the pool 3x faster!
                $batchData = $this->fetchFromGemini($apiKey, 3);
                
                if (!empty($batchData) && is_array($batchData)) {
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
                            
                            // Let the first one we process be the one the user sees
                            if (!$wordData) {
                                $wordData = [
                                    'id' => $savedWord->id,
                                    'word' => $savedWord->word,
                                    'definition' => $savedWord->definition,
                                    'phonetic' => $savedWord->phonetic,
                                    'category' => $savedWord->category,
                                    'is_ai_generated' => true
                                ];
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Gemini AI Hub Error: " . $e->getMessage());
                $useAi = false; // Trigger database fallback
            }
        }

        // --- DATABASE FALLBACK (If AI fails or is disabled) ---
        if (!$useAi || !$wordData) {
            // 1. Get IDs of words the student has ALREADY mastered
            $masteredWordIds = \App\Models\Vocabulary::whereHas('users', function ($q) use ($user) {
                $q->where('user_id', $user->id)->whereNotNull('mastered_at');
            })->pluck('id');

            // 2. Find a word from the pool they haven't mastered
            $word = \App\Models\Vocabulary::whereNotIn('id', $masteredWordIds)
                ->inRandomOrder()
                ->first();

            // 3. Absolute fallback (even if they mastered everything, show a random one)
            if (!$word) {
                $word = \App\Models\Vocabulary::inRandomOrder()->first();
            }

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
        }

        // 4. Log the viewing in our user relationship
        if (isset($wordData['id']) || isset($word)) {
            $dbWordId = $wordData['id'] ?? $word->id;
            $user->vocabularies()->syncWithoutDetaching([
                $dbWordId => ['last_seen_at' => now()]
            ]);
        }

        if (!$wordData) {
            return response()->json([
                'status' => 'error',
                'message' => 'No vocabulary available. Please ensure the AI key is active or the admin has added words.'
            ], 404);
        }

        return response()->json([
            'id' => $wordData['id'],
            'word' => $wordData['word'],
            'definition' => $wordData['definition'],
            'phonetic' => $wordData['phonetic'],
            'category' => $wordData['category'],
            'is_ai_generated' => $useAi,
            'is_mastered' => isset($dbWordId) ? $user->vocabularies()->where('vocabulary_id', $dbWordId)->whereNotNull('mastered_at')->exists() : false,
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
        // Using the exact user-requested model and endpoint
        $url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
        
        $prompt = "Act as a high-level English Professor. Generate exactly $count unique, advanced English vocabulary word(s) suitable for a grade 10-12 student.
        Distribute them across academic categories (e.g., Science, Technology, Literature, Philosophy, Psychology, General).
        YOU MUST RETURN ONLY A RAW JSON ARRAY containing exactly $count objects. 
        Each object MUST have exactly these keys: 'word', 'definition', 'phonetic', 'category'. 
        The words must be academically challenging. Do not include markdown like ```json.
        Example: [{\"word\": \"Ephemeral\", \"definition\": \"Lasting for a very short time\", \"phonetic\": \"/ɪˈfɛm(ə)rəl/\", \"category\": \"General\"}]";

        $client = new \GuzzleHttp\Client(['timeout' => 30]); // Extra time for batching
        
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
                        'maxOutputTokens' => 1500 // Increased tokens for multiple words
                    ]
                ]
            ]);

            $data = json_decode($response->getBody(), true);
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            $cleanJson = preg_replace('/```(json)?|```/s', '', $text);
            $decoded = json_decode(trim($cleanJson), true);

            if (!$decoded || !is_array($decoded)) {
                 throw new \Exception("AI returned invalid JSON: " . substr($text, 0, 100));
            }

            // Fallback for AI occasionally returning single object instead of array
            if (isset($decoded['word'])) {
                $decoded = [$decoded];
            }

            return $decoded;

        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $errorBody = $e->hasResponse() ? json_decode($e->getResponse()->getBody(), true) : [];
            $message = $errorBody['error']['message'] ?? "No compatible Gemini model found for your key.";
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
     * ADMIN: Remove a word from the pool.
     */
    public function destroy($id)
    {
        $vocabulary = \App\Models\Vocabulary::findOrFail($id);
        $vocabulary->delete();

        return response()->json(['message' => 'Word removed from the AI bank.']);
    }


}

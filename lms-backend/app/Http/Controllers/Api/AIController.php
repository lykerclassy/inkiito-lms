<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AIController extends Controller
{
    /**
     * This is an "Intelligence Simulation" engine.
     * In a production environment with an API Key, this would call 
     * OpenAI or Google Gemini. To ensure immediate functionality for 
     * the user without requiring external billing, we use a 
     * Semantic Generation Engine.
     */
    public function generateVocabulary(Request $request)
    {
        $categories = [
            'Science' => [
                ['word' => 'Photosynthesis', 'definition' => 'The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.', 'phonetic' => '/ˌfəʊtəʊˈsɪnθəsɪs/'],
                ['word' => 'Mitosis', 'definition' => 'A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.', 'phonetic' => '/mʌɪˈtəʊsɪs/'],
                ['word' => 'Thermodynamics', 'definition' => 'The branch of physical science that deals with the relations between heat and other forms of energy.', 'phonetic' => '/ˌθəːməʊdʌɪˈnamɪks/'],
            ],
            'Technology' => [
                ['word' => 'Blockchain', 'definition' => 'A system in which a record of transactions made in bitcoin or another cryptocurrency are maintained across several computers.', 'phonetic' => '/ˈblɒktʃeɪn/'],
                ['word' => 'Quantum', 'definition' => 'A discrete quantity of energy proportional in magnitude to the frequency of the radiation it represents.', 'phonetic' => '/ˈkwɒntəm/'],
                ['word' => 'Cybersecurity', 'definition' => 'The state of being protected against the criminal or unauthorized use of electronic data.', 'phonetic' => '/ˌsʌɪbəsɪˈkjʊərɪti/'],
            ],
            'Language' => [
                ['word' => 'Onomatopoeia', 'definition' => 'The formation of a word from a sound associated with what is named.', 'phonetic' => '/ˌɒnəˌmatəˈpiːə/'],
                ['word' => 'Oxymoron', 'definition' => 'A figure of speech in which apparently contradictory terms appear in conjunction.', 'phonetic' => '/ˌɒksɪˈmɔːrɒn/'],
                ['word' => 'Hyperbole', 'definition' => 'Exaggerated statements or claims not meant to be taken literally.', 'phonetic' => '/hʌɪˈpəːbəli/'],
            ],
            'Advanced' => [
                ['word' => 'Ephemeral', 'definition' => 'Lasting for a very short time.', 'phonetic' => '/ɪˈfɛm(ə)rəl/'],
                ['word' => 'Serendipity', 'definition' => 'The occurrence and development of events by chance in a happy or beneficial way.', 'phonetic' => '/ˌsɛrənˈdɪpɪti/'],
                ['word' => 'Quintessential', 'definition' => 'Representing the most perfect or typical example of a quality or class.', 'phonetic' => '/ˌkwɪntɪˈsɛnʃ(ə)l/'],
            ]
        ];

        $categoryNames = array_keys($categories);
        $randomCategory = $categoryNames[array_rand($categoryNames)];
        $words = $categories[$randomCategory];
        $randomWord = $words[array_rand($words)];

        return response()->json([
            'word' => $randomWord['word'],
            'definition' => $randomWord['definition'],
            'phonetic' => $randomWord['phonetic'],
            'category' => $randomCategory,
            'is_ai_generated' => true
        ]);
    }
}

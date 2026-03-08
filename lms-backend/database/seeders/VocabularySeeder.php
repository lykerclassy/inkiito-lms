<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vocabulary;

class VocabularySeeder extends Seeder
{
    /**
     * Seed the application's database with a large vocabulary for the AI Hub.
     */
    public function run(): void
    {
        $words = [
            ['word' => 'Photosynthesis', 'definition' => 'Process by which green plants synthesize nutrients from sunlight.', 'phonetic' => '/ˌfəʊtəʊˈsɪnθəsɪs/', 'category' => 'Science', 'difficulty' => 3],
            ['word' => 'Mitosis', 'definition' => 'Cell division resulting in two identical daughter cells.', 'phonetic' => '/mʌɪˈtəʊsɪs/', 'category' => 'Science', 'difficulty' => 4],
            ['word' => 'Thermodynamics', 'definition' => 'Branch of science dealing with heat and energy.', 'phonetic' => '/ˌθəːməʊdʌɪˈnamɪks/', 'category' => 'Science', 'difficulty' => 5],
            ['word' => 'Blockchain', 'definition' => 'Distributed decentralized digital ledger technology.', 'phonetic' => '/ˈblɒktʃeɪn/', 'category' => 'Technology', 'difficulty' => 4],
            ['word' => 'Quantum', 'definition' => 'Smallest possible discrete unit of energy.', 'phonetic' => '/ˈkwɒntəm/', 'category' => 'Science', 'difficulty' => 5],
            ['word' => 'Cybersecurity', 'definition' => 'Protection of computer systems from theft or damage.', 'phonetic' => '/ˌsʌɪbəsɪˈkjʊərɪti/', 'category' => 'Technology', 'difficulty' => 3],
            ['word' => 'Onomatopoeia', 'definition' => 'Formation of a word from a sound associated with what is named.', 'phonetic' => '/ˌɒnəˌmatəˈpiːə/', 'category' => 'Language', 'difficulty' => 4],
            ['word' => 'Oxymoron', 'definition' => 'Figure of speech with contradictory terms.', 'phonetic' => '/ˌɒksɪˈmɔːrɒn/', 'category' => 'Language', 'difficulty' => 2],
            ['word' => 'Hyperbole', 'definition' => 'Exaggerated statements not meant to be taken literally.', 'phonetic' => '/hʌɪˈpəːbəli/', 'category' => 'Language', 'difficulty' => 2],
            ['word' => 'Ephemeral', 'definition' => 'Lasting for a very short time.', 'phonetic' => '/ɪˈfɛm(ə)rəl/', 'category' => 'General', 'difficulty' => 4],
            ['word' => 'Serendipity', 'definition' => 'Development of events by chance in a happy way.', 'phonetic' => '/ˌsɛrənˈdɪpɪti/', 'category' => 'General', 'difficulty' => 4],
            ['word' => 'Quintessential', 'definition' => 'Perfect or typical example of a quality.', 'phonetic' => '/ˌkwɪntɪˈsɛnʃ(ə)l/', 'category' => 'General', 'difficulty' => 5],
            ['word' => 'Ambiguous', 'definition' => 'Open to more than one interpretation.', 'phonetic' => '/amˈbɪɡjʊəs/', 'category' => 'Language', 'difficulty' => 3],
            ['word' => 'Languid', 'definition' => 'Displaying slow and relaxed movements.', 'phonetic' => '/ˈlaŋɡwɪd/', 'category' => 'General', 'difficulty' => 3],
            ['word' => 'Meticulous', 'definition' => 'Showing great attention to detail.', 'phonetic' => '/mɪˈtɪkjʊləs/', 'category' => 'General', 'difficulty' => 3],
            ['word' => 'Benevolent', 'definition' => 'Well meaning and kindly.', 'phonetic' => '/bəˈnɛvələnt/', 'category' => 'General', 'difficulty' => 3],
            ['word' => 'Resilience', 'definition' => 'Capacity to recover quickly from difficulties.', 'phonetic' => '/rɪˈzɪlɪəns/', 'category' => 'General', 'difficulty' => 2],
            ['word' => 'Ubiquitous', 'definition' => 'Present, appearing, or found everywhere.', 'phonetic' => '/juːˈbɪkwɪtəs/', 'category' => 'General', 'difficulty' => 4],
            ['word' => 'Paradigm', 'definition' => 'Typical example or pattern of something.', 'phonetic' => '/ˈparədʌɪm/', 'category' => 'General', 'difficulty' => 4],
            ['word' => 'Synergy', 'definition' => 'Interaction of parts to produce a greater combined effect.', 'phonetic' => '/ˈsɪnədʒi/', 'category' => 'Business', 'difficulty' => 4],
            ['word' => 'Pragmatic', 'definition' => 'Dealing with things in a sensible and realistic way.', 'phonetic' => '/praɡˈmatɪk/', 'category' => 'General', 'difficulty' => 3],
            ['word' => 'Cacophony', 'definition' => 'A harsh, discordant mixture of sounds.', 'phonetic' => '/kəˈkɒfəni/', 'category' => 'Language', 'difficulty' => 4],
            ['word' => 'Eloquence', 'definition' => 'Fluent or persuasive speaking or writing.', 'phonetic' => '/ˈɛləkwəns/', 'category' => 'Language', 'difficulty' => 3],
            ['word' => 'Esoteric', 'definition' => 'Intended for or understood by only a small number of people.', 'phonetic' => '/ˌɛsəˈtɛrɪk/', 'category' => 'General', 'difficulty' => 5],
        ];

        foreach ($words as $word) {
            Vocabulary::updateOrCreate(['word' => $word['word']], $word);
        }
    }
}

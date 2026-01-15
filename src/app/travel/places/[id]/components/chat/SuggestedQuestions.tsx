'use client';

import { motion } from 'framer-motion';

interface SuggestedQuestionsProps {
  placeName: string;
  categories: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

// Generate contextual questions based on place categories
function generateQuestions(placeName: string, categories: string[]): string[] {
  const baseQuestions = [
    `What's the best time to visit ${placeName}?`,
    `How long should I spend at ${placeName}?`,
    `Is ${placeName} suitable for families?`,
  ];

  const categoryQuestions: Record<string, string[]> = {
    restaurant: [
      'What dishes do you recommend trying?',
      'Do I need to make a reservation?',
      'Are there vegetarian options?',
    ],
    cafe: [
      'What specialty drinks do they have?',
      'Is it good for working remotely?',
      'What are the opening hours?',
    ],
    museum: [
      'How much time do I need for a full visit?',
      'Are there guided tours available?',
      'What are the must-see exhibits?',
    ],
    park: [
      'What activities can I do there?',
      'Is it suitable for a picnic?',
      'Are pets allowed?',
    ],
    hotel: [
      'What amenities are included?',
      'Is breakfast included?',
      'What is the cancellation policy?',
    ],
    landmark: [
      'What is the historical significance?',
      'Are there any entry fees?',
      'What are the best photo spots?',
    ],
    beach: [
      'Is it safe for swimming?',
      'Are there facilities nearby?',
      'Best time of day to visit?',
    ],
    shopping: [
      'What are the best items to buy?',
      'Are there any local specialties?',
      'What are the typical prices?',
    ],
  };

  // Find matching category questions
  const lowerCategories = categories.map((c) => c.toLowerCase());
  let contextualQuestions: string[] = [];

  for (const [key, questions] of Object.entries(categoryQuestions)) {
    if (lowerCategories.some((c) => c.includes(key))) {
      contextualQuestions = [...contextualQuestions, ...questions];
    }
  }

  // Combine and limit to 5 questions
  const allQuestions = [...contextualQuestions, ...baseQuestions];
  return [...new Set(allQuestions)].slice(0, 5);
}

export function SuggestedQuestions({
  placeName,
  categories,
  onSelect,
  disabled,
}: SuggestedQuestionsProps) {
  const questions = generateQuestions(placeName, categories);

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question, index) => (
        <motion.button
          key={question}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="px-3 py-2 text-sm text-purple-700 bg-purple-50 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {question}
        </motion.button>
      ))}
    </div>
  );
}

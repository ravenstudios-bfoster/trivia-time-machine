
import { Question, Level } from '@/types';

export const sampleQuestions: Question[] = [
  // Level 1 Questions
  {
    id: 'q1-1',
    text: "What is the name of the main character in Back to the Future?",
    type: 'multiple-choice',
    level: 1,
    pointValue: 100,
    timeLimit: 30,
    options: [
      { id: 'q1-1-a', text: 'Marty McFly', isCorrect: true },
      { id: 'q1-1-b', text: 'Doc Brown', isCorrect: false },
      { id: 'q1-1-c', text: 'Biff Tannen', isCorrect: false },
      { id: 'q1-1-d', text: 'George McFly', isCorrect: false }
    ],
    hint: "His initials are M.M.",
    hintPenalty: 20,
    explanation: "Marty McFly is the main character, played by Michael J. Fox."
  },
  {
    id: 'q1-2',
    text: "What car is turned into a time machine?",
    type: 'multiple-choice',
    level: 1,
    pointValue: 100,
    timeLimit: 30,
    imageUrl: "/public/lovable-uploads/9f6aabdb-e642-4127-a49d-c5b5e2931e0b.png",
    options: [
      { id: 'q1-2-a', text: 'Chevrolet Corvette', isCorrect: false },
      { id: 'q1-2-b', text: 'DeLorean DMC-12', isCorrect: true },
      { id: 'q1-2-c', text: 'Ford Mustang', isCorrect: false },
      { id: 'q1-2-d', text: 'Pontiac Firebird', isCorrect: false }
    ],
    hint: "It has gull-wing doors.",
    hintPenalty: 20,
    explanation: "The DeLorean DMC-12 was chosen for its futuristic look with the gull-wing doors."
  },
  {
    id: 'q1-3',
    text: "What speed does the DeLorean need to reach to travel through time?",
    type: 'multiple-choice',
    level: 1,
    pointValue: 100,
    timeLimit: 30,
    options: [
      { id: 'q1-3-a', text: '55 mph', isCorrect: false },
      { id: 'q1-3-b', text: '78 mph', isCorrect: false },
      { id: 'q1-3-c', text: '88 mph', isCorrect: true },
      { id: 'q1-3-d', text: '99 mph', isCorrect: false }
    ],
    hint: "It's a number where both digits are the same.",
    hintPenalty: 20,
    explanation: "The DeLorean needs to reach 88 mph to generate the 1.21 gigawatts needed for time travel."
  },
  {
    id: 'q1-4',
    text: "In Back to the Future, what year does Marty travel back to?",
    type: 'multiple-choice',
    level: 1,
    pointValue: 100,
    timeLimit: 30,
    options: [
      { id: 'q1-4-a', text: '1945', isCorrect: false },
      { id: 'q1-4-b', text: '1955', isCorrect: true },
      { id: 'q1-4-c', text: '1965', isCorrect: false },
      { id: 'q1-4-d', text: '1975', isCorrect: false }
    ],
    hint: "It's exactly 30 years before 1985.",
    hintPenalty: 20,
    explanation: "Marty travels from 1985 back to 1955, where he meets young versions of his parents."
  },
  {
    id: 'q1-5',
    text: "What powers the flux capacitor in the original timeline?",
    type: 'multiple-choice',
    level: 1,
    pointValue: 100,
    timeLimit: 30,
    options: [
      { id: 'q1-5-a', text: 'Gasoline', isCorrect: false },
      { id: 'q1-5-b', text: 'Solar power', isCorrect: false },
      { id: 'q1-5-c', text: 'Uranium', isCorrect: false },
      { id: 'q1-5-d', text: 'Plutonium', isCorrect: true }
    ],
    hint: "It's a radioactive element used in nuclear weapons.",
    hintPenalty: 20,
    explanation: "Doc Brown initially powers the time machine with plutonium stolen from Libyan terrorists."
  },
  
  // Level 2 Questions
  {
    id: 'q2-1',
    text: "What does Marty's band in the film call themselves?",
    type: 'multiple-choice',
    level: 2,
    pointValue: 200,
    timeLimit: 30,
    options: [
      { id: 'q2-1-a', text: 'The Pinheads', isCorrect: true },
      { id: 'q2-1-b', text: 'The Time Travelers', isCorrect: false },
      { id: 'q2-1-c', text: 'Marty and the McFlys', isCorrect: false },
      { id: 'q2-1-d', text: 'Flux Capacity', isCorrect: false }
    ],
    hint: "It's what the judge at the audition calls them, ironically.",
    hintPenalty: 40,
    explanation: "Marty's band is called The Pinheads, ironically also what the audition judge calls them."
  },
  {
    id: 'q2-2',
    text: "What song does Marty perform at the 'Enchantment Under the Sea' dance?",
    type: 'write-in',
    level: 2,
    pointValue: 200,
    timeLimit: 45,
    correctAnswer: "Johnny B. Goode",
    hint: "It's a Chuck Berry song with a male name in the title.",
    hintPenalty: 40,
    explanation: "Marty performs 'Johnny B. Goode' by Chuck Berry, which in the film's universe inspires Berry to create the song."
  },
  {
    id: 'q2-3',
    text: "True or False: In Back to the Future Part II, Marty travels to the year 2015.",
    type: 'true-false',
    level: 2,
    pointValue: 200,
    timeLimit: 20,
    options: [
      { id: 'q2-3-a', text: 'True', isCorrect: true },
      { id: 'q2-3-b', text: 'False', isCorrect: false }
    ],
    hint: "Think about when the movie was made (1989) and how far into the future they went.",
    hintPenalty: 40,
    explanation: "In Back to the Future Part II, Doc and Marty travel 30 years into the future, from 1985 to 2015."
  },
  {
    id: 'q2-4',
    text: "What famous quote does Doc Brown say when explaining to Marty that they need to go back to the future?",
    type: 'multiple-choice',
    level: 2,
    pointValue: 200,
    timeLimit: 30,
    options: [
      { id: 'q2-4-a', text: '"Time waits for no man!"', isCorrect: false },
      { id: 'q2-4-b', text: '"Roads? Where we\'re going, we don\'t need roads."', isCorrect: true },
      { id: 'q2-4-c', text: '"The future isn\'t written yet."', isCorrect: false },
      { id: 'q2-4-d', text: '"Time travel is never simple!"', isCorrect: false },
      { id: 'q2-4-e', text: '"All of the above"', isCorrect: false }
    ],
    hint: "It involves infrastructure.",
    hintPenalty: 40,
    explanation: "Doc Brown's famous line at the end of the first film is 'Roads? Where we're going, we don't need roads.'"
  },
  {
    id: 'q2-5',
    text: "What sport does Biff Tannen bet on in Back to the Future Part II?",
    type: 'multiple-choice',
    level: 2,
    pointValue: 200,
    timeLimit: 30,
    options: [
      { id: 'q2-5-a', text: 'Football', isCorrect: false },
      { id: 'q2-5-b', text: 'Horse Racing', isCorrect: false },
      { id: 'q2-5-c', text: 'Baseball', isCorrect: true },
      { id: 'q2-5-d', text: 'Boxing', isCorrect: false }
    ],
    hint: "America's pastime.",
    hintPenalty: 40,
    explanation: "Biff gets rich by betting on baseball games using results from a sports almanac from the future."
  },
  
  // Level 3 Questions
  {
    id: 'q3-1',
    text: "What is the exact date of the 'lightning strike' clock tower event?",
    type: 'multiple-choice',
    level: 3,
    pointValue: 300,
    timeLimit: 45,
    options: [
      { id: 'q3-1-a', text: 'November 5, 1955', isCorrect: false },
      { id: 'q3-1-b', text: 'November 12, 1955', isCorrect: true },
      { id: 'q3-1-c', text: 'October 21, 1955', isCorrect: false },
      { id: 'q3-1-d', text: 'October 26, 1955', isCorrect: false }
    ],
    hint: "It was a Saturday in mid-November.",
    hintPenalty: 60,
    explanation: "The clock tower was struck by lightning at precisely 10:04 PM on Saturday, November 12, 1955."
  },
  {
    id: 'q3-2',
    text: "In Back to the Future Part III, what alias does Doc Brown use in 1885?",
    type: 'write-in',
    level: 3,
    pointValue: 300,
    timeLimit: 45,
    correctAnswer: "Emmett Von Braun",
    hint: "His first name is the same, and his last name references a real rocket scientist.",
    hintPenalty: 60,
    explanation: "Doc Brown uses the alias 'Emmett Von Braun' in 1885, a reference to rocket scientist Wernher Von Braun."
  },
  {
    id: 'q3-3',
    text: "What was written on the note attached to the model car in Doc Brown's lab in 1985?",
    type: 'multiple-choice',
    level: 3,
    pointValue: 300,
    timeLimit: 30,
    options: [
      { id: 'q3-3-a', text: '"Caution: Time Travel"', isCorrect: false },
      { id: 'q3-3-b', text: '"Do not touch - experiment in progress"', isCorrect: false },
      { id: 'q3-3-c', text: '"Time machine prototype - 1:24 scale"', isCorrect: false },
      { id: 'q3-3-d', text: '"Please note exposed electrical wiring"', isCorrect: true }
    ],
    hint: "It was a safety warning.",
    hintPenalty: 60,
    explanation: "The note on the model car read 'Please note exposed electrical wiring,' which Marty disregards before getting shocked."
  },
  {
    id: 'q3-4',
    text: "In Back to the Future, what was the original casting choice for Marty McFly before Michael J. Fox?",
    type: 'multiple-choice',
    level: 3,
    pointValue: 300,
    timeLimit: 45,
    options: [
      { id: 'q3-4-a', text: 'Tom Cruise', isCorrect: false },
      { id: 'q3-4-b', text: 'Eric Stoltz', isCorrect: true },
      { id: 'q3-4-c', text: 'Johnny Depp', isCorrect: false },
      { id: 'q3-4-d', text: 'Ralph Macchio', isCorrect: false },
      { id: 'q3-4-e', text: 'None of the above', isCorrect: false }
    ],
    hint: "He was replaced after five weeks of filming.",
    hintPenalty: 60,
    explanation: "Eric Stoltz was originally cast as Marty and filmed for five weeks before being replaced by Michael J. Fox."
  },
  {
    id: 'q3-5',
    text: "What is the name of Doc's dog in 1985?",
    type: 'write-in',
    level: 3,
    pointValue: 300,
    timeLimit: 30,
    correctAnswer: "Einstein",
    hint: "Named after a famous scientist.",
    hintPenalty: 60,
    explanation: "Doc's dog is named Einstein, after the famous physicist Albert Einstein."
  }
];

// Helper function to get questions by level
export const getQuestionsByLevel = (level: Level): Question[] => {
  return sampleQuestions.filter(q => q.level === level);
};

// Helper function to get a specific question by ID
export const getQuestionById = (id: string): Question | undefined => {
  return sampleQuestions.find(q => q.id === id);
};

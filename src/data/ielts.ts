export type IeltsPart = 'part1' | 'part2' | 'part3'

export interface IeltsPartInfo {
  id: IeltsPart
  label: string
  tagline: string
}

export const IELTS_PARTS: IeltsPartInfo[] = [
  { id: 'part1', label: 'Part 1', tagline: 'Short questions about you, no prep' },
  { id: 'part2', label: 'Part 2', tagline: 'Cue card, 1 min to prepare' },
  { id: 'part3', label: 'Part 3', tagline: 'Two-way discussion, no prep' },
]

export interface IeltsTopicGroup {
  topic: string
  questions: string[]
}

export interface IeltsCueCard {
  topic: string
  bullets: string[]
}

export const IELTS_PART1_TOPICS: IeltsTopicGroup[] = [
  {
    topic: 'Hometown',
    questions: [
      'Where is your hometown?',
      "What's the most interesting part of your hometown?",
      'Has your hometown changed much since you were a child?',
      'Would you like to live somewhere else in the future?',
    ],
  },
  {
    topic: 'Home',
    questions: [
      'Do you live in a house or an apartment?',
      'What do you like most about your home?',
      'Would you like to move to a different home in the future?',
      'Which room in your home do you spend the most time in?',
    ],
  },
  {
    topic: 'Work or Study',
    questions: [
      'Do you work or are you a student?',
      'Why did you choose that job or subject?',
      'What do you like most about your work or studies?',
      'Is there anything you would change about your job or course?',
    ],
  },
  {
    topic: 'Daily Routine',
    questions: [
      'What does a typical day look like for you?',
      'Which part of your day do you enjoy the most?',
      'Has your daily routine changed a lot in recent years?',
      'Do you prefer a routine or a spontaneous schedule?',
    ],
  },
  {
    topic: 'Free Time',
    questions: [
      'What do you usually do in your free time?',
      'Do you prefer spending free time alone or with others?',
      'Has the way you spend your free time changed since you were younger?',
      'What new hobby would you like to try?',
    ],
  },
  {
    topic: 'Food',
    questions: [
      'What kind of food do you like?',
      'Do you prefer eating at home or eating out?',
      'Did you eat different food as a child?',
      'Is food an important part of your culture?',
    ],
  },
  {
    topic: 'Weather',
    questions: [
      'What is the weather like in your country?',
      'What is your favorite type of weather?',
      'Does the weather affect your mood?',
      'How do people in your country deal with hot or cold weather?',
    ],
  },
  {
    topic: 'Technology',
    questions: [
      'How often do you use your phone?',
      'What app do you use the most?',
      'Do you think technology has made life easier or harder?',
      'What piece of technology could you not live without?',
    ],
  },
  {
    topic: 'Music',
    questions: [
      'What kind of music do you like?',
      'Did you learn to play an instrument as a child?',
      'Do you listen to music while you work or study?',
      'Has your taste in music changed over the years?',
    ],
  },
  {
    topic: 'Reading',
    questions: [
      'Do you enjoy reading?',
      'What kind of books do you like?',
      'Did you read a lot as a child?',
      'Do you prefer physical books or e-books?',
    ],
  },
  {
    topic: 'Travel',
    questions: [
      'Do you enjoy traveling?',
      'What was the last place you visited?',
      'Do you prefer traveling alone or with others?',
      'What country would you most like to visit?',
    ],
  },
  {
    topic: 'Friends',
    questions: [
      'How much time do you spend with friends?',
      'What do you usually do together?',
      'Is it easy for you to make new friends?',
      'What do you value most in a friend?',
    ],
  },
  {
    topic: 'Shopping',
    questions: [
      'Do you enjoy shopping?',
      'Do you prefer shopping online or in stores?',
      'How often do you go shopping?',
      'What was the last thing you bought?',
    ],
  },
  {
    topic: 'Sports',
    questions: [
      'Do you play any sports?',
      'What sport do you enjoy watching the most?',
      'Did you play sports as a child?',
      'Do you think sport is important for young people?',
    ],
  },
  {
    topic: 'Photography',
    questions: [
      'Do you like taking photos?',
      'What do you usually take photos of?',
      'Do you prefer looking at old photos or taking new ones?',
      'How has photography changed since smartphones became common?',
    ],
  },
  {
    topic: 'Neighbors',
    questions: [
      'Do you know your neighbors well?',
      'How often do you talk to your neighbors?',
      'What makes someone a good neighbor?',
      'Is it common for neighbors to help each other where you live?',
    ],
  },
  {
    topic: 'Public Transport',
    questions: [
      'How do you usually get to work or school?',
      'Do you prefer public transport or driving?',
      'Is public transport reliable in your city?',
      'How has public transport in your area changed recently?',
    ],
  },
  {
    topic: 'Cooking',
    questions: [
      'Do you enjoy cooking?',
      'Who taught you how to cook?',
      'What is your favorite dish to make?',
      'Do you think everyone should learn to cook?',
    ],
  },
  {
    topic: 'Names',
    questions: [
      'What does your name mean?',
      'Who chose your name?',
      'Is your name common in your country?',
      'Would you ever change your name?',
    ],
  },
  {
    topic: 'Handwriting',
    questions: [
      'Do you often write by hand?',
      'Is your handwriting neat?',
      'Did you practice handwriting at school?',
      'Do you think handwriting will still matter in the future?',
    ],
  },
]

export const IELTS_PART2_CARDS: IeltsCueCard[] = [
  {
    topic: 'Describe a book you have recently read.',
    bullets: ['what the book was about', 'why you decided to read it', 'what you learned from it', 'explain why you enjoyed or disliked it'],
  },
  {
    topic: 'Describe a person who has influenced you.',
    bullets: ['who this person is', 'how you know them', 'what they did that influenced you', 'explain why this influence has been important to you'],
  },
  {
    topic: 'Describe a memorable trip you have taken.',
    bullets: ['where you went', 'who you went with', 'what you did there', 'explain why the trip was memorable'],
  },
  {
    topic: 'Describe a skill you would like to learn.',
    bullets: ['what the skill is', 'why you want to learn it', 'how you would learn it', 'explain how this skill would be useful to you'],
  },
  {
    topic: 'Describe a piece of technology you find useful.',
    bullets: ['what it is', 'how often you use it', 'how you learned to use it', 'explain why it is useful to you'],
  },
  {
    topic: 'Describe a decision that was difficult to make.',
    bullets: ['what the decision was', 'when you had to make it', 'what options you considered', 'explain why the decision was difficult'],
  },
  {
    topic: 'Describe your favorite way to relax.',
    bullets: ['what you do', 'when you usually do it', 'who you do it with, if anyone', 'explain why it helps you relax'],
  },
  {
    topic: 'Describe a time you helped someone.',
    bullets: ['who you helped', 'what the situation was', 'what you did to help', 'explain how you felt about helping them'],
  },
  {
    topic: 'Describe a public place you like to visit.',
    bullets: ['where it is', 'how often you go there', 'what you do there', 'explain why you like this place'],
  },
  {
    topic: 'Describe a job you would like to have in the future.',
    bullets: ['what the job is', 'what skills it requires', 'why this job appeals to you', 'explain what you would need to do to get this job'],
  },
  {
    topic: 'Describe a family member you are close to.',
    bullets: ['who this person is', 'what they are like', 'how much time you spend together', 'explain why you are close to them'],
  },
  {
    topic: 'Describe a film or TV show that made an impression on you.',
    bullets: ['what it was about', 'when you watched it', 'who you watched it with', 'explain why it made an impression on you'],
  },
  {
    topic: 'Describe an item you own that is important to you.',
    bullets: ['what it is', 'how you got it', 'how long you have had it', 'explain why it is important to you'],
  },
  {
    topic: 'Describe a celebration or festival you enjoyed.',
    bullets: ['what the occasion was', 'where and when it took place', 'who you celebrated with', 'explain why you enjoyed it'],
  },
  {
    topic: 'Describe an achievement you are proud of.',
    bullets: ['what the achievement was', 'how long it took to achieve', 'what challenges you faced', 'explain why you are proud of it'],
  },
  {
    topic: 'Describe a change that improved your life.',
    bullets: ['what the change was', 'when it happened', 'why you made this change', 'explain how it improved your life'],
  },
  {
    topic: 'Describe a challenging experience you have had.',
    bullets: ['what the experience was', 'when it happened', 'how you dealt with it', 'explain what you learned from it'],
  },
  {
    topic: 'Describe a place you would like to visit in the future.',
    bullets: ['where it is', 'how you found out about it', 'what you would do there', 'explain why you want to visit this place'],
  },
]

export const IELTS_PART3_TOPICS: IeltsTopicGroup[] = [
  {
    topic: 'Technology & Communication',
    questions: [
      'How has technology changed the way people communicate with each other?',
      'Do you think face-to-face communication will become less common in the future?',
      'What are the advantages and disadvantages of social media?',
      'What ethical questions does new technology raise?',
    ],
  },
  {
    topic: 'Media & Information',
    questions: [
      'How does the media influence public opinion?',
      'Should governments regulate what children see online?',
      'Is it becoming harder to tell true information from false information?',
      'What responsibility do news organizations have to be accurate?',
    ],
  },
  {
    topic: 'Education & Learning',
    questions: [
      'How has the internet changed the way people learn?',
      'Do you think online education will ever replace traditional classrooms?',
      'What role should schools play in teaching life skills?',
      'Why do you think some people value formal qualifications more than practical skills?',
      'How important is it for adults to keep learning new things?',
    ],
  },
  {
    topic: 'Cities & Urban Life',
    questions: [
      'What are the benefits and drawbacks of living in a big city?',
      'How does urbanization affect family relationships?',
      'Why are more young people moving away from rural areas?',
      'What can governments do to make cities more livable?',
      'How might cities change over the next fifty years?',
    ],
  },
  {
    topic: 'Careers & Work',
    questions: [
      'Why do some people prefer to work for themselves rather than for a company?',
      'How has the idea of a typical career changed in recent decades?',
      'What impact does automation have on employment?',
      'Do you think people will need to change careers more often in the future?',
      'How important is work-life balance in modern society?',
    ],
  },
  {
    topic: 'Tradition & Generations',
    questions: [
      'Why do traditions sometimes disappear as societies develop?',
      'Should governments try to protect traditional customs?',
      'How do younger and older generations differ in their values?',
      'What can older and younger generations learn from each other?',
      'How does globalization affect local cultures?',
    ],
  },
  {
    topic: 'Environment & Development',
    questions: [
      'What are the environmental costs of economic development?',
      'Should individuals or governments be more responsible for protecting the environment?',
      'How can countries balance economic growth with environmental protection?',
      'Why do you think some environmental problems are hard to solve?',
      'What changes have you noticed in how people think about the environment?',
    ],
  },
  {
    topic: 'Consumerism & AI',
    questions: [
      'How do advertisements influence what people buy?',
      'How might artificial intelligence change everyday jobs?',
      'Do you think machines will ever fully replace human decision-making?',
    ],
  },
  {
    topic: 'History & Identity',
    questions: [
      "How does a country's history shape its national identity?",
      'Why do you think some historical events are remembered differently by different people?',
      'What can studying history teach us about the present?',
    ],
  },
  {
    topic: 'Public Spaces & Architecture',
    questions: [
      'How do public spaces affect the way communities interact?',
      'What makes a city or town feel like a good place to live?',
      'How important is it for a country to preserve its architecture?',
    ],
  },
  {
    topic: 'Culture & Travel',
    questions: [
      'Why do people from different cultures sometimes misunderstand each other?',
      'How can travel change the way someone sees the world?',
      'Do you think tourism benefits or harms local communities?',
    ],
  },
]

export function getRandomIeltsPart1(): IeltsTopicGroup {
  return IELTS_PART1_TOPICS[Math.floor(Math.random() * IELTS_PART1_TOPICS.length)]
}

export function getRandomIeltsPart2(): IeltsCueCard {
  return IELTS_PART2_CARDS[Math.floor(Math.random() * IELTS_PART2_CARDS.length)]
}

export function getRandomIeltsPart3(): IeltsTopicGroup {
  return IELTS_PART3_TOPICS[Math.floor(Math.random() * IELTS_PART3_TOPICS.length)]
}

/** Returns a random topic + its question set for the two "ask one by one" parts. */
export function getRandomIeltsTopicGroup(part: 'part1' | 'part3'): IeltsTopicGroup {
  return part === 'part1' ? getRandomIeltsPart1() : getRandomIeltsPart3()
}

export function formatIeltsTopicGroup(t: IeltsTopicGroup): string {
  return `${t.topic}: ${t.questions.join(' ')}`
}

export function formatIeltsPart2(c: IeltsCueCard): string {
  const last = c.bullets[c.bullets.length - 1]
  const rest = c.bullets.slice(0, -1)
  return `${c.topic} You should say: ${rest.join(', ')}, and ${last}.`
}

export function getRandomIeltsPrompt(part: IeltsPart): string {
  if (part === 'part1') return formatIeltsTopicGroup(getRandomIeltsPart1())
  if (part === 'part2') return formatIeltsPart2(getRandomIeltsPart2())
  return formatIeltsTopicGroup(getRandomIeltsPart3())
}

export function ieltsPartLabel(part: IeltsPart): string {
  return IELTS_PARTS.find((p) => p.id === part)?.label ?? part
}

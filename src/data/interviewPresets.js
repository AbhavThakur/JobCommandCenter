// Curated presets for the Interview Prep page.

export const DSA_CATEGORIES = [
  "Arrays",
  "Strings",
  "Hash Map",
  "Two Pointers",
  "Sliding Window",
  "Stack/Queue",
  "Linked List",
  "Binary Search",
  "Trees",
  "Graphs",
  "Heap",
  "Backtracking",
  "Dynamic Programming",
  "Greedy",
  "Bit Manipulation",
  "Math",
  "Trie",
  "Union Find",
];

export const DSA_DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const DSA_STATUSES = ["Pending", "Revised", "Confident"];

// Curated NeetCode-150-style starter set so the page is never truly empty.
export const DSA_STARTER_TOPICS = [
  { topic: "Two Sum", category: "Arrays", difficulty: "Easy" },
  { topic: "Valid Anagram", category: "Hash Map", difficulty: "Easy" },
  { topic: "Group Anagrams", category: "Hash Map", difficulty: "Medium" },
  { topic: "Top K Frequent Elements", category: "Heap", difficulty: "Medium" },
  {
    topic: "Product of Array Except Self",
    category: "Arrays",
    difficulty: "Medium",
  },
  {
    topic: "Longest Consecutive Sequence",
    category: "Hash Map",
    difficulty: "Medium",
  },
  { topic: "3Sum", category: "Two Pointers", difficulty: "Medium" },
  {
    topic: "Container With Most Water",
    category: "Two Pointers",
    difficulty: "Medium",
  },
  {
    topic: "Longest Substring Without Repeating",
    category: "Sliding Window",
    difficulty: "Medium",
  },
  {
    topic: "Minimum Window Substring",
    category: "Sliding Window",
    difficulty: "Hard",
  },
  { topic: "Valid Parentheses", category: "Stack/Queue", difficulty: "Easy" },
  {
    topic: "Daily Temperatures",
    category: "Stack/Queue",
    difficulty: "Medium",
  },
  {
    topic: "Search in Rotated Sorted Array",
    category: "Binary Search",
    difficulty: "Medium",
  },
  { topic: "Reverse Linked List", category: "Linked List", difficulty: "Easy" },
  {
    topic: "Merge Two Sorted Lists",
    category: "Linked List",
    difficulty: "Easy",
  },
  { topic: "LRU Cache", category: "Linked List", difficulty: "Medium" },
  { topic: "Invert Binary Tree", category: "Trees", difficulty: "Easy" },
  { topic: "Validate BST", category: "Trees", difficulty: "Medium" },
  {
    topic: "Binary Tree Level Order Traversal",
    category: "Trees",
    difficulty: "Medium",
  },
  {
    topic: "Lowest Common Ancestor of BST",
    category: "Trees",
    difficulty: "Medium",
  },
  { topic: "Number of Islands", category: "Graphs", difficulty: "Medium" },
  { topic: "Clone Graph", category: "Graphs", difficulty: "Medium" },
  { topic: "Course Schedule", category: "Graphs", difficulty: "Medium" },
  { topic: "Word Ladder", category: "Graphs", difficulty: "Hard" },
  {
    topic: "Climbing Stairs",
    category: "Dynamic Programming",
    difficulty: "Easy",
  },
  {
    topic: "House Robber",
    category: "Dynamic Programming",
    difficulty: "Medium",
  },
  {
    topic: "Coin Change",
    category: "Dynamic Programming",
    difficulty: "Medium",
  },
  {
    topic: "Longest Increasing Subsequence",
    category: "Dynamic Programming",
    difficulty: "Medium",
  },
  {
    topic: "Word Break",
    category: "Dynamic Programming",
    difficulty: "Medium",
  },
  {
    topic: "Edit Distance",
    category: "Dynamic Programming",
    difficulty: "Hard",
  },
];

// Common behavioral prompts (STAR-ready).
export const BEHAVIORAL_PROMPTS = [
  "Tell me about yourself.",
  "Why do you want to work here?",
  "Tell me about a time you handled conflict on a team.",
  "Describe a project you're most proud of and why.",
  "Tell me about a time you failed. What did you learn?",
  "Describe a time you had to make a decision without enough data.",
  "Tell me about a time you disagreed with your manager.",
  "How do you prioritize when you have too much to do?",
  "Tell me about a time you took initiative.",
  "Describe a time you mentored someone or improved a team's process.",
  "Tell me about a difficult bug you debugged.",
  "Tell me about a time you delivered something on a tight deadline.",
];

// Common system-design cases.
export const SYSTEM_DESIGN_CASES = [
  { name: "Design URL shortener (TinyURL/bit.ly)", area: "Web" },
  { name: "Design Twitter / news feed", area: "Social" },
  { name: "Design Instagram", area: "Social" },
  { name: "Design WhatsApp / chat system", area: "Messaging" },
  { name: "Design Uber / ride hailing", area: "Realtime" },
  { name: "Design Netflix / video streaming", area: "Media" },
  { name: "Design Dropbox / file storage", area: "Storage" },
  { name: "Design YouTube", area: "Media" },
  { name: "Design rate limiter", area: "Infra" },
  { name: "Design web crawler", area: "Infra" },
  { name: "Design notification system", area: "Infra" },
  { name: "Design search autocomplete", area: "Search" },
  { name: "Design distributed cache", area: "Infra" },
  { name: "Design Google Docs (collaborative editor)", area: "Realtime" },
  { name: "Design ad-click aggregator", area: "Data" },
];

export const MOCK_TYPES = [
  "DSA",
  "Behavioral",
  "System Design",
  "Take-home",
  "Onsite (mixed)",
];

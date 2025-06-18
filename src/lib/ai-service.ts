import { model } from '@/firebase-config';
import axios from 'axios';

const fetchRedditGif = async (keyword?: string): Promise<string | null> => {
  try {
    // Clean and extract the most relevant keyword
    const getRelevantKeyword = (keyword: string | undefined): string => {
      if (!keyword) return 'programming';
      
      const cleaned = keyword.replace(/<[^>]*>?/gm, '') // Remove HTML tags
                           .split(/[\s,]+/) // Split into words
                           .find(word => word.length > 3 && !word.match(/^(a|an|the|your|their|is|are|was|were)$/i)) 
                           || 'programming';
      
      return cleaned;
    };

    const keywordToSearch = getRelevantKeyword(keyword);

    // Use only programming-related subreddits that allow hotlinking
    const subreddits = [
      'ProgrammerHumor',
      'codingmemes',
      'programmingmemes',
      'codinghumor'
    ];
    
    // Try each subreddit until we find a GIF
    for (const subreddit of subreddits) {
      try {
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(keywordToSearch)}&restrict_sr=1&limit=30&sort=hot`,
          {
            headers: {
              'User-Agent': 'Codeforces-Coach/1.0'
            }
          }
        );
        
        // Find posts with GIFs (either .gif extension or imgur/gfycat)
        const postsWithGifs = response.data.data.children.filter((post: any) => {
          if (post.data.over_18) return false; // Skip NSFW content
          const url = post.data.url;
          return (
            url.endsWith('.gif') || 
            url.includes('gfycat.com') || 
            url.includes('redgifs.com') ||
            (url.includes('imgur.com') && (url.endsWith('.gifv') || url.includes('.gif')))
          );
        });
        
        if (postsWithGifs.length > 0) {
          // Get a random GIF from the top results
          const randomIndex = Math.floor(Math.random() * Math.min(5, postsWithGifs.length));
          let gifUrl = postsWithGifs[randomIndex].data.url;
          
          // Convert formats for better compatibility
          if (gifUrl.includes('gfycat.com')) {
            gifUrl = `https://thumbs.gfycat.com/${gifUrl.split('/').pop()}-size_restricted.gif`;
          } else if (gifUrl.includes('imgur.com') && gifUrl.endsWith('.gifv')) {
            gifUrl = gifUrl.replace('.gifv', '.gif');
          } else if (gifUrl.includes('redgifs.com')) {
            gifUrl = gifUrl.replace('redgifs.com', 'thumbs.redgifs.com') + '.gif';
          }
          
          return gifUrl;
        }
      } catch (error) {
        console.warn(`Error fetching from r/${subreddit}:`, error);
        continue;
      }
    }
    return null;
  } catch (error) {
    console.error('Error in fetchRedditGif:', error);
    return null;
  }
};

const FALLBACK_GIFS: Record<string, string> = {
  'dynamic programming': 'https://i.imgur.com/nQXZR.gif',
  'graph theory': 'https://i.imgur.com/1X2rK.gif',
  'binary search': 'https://i.imgur.com/3J7VC.gif',
  'greedy algorithms': 'https://i.imgur.com/5HJ8p.gif',
  'data structures': 'https://i.imgur.com/9QZ7L.gif',
  'default': 'https://i.imgur.com/V9Xz5.gif'
};

const getFallbackGif = (keyword: string): string => {
  const lowerKeyword = keyword.toLowerCase();
  for (const [topic, url] of Object.entries(FALLBACK_GIFS)) {
    if (lowerKeyword.includes(topic)) {
      return url;
    }
  }
  return FALLBACK_GIFS.default;
};

const systemPrompt = `
You are CF Code Coach, a senior competitive programming advisor with 10+ years of experience coaching ICPC medalists. 
Provide expert-level analysis with these guidelines:

1. Format responses in clean HTML with proper spacing
2. Use competitive programming terminology accurately
3. Structure advice in clear sections
4. Include specific problem recommendations with Codeforces links
5. Add relevant meme/GIFs for engagement (use placeholder <!-- MEME_PLACEHOLDER -->)
6. Maintain a professional yet encouraging tone
7. Focus on actionable insights
8. Credit as "CF Code Coach Analysis"

Example format:
<h3 class="text-lg font-bold mb-2">Strengths Analysis</h3>
<p>Your performance in <b>dynamic programming</b> problems is strong...</p>

<h3 class="text-lg font-bold mt-4 mb-2">Recommended Problem Set</h3>
<ul class="list-disc pl-5 space-y-1">
  <li><a href="https://codeforces.com/problemset/problem/1234/D" class="text-blue-600 hover:underline">Problem 1234D - DP Optimization</a> (Rating: 1800)</li>
</ul>

<!-- MEME_PLACEHOLDER -->

<p class="text-sm text-gray-600 mt-4">CF Code Coach Analysis</p>
`;

export const generateContent = async (prompt: string): Promise<string> => {
  try {
    const result = await model.generateContent(`${systemPrompt}\n\nUser Prompt: ${prompt}`);
    const response = result.response;
    
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let content = response.candidates[0].content.parts[0].text;
      
      // Extract the most relevant single keyword for meme search
      const getKeyword = (content: string): string => {
        const weaknessMatch = content.match(/weakness(?:es)?.*?[\n:]\s*(.+?)(?=[\n<])/i);
        const focusMatch = content.match(/Focus:\s*(.+?)(?=[\n<])/i);
        const recommendMatch = content.match(/recommend.*?[\n:]\s*(.+?)(?=[\n<])/i);
        
        const keyword = weaknessMatch?.[1] || focusMatch?.[1] || recommendMatch?.[1];
        
        if (!keyword) return 'programming';
        
        // Extract the first technical term
        const terms = keyword.match(/\b(?:dp|dynamic programming|graphs?|trees?|binary search|greedy|dfs|bfs|dijkstra|floyd|mst|union find|trie|segment tree|bitmask|backtracking)\b/i);
        return terms?.[0].toLowerCase() || 'programming';
      };
      
      const keyword = getKeyword(content);
      let memeUrl = await fetchRedditGif(keyword);
      
      // If Reddit fails, use fallback
      if (!memeUrl) {
        memeUrl = getFallbackGif(keyword);
      }
      
      // Insert meme into content
      if (memeUrl) {
        const memeHtml = `
          <div class="my-6 text-center">
            <img src="${memeUrl}" alt="${keyword} meme" 
                 class="rounded-lg max-w-full mx-auto" style="max-height: 300px; max-width: 500px;" 
                 onerror="this.onerror=null;this.src='${FALLBACK_GIFS.default}'"/>
            <p class="text-xs text-gray-500 mt-1">Source: ${memeUrl.includes('imgur.com') ? 'Imgur' : 'Reddit'}</p>
          </div>
        `;
        content = content.replace('<!-- MEME_PLACEHOLDER -->', memeHtml);
      }
      
      return content;
    }
    return "<p>No response generated. Please try again.</p>";
  } catch (error) {
    console.error('AI Generation Error:', error);
    return "<p>Error generating analysis. Our servers are busy training on Codeforces problems. Try again soon!</p>";
  }
};


export const analyzePerformance = async (student: any, submissions: any[], ratingHistory: any[]): Promise<string> => {
  // Calculate problem solving statistics
  const solvedProblems = new Map<string, { rating: number }>();
  const solvedByRating: Record<number, number> = {};

  submissions?.forEach((submission) => {
    if (submission.verdict === 'OK') {
      const problemKey = `${submission.contestId}_${submission.problemIndex}`;
      if (!solvedProblems.has(problemKey) && submission.problemRating) {
        const ratingBucket = Math.floor(submission.problemRating / 100) * 100;
        solvedByRating[ratingBucket] = (solvedByRating[ratingBucket] || 0) + 1;
      }
    }
  });

  // Calculate rating changes
  const ratingChanges = ratingHistory?.map((contest) => {
    const change = contest.newRating - contest.oldRating;
    return {
      contest: contest.contestName,
      change,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
    };
  });

  const prompt = `
  Analyze this competitive programmer's profile in depth:

  **Student Profile**
  - Name: ${student.name}
  - Handle: ${student.codeforcesHandle}
  - Current Rating: ${student.currentRating}
  - Max Rating: ${student.maxRating}
  - Problems Attempted: ${submissions?.length || 0}
  - Problems Solved: ${solvedProblems.size}

  **Rating History**
  ${ratingChanges?.slice(0, 5).map(c => 
    `- ${c.contest}: ${c.change >= 0 ? '+' : ''}${c.change} (${c.date})`
  ).join('\n') || 'No contest history available'}

  **Solved Problems Distribution**
  ${Object.entries(solvedByRating)
    .map(([rating, count]) => `- ${rating}-${Number(rating)+99}: ${count} solved`)
    .join('\n') || 'No solved problems data'}

  Provide a comprehensive analysis with:
  1. Detailed strengths assessment
  2. Key weaknesses to address
  3. Rating trajectory analysis
  4. Personalized 2-week training plan
  5. Curated problem set (include direct Codeforces links)
  6. Contest strategy recommendations
  7. Motivational closing thoughts with GIF
  `;

  return generateContent(prompt);
};

export const generateWeakAreaPlan = async (student: any, weakArea: string): Promise<string> => {
  const prompt = `
  Create an intensive 1-week focused training plan for ${student.name} (Rating: ${student.currentRating}) 
  to improve their ${weakArea} skills.

  Include:
  1. Fundamental concepts to review
  2. 3-5 key problems with increasing difficulty (include Codeforces links)
  3. Recommended learning resources
  4. Practice techniques
  5. Common pitfalls to avoid
  6. Self-assessment checklist
  7. Motivational GIF related to ${weakArea}
  `;

  return generateContent(prompt);
};

export const recommendDailyProblems = async (student: any): Promise<string> => {
  const prompt = `
  Generate a personalized daily problem set for ${student.name} (Rating: ${student.currentRating}).
  
  Requirements:
  - 5 problems total
  - Mix of problem types
  - Slightly above current skill level
  - Include 1 "challenge" problem
  - Direct Codeforces links
  - Organized by estimated solving time
  - Add relevant GIF

  Format as:
  <h3>Today's Training Menu</h3>
  <ol>
    <li><a href="...">Problem Name</a> (Rating: X) - Focus: Y - Est: Z min</li>
  </ol>
  `;

  return generateContent(prompt);
};
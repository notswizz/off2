/**
 * OpenAI-powered recruiting trend analyzer
 * Uses GPT-4.1 Responses API with web search
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// School logo mapping (common schools)
const SCHOOL_LOGOS = {
  'Alabama': 'https://on3static.com/uploads/assets/162/27/27162.svg',
  'Auburn': 'https://on3static.com/uploads/assets/163/27/27163.svg',
  'Georgia': 'https://on3static.com/uploads/assets/203/27/27203.svg',
  'LSU': 'https://on3static.com/uploads/assets/237/27/27237.svg',
  'Ohio State': 'https://on3static.com/uploads/assets/278/27/27278.svg',
  'Texas': 'https://on3static.com/uploads/assets/320/27/27320.svg',
  'USC': 'https://on3static.com/uploads/assets/327/27/27327.svg',
  'Michigan': 'https://on3static.com/uploads/assets/252/27/27252.svg',
  'Florida': 'https://on3static.com/uploads/assets/199/27/27199.svg',
  'Florida State': 'https://on3static.com/uploads/assets/200/27/27200.svg',
  'Clemson': 'https://on3static.com/uploads/assets/181/27/27181.svg',
  'Oklahoma': 'https://on3static.com/uploads/assets/279/27/27279.svg',
  'Tennessee': 'https://on3static.com/uploads/assets/318/27/27318.svg',
  'Oregon': 'https://on3static.com/uploads/assets/283/27/27283.svg',
  'Penn State': 'https://on3static.com/uploads/assets/288/27/27288.svg',
  'Notre Dame': 'https://on3static.com/uploads/assets/275/27/27275.svg',
  'Miami': 'https://on3static.com/uploads/assets/251/27/27251.svg',
  'Texas A&M': 'https://on3static.com/uploads/assets/321/27/27321.svg',
  'Kentucky': 'https://on3static.com/uploads/assets/232/27/27232.svg',
  'South Carolina': 'https://on3static.com/uploads/assets/307/27/27307.svg',
  'Ole Miss': 'https://on3static.com/uploads/assets/280/27/27280.svg',
  'Arkansas': 'https://on3static.com/uploads/assets/164/27/27164.svg',
  'Missouri': 'https://on3static.com/uploads/assets/259/27/27259.svg',
  'Colorado': 'https://on3static.com/uploads/assets/184/27/27184.svg',
  'Nebraska': 'https://on3static.com/uploads/assets/265/27/27265.svg',
  'Wisconsin': 'https://on3static.com/uploads/assets/337/27/27337.svg',
  'Iowa': 'https://on3static.com/uploads/assets/224/27/27224.svg',
  'UCLA': 'https://on3static.com/uploads/assets/324/27/27324.svg',
  'Washington': 'https://on3static.com/uploads/assets/333/27/27333.svg',
  'Arizona': 'https://on3static.com/uploads/assets/161/27/27161.svg',
  'Arizona State': 'https://on3static.com/uploads/assets/162/27/27162.svg',
  'Utah': 'https://on3static.com/uploads/assets/328/27/27328.svg',
  'Baylor': 'https://on3static.com/uploads/assets/167/27/27167.svg',
  'TCU': 'https://on3static.com/uploads/assets/317/27/27317.svg',
  'SMU': 'https://on3static.com/uploads/assets/305/27/27305.svg',
  'USF': 'https://on3static.com/uploads/assets/306/27/27306.svg',
  'UCF': 'https://on3static.com/uploads/assets/322/27/27322.svg',
  'NC State': 'https://on3static.com/uploads/assets/270/27/27270.svg',
  'Duke': 'https://on3static.com/uploads/assets/195/27/27195.svg',
  'North Carolina': 'https://on3static.com/uploads/assets/274/27/27274.svg',
  'Virginia': 'https://on3static.com/uploads/assets/331/27/27331.svg',
  'Virginia Tech': 'https://on3static.com/uploads/assets/332/27/27332.svg',
  'West Virginia': 'https://on3static.com/uploads/assets/335/27/27335.svg',
  'Pittsburgh': 'https://on3static.com/uploads/assets/289/27/27289.svg',
  'Syracuse': 'https://on3static.com/uploads/assets/315/27/27315.svg',
  'Boston College': 'https://on3static.com/uploads/assets/170/27/27170.svg',
  'Louisville': 'https://on3static.com/uploads/assets/236/27/27236.svg',
  'Indiana': 'https://on3static.com/uploads/assets/222/27/27222.svg',
  'Purdue': 'https://on3static.com/uploads/assets/292/27/27292.svg',
  'Minnesota': 'https://on3static.com/uploads/assets/256/27/27256.svg',
  'Illinois': 'https://on3static.com/uploads/assets/220/27/27220.svg',
  'Michigan State': 'https://on3static.com/uploads/assets/253/27/27253.svg',
  'Northwestern': 'https://on3static.com/uploads/assets/276/27/27276.svg',
  'Maryland': 'https://on3static.com/uploads/assets/247/27/27247.svg',
  'Rutgers': 'https://on3static.com/uploads/assets/295/27/27295.svg',
  'Kansas': 'https://on3static.com/uploads/assets/228/27/27228.svg',
  'Kansas State': 'https://on3static.com/uploads/assets/229/27/27229.svg',
  'Iowa State': 'https://on3static.com/uploads/assets/225/27/27225.svg',
  'Oklahoma State': 'https://on3static.com/uploads/assets/281/27/27281.svg',
  'Texas Tech': 'https://on3static.com/uploads/assets/319/27/27319.svg',
  'Houston': 'https://on3static.com/uploads/assets/218/27/27218.svg',
  'Cincinnati': 'https://on3static.com/uploads/assets/180/27/27180.svg',
  'BYU': 'https://on3static.com/uploads/assets/173/27/27173.svg',
  'Stanford': 'https://on3static.com/uploads/assets/311/27/27311.svg',
  'California': 'https://on3static.com/uploads/assets/176/27/27176.svg',
};

function getSchoolLogo(schoolName) {
  // Try exact match first
  if (SCHOOL_LOGOS[schoolName]) return SCHOOL_LOGOS[schoolName];
  
  // Try partial match
  const key = Object.keys(SCHOOL_LOGOS).find(k => 
    schoolName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(schoolName.toLowerCase())
  );
  return key ? SCHOOL_LOGOS[key] : null;
}

/**
 * Call OpenAI Responses API with web search
 */
async function callResponsesAPI(inputText) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1',
      input: inputText,
      text: { format: { type: 'text' } },
      reasoning: {},
      tools: [{
        type: 'web_search',
        user_location: { type: 'approximate' },
        search_context_size: 'medium'
      }],
      temperature: 1,
      max_output_tokens: 2048,
      top_p: 1,
      store: true,
      include: ['web_search_call.action.sources']
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function extractResponseText(result) {
  let text = '';
  let sources = [];
  
  if (result.output) {
    for (const item of result.output) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text') {
            text += content.text;
          }
        }
      }
      if (item.type === 'web_search_call' && item.action?.sources) {
        sources.push(...item.action.sources);
      }
    }
  }
  
  return { text, sources };
}

/**
 * Main analysis function
 */
export async function analyzeRecruitingTrends(playerName, existingData = [], playerInfo = {}) {
  const prompt = `Search for recruiting news about ${playerName}${playerInfo.position ? ` (${playerInfo.position})` : ''}.

Find: commitment status, crystal balls, school interest, timeline.

Reply ONLY with this JSON (no extra text):
{
  "player": "${playerName}",
  "status": "committed/in portal/uncommitted",
  "summary": "1-2 sentences max",
  "timeline": "key dates only",
  "predictions": [{"school": "Name", "confidence": 85, "reason": "brief reason"}],
  "crystalBalls": "brief CB info or null",
  "visits": ["school1", "school2"],
  "sources": ["source names"]
}

Be concise. Only include what you actually find.`;

  try {
    console.log(`Searching: ${playerName}`);
    const result = await callResponsesAPI(prompt);
    const { text: responseText, sources } = extractResponseText(result);
    
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { player: playerName, summary: responseText, predictions: [] };
      }
    } catch {
      analysis = { player: playerName, summary: responseText, predictions: [] };
    }
    
    // Add logos to predictions
    if (analysis.predictions) {
      analysis.predictions = analysis.predictions.map(pred => ({
        ...pred,
        logo: getSchoolLogo(pred.school)
      }));
    }
    
    // Add logos to visits
    if (analysis.visits) {
      analysis.visits = analysis.visits.map(school => ({
        name: school,
        logo: getSchoolLogo(school)
      }));
    }
    
    return {
      ...analysis,
      webSearchSources: sources.slice(0, 5),
      webSearchEnabled: true,
      model: 'gpt-4.1',
      analysisTimestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('API error:', error.message);
    return await fallbackAnalysis(playerName, existingData, playerInfo);
  }
}

async function fallbackAnalysis(playerName, data = [], playerInfo = {}) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Recruiting status for ${playerName}? JSON: {player, summary (1 sentence), predictions: [{school, confidence, reason}]}`
    }],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' }
  });

  const analysis = JSON.parse(completion.choices[0].message.content);
  
  if (analysis.predictions) {
    analysis.predictions = analysis.predictions.map(pred => ({
      ...pred,
      logo: getSchoolLogo(pred.school)
    }));
  }

  return {
    ...analysis,
    webSearchEnabled: false,
    model: 'gpt-4o-fallback',
    analysisTimestamp: new Date().toISOString()
  };
}

export async function detectCommitmentSignals(playerName) {
  const prompt = `Any commitment signals for ${playerName}? JSON only: {"player":"${playerName}","signals":[],"urgency":"high/medium/low","date":null,"destination":null}`;

  try {
    const result = await callResponsesAPI(prompt);
    const { text, sources } = extractResponseText(result);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (data.destination) {
        data.destinationLogo = getSchoolLogo(data.destination);
      }
      return { ...data, webSearchSources: sources.slice(0, 3), analyzedAt: new Date().toISOString() };
    }
    
    return { player: playerName, signals: [], urgency: 'low', analyzedAt: new Date().toISOString() };
  } catch (error) {
    return { player: playerName, signals: [], urgency: 'unknown', error: error.message };
  }
}

export async function batchAnalyze(playerTweets) {
  const results = {};
  for (const [player] of Object.entries(playerTweets)) {
    results[player] = await analyzeRecruitingTrends(player, [], {});
    await new Promise(r => setTimeout(r, 2000));
  }
  return results;
}

export async function generateIntelReport(analyses) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  const text = analyses.map(a => `${a.player}: ${a.summary}`).join('\n');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: `Brief summary:\n${text}` }],
    max_tokens: 400
  });

  return {
    report: completion.choices[0].message.content,
    generatedAt: new Date().toISOString(),
    playersAnalyzed: analyses.length
  };
}

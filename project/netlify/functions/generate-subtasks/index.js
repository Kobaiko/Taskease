import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { title, description } = JSON.parse(event.body);

    if (!title || !description) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'Both title and description are required'
        })
      };
    }

    const prompt = `Analyze and break down the following task into detailed subtasks:

TASK INFORMATION:
Title: ${title}
Description: ${description}

ANALYSIS REQUIREMENTS:
- Generate between 10-20 subtasks
- Each subtask must be:
  • Clearly defined with specific outcomes
  • Self-contained and independently actionable
  • Properly scoped (not too broad or too narrow)
  • Labeled with required skills/resources

For each subtask, provide:
- Clear, action-oriented description
- Estimated time (in minutes, maximum 60 per subtask)
- Complexity level (Low/Medium/High)
- Priority level (1-3, where 1 is highest)
- Dependencies on other subtasks
- Prerequisites (knowledge/tools needed)

Consider including:
- Setup and preparation steps
- Quality assurance and testing
- Documentation requirements
- Review and approval stages
- Potential roadblocks
- Contingency time for issues

Return ONLY a JSON object with the following structure:
{
  "analysis": {
    "totalEstimatedTime": "X-Y hours",
    "recommendedTeamSize": X,
    "keySkills": ["skill1", "skill2"]
  },
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Clear description",
      "estimatedTime": 30,
      "complexity": "Low/Medium/High",
      "priority": 1,
      "dependencies": ["subtask1", "subtask2"],
      "prerequisites": ["prerequisite1", "prerequisite2"],
      "challenges": ["challenge1", "challenge2"]
    }
  ],
  "criticalPath": ["step1", "step2"],
  "risks": ["risk1", "risk2"]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional project manager and task analysis expert. Provide detailed, actionable task breakdowns with realistic time estimates and comprehensive analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and sanitize subtasks
    const sanitizedSubtasks = result.subtasks.map(subtask => ({
      title: String(subtask.title).trim(),
      description: String(subtask.description).trim(),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60),
      complexity: String(subtask.complexity),
      priority: Number(subtask.priority),
      dependencies: Array.isArray(subtask.dependencies) ? subtask.dependencies : [],
      prerequisites: Array.isArray(subtask.prerequisites) ? subtask.prerequisites : [],
      challenges: Array.isArray(subtask.challenges) ? subtask.challenges : []
    }));

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis: result.analysis,
        subtasks: sanitizedSubtasks,
        criticalPath: result.criticalPath,
        risks: result.risks
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate subtasks',
        details: error.message
      })
    };
  }
};
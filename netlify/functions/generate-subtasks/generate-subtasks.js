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
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Parse the incoming request body
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

    console.log('Generating subtasks for:', { title, description });

    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "system", 
        content: "You are a task breakdown assistant. Always respond with valid JSON containing subtasks array."
      }, {
        role: "user",
        content: `Break down this task into smaller subtasks (max 60 minutes each):
        Task: ${title}
        Description: ${description}
        
        Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
        Example: {"subtasks": [{"title": "Research competitors", "estimatedTime": 45}]}`
      }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    console.log('OpenAI response:', content);

    const result = JSON.parse(content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and sanitize subtasks
    const sanitizedSubtasks = result.subtasks.map(subtask => ({
      title: String(subtask.title).trim(),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60)
    }));

    console.log('Sanitized subtasks:', sanitizedSubtasks);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtasks: sanitizedSubtasks })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    // Return a more detailed error response
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate subtasks',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    'OpenAI API key is missing. Please add VITE_OPENAI_API_KEY to your .env file.'
  );
}

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string) {
  try {
    const prompt = `Break down this task into smaller subtasks (max 60 minutes each):
Title: ${title}
Description: ${description}

Return only a JSON array of objects with 'title' and 'estimatedTime' (in minutes) properties.
Example: [{"title": "Research competitors", "estimatedTime": 45}]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a task breakdown assistant. Provide detailed subtasks with realistic time estimates." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    const result = JSON.parse(content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return result.subtasks.map(subtask => ({
      id: crypto.randomUUID(),
      title: subtask.title,
      estimatedTime: Math.min(subtask.estimatedTime, 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate subtasks: ${error.message}`);
    }
    throw new Error('Failed to generate subtasks. Please try again.');
  }
}
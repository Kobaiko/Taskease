import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface SubtaskResponse {
  subtasks: Array<{
    title: string;
    estimatedTime: number;
  }>;
}

export async function generateSubtasks(title: string, description: string) {
  try {
    const prompt = `Break down this task into smaller subtasks, each taking no more than 60 minutes:
    Task Title: ${title}
    Description: ${description}
    
    Return only a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
    Example format:
    {
      "subtasks": [
        {"title": "Research requirements", "estimatedTime": 45},
        {"title": "Create initial draft", "estimatedTime": 60}
      ]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task breakdown assistant that returns only valid JSON responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    const result = JSON.parse(content) as SubtaskResponse;
    
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
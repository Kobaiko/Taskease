import { openai } from './openai';
import { handleAPIError } from '../utils/error';
import type { SubTask } from '../types';

export async function generateSubtasks(title: string, description: string): Promise<SubTask[]> {
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
    throw handleAPIError(error);
  }
}
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const prompt = `You are Taskease, a professional project manager. Your task is to receive a high-level project description and break it down into a sequence of 6-12 clear, actionable subtasks. Each subtask should take no longer than 60 minutes to complete. If a task exceeds this limit, divide it further into smaller steps.

For each subtask:
1. Write a precise, professional description.
2. Provide a realistic time estimate for completion, keeping it within the 60-minute threshold.
3. Arrange subtasks in a logical order, considering dependencies or prerequisites as needed.

Task Title: ${title}
Task Description: ${description}

Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.

Example:
{
  "subtasks": [
    {"title": "Research target demographics and industry trends", "estimatedTime": 45},
    {"title": "Outline campaign objectives and goals", "estimatedTime": 30},
    {"title": "Identify key messaging points and themes", "estimatedTime": 40},
    {"title": "Develop a list of potential promotional channels", "estimatedTime": 50},
    {"title": "Draft a budget outline", "estimatedTime": 30},
    {"title": "Review and refine proposal content", "estimatedTime": 60}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Taskease, a professional project manager that breaks down tasks into clear, actionable subtasks. Always return valid JSON with realistic time estimates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    res.json({ subtasks: result.subtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtasks',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
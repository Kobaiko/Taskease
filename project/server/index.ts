import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { title, description } = req.body;

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

    const response = JSON.parse(completion.choices[0].message.content);
    
    res.json({ subtasks: response.subtasks });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import OpenAI from 'openai';
import { getOpenAIConfig } from '../config/openai';

const { apiKey } = getOpenAIConfig();

const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
});

export { openai };
import {genkit} from 'genkit';
import {groq, llama3x70b} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq()],
  model: llama3x70b,
});

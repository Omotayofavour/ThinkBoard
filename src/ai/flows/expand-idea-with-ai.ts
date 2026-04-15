'use server';
/**
 * @fileOverview An AI agent that expands on a brief idea, offering detailed suggestions or related concepts.
 *
 * - expandIdeaWithAI - A function that handles the idea expansion process.
 * - ExpandIdeaInput - The input type for the expandIdeaWithAI function.
 * - ExpandIdeaOutput - The return type for the expandIdeaWithAI function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExpandIdeaInputSchema = z.object({
  title: z.string().describe('The title of the brief idea.'),
  description: z
    .string()
    .describe(
      'A brief description of the idea that needs to be expanded upon.'
    ),
});
export type ExpandIdeaInput = z.infer<typeof ExpandIdeaInputSchema>;

const ExpandIdeaOutputSchema = z.object({
  expandedIdea: z.string().describe('The detailed, expanded version of the idea, including suggestions and related concepts.'),
});
export type ExpandIdeaOutput = z.infer<typeof ExpandIdeaOutputSchema>;

export async function expandIdeaWithAI(
  input: ExpandIdeaInput
): Promise<ExpandIdeaOutput> {
  return expandIdeaFlow(input);
}

const expandIdeaPrompt = ai.definePrompt({
  name: 'expandIdeaPrompt',
  input: { schema: ExpandIdeaInputSchema },
  output: { schema: ExpandIdeaOutputSchema },
  config: {
    maxOutputTokens: 200,
    temperature: 0.5
  },
  prompt: `You are a highly creative but extremely concise AI assistant.
Your task is to take a brief idea and provide a lightning-fast expansion. 

CRITICAL RULES:
- Be incredibly brief.
- Provide a maximum of 2 short bullet points.
- Do NOT exceed 50-70 words total, or your response will be abruptly cut off.

Idea Title: {{{title}}}
Idea Description: {{{description}}}`,
});

const expandIdeaFlow = ai.defineFlow(
  {
    name: 'expandIdeaFlow',
    inputSchema: ExpandIdeaInputSchema,
    outputSchema: ExpandIdeaOutputSchema,
  },
  async (input) => {
    // Artificial 2.5-second delay to throttle rapid clicks and reduce backend pressure
    await new Promise(resolve => setTimeout(resolve, 2500));

    const { output } = await expandIdeaPrompt(input);
    return output!;
  }
);

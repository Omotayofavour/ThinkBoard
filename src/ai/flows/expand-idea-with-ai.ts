'use server';
/**
 * @fileOverview An AI agent that expands on a brief idea, offering detailed suggestions or related concepts.
 *
 * - expandIdeaWithAI - A function that handles the idea expansion process.
 * - ExpandIdeaInput - The input type for the expandIdeaWithAI function.
 * - ExpandIdeaOutput - The return type for the expandIdeaWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  input: {schema: ExpandIdeaInputSchema},
  output: {schema: ExpandIdeaOutputSchema},
  prompt: `You are a highly creative and insightful AI assistant, specializing in brainstorming and idea development.
Your task is to take a brief idea and expand upon it, providing detailed suggestions, related concepts, potential avenues for development, and any other creative insights that could stimulate further thought.

Be thorough, imaginative, and practical in your suggestions. Consider different angles, applications, or problems the idea could solve.

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
    const {output} = await expandIdeaPrompt(input);
    return output!;
  }
);

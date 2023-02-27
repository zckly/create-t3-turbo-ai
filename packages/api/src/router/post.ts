import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms";
import { PromptTemplate } from "langchain/prompts";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.post.findFirst({ where: { id: input } });
  }),
  create: publicProcedure
    .input(z.object({ title: z.string().min(1), }))
    .mutation(async ({ ctx, input }) => {
      const model = new OpenAI({ temperature: 0.9 });
      
      const template = "What is a good name for a company that makes {product}?";
      const prompt = new PromptTemplate({
        template: template,
        inputVariables: ["product"],
      });
      const chain = new LLMChain({ llm: model, prompt: prompt });

      const res = await chain.call({ product: input.title });

      const output = res.text as string; 

      return ctx.prisma.post.create({ data: {
        title: output,
        content: input.title 
      }});
    }),
  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.prisma.post.delete({ where: { id: input } });
  }),
});

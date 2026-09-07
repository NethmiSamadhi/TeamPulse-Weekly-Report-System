import type { NextFunction, Request, Response } from "express";
import { answerManagerQuestion } from "../services/assistant.service.js";
import { assistantQuestionSchema } from "../validators/assistant.validator.js";

export async function askAssistant(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const validation = assistantQuestionSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      success: false,
      message: "Invalid assistant question",
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const result = await answerManagerQuestion(validation.data);
    response.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

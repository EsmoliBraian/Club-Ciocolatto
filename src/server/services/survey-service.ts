import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/server/services/loyalty-service";
import { getLoyaltyConfig } from "@/server/services/config-service";

export class SurveyError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function getSurveyStateForCustomer(customerProfileId: string) {
  const config = await getLoyaltyConfig();
  if (!config.surveyQuestion) return { question: null, alreadyAnswered: false };

  const existing = await prisma.surveyResponse.findUnique({ where: { customerProfileId } });
  return { question: config.surveyQuestion, alreadyAnswered: !!existing };
}

/** Any answer counts — no verification, no admin approval. One lifetime response per customer. */
export async function submitSurveyResponse(customerProfileId: string, answer: string) {
  const config = await getLoyaltyConfig();
  if (!config.surveyQuestion) {
    throw new SurveyError("SURVEY_OFF", "La encuesta no está disponible.");
  }

  const existing = await prisma.surveyResponse.findUnique({ where: { customerProfileId } });
  if (existing) {
    throw new SurveyError("ALREADY_ANSWERED", "Ya respondiste esta encuesta.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.surveyResponse.create({
      data: { customerProfileId, question: config.surveyQuestion!, answer },
    });

    if (config.surveyPoints > 0) {
      await awardPoints(
        {
          customerProfileId,
          type: "EARN",
          source: "SURVEY_RESPONSE",
          amount: config.surveyPoints,
          description: "Gracias por tu opinión 💬",
          referenceType: "SurveyResponse",
        },
        tx
      );
    }
  });
}

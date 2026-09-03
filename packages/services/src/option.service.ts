import {
  findQuestionById,
  getQuizById,
  createOption as createOptionRepo,
  findOptionById,
  findOptionsByQuestion,
  updateOption as updateOptionRepo,
  deleteOption as deleteOptionRepo,
  countOptionsByQuestion,
} from "@eduflow/repositories";

export async function createOption(data: any, userId: string) {
  if (!data.question_id) {
    throw new Error("question_id is required");
  }

  const question = await findQuestionById(data.question_id);
  if (!question) throw new Error("Question not found");

  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error("Quiz not found");
  if (quiz.instructor_id !== userId) throw new Error("Not authorized");
  if (quiz.status !== "draft") throw new Error("Cannot add options to a non-draft quiz");

  if (!["mcq", "true_false"].includes(question.question_type)) {
    throw new Error("Options can only be added to MCQ or True/False questions");
  }

  const existingOptions = await findOptionsByQuestion(data.question_id);
  let order = data.order_in_question;
  if (!order) {
    order = existingOptions.length + 1;
  }

  return createOptionRepo({
    ...data,
    order_in_question: order,
  });
}

export async function updateOption(id: string, data: any, userId: string) {
  const option = await findOptionById(id);
  if (!option) throw new Error("Option not found");

  const question = await findQuestionById(option.question_id);
  if (!question) throw new Error("Question not found");

  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error("Quiz not found");
  if (quiz.instructor_id !== userId) throw new Error("Not authorized");
  if (quiz.status !== "draft") throw new Error("Cannot update options in a non-draft quiz");

  return updateOptionRepo(id, data);
}

export async function deleteOption(id: string, userId: string) {
  const option = await findOptionById(id);
  if (!option) throw new Error("Option not found");

  const question = await findQuestionById(option.question_id);
  if (!question) throw new Error("Question not found");

  const quiz = await getQuizById(question.quiz_id);
  if (!quiz) throw new Error("Quiz not found");
  if (quiz.instructor_id !== userId) throw new Error("Not authorized");
  if (quiz.status !== "draft") throw new Error("Cannot delete options in a non-draft quiz");

  const count = await countOptionsByQuestion(question.id);
  if (count <= 2) {
    throw new Error("MCQ questions must have at least 2 options");
  }

  await deleteOptionRepo(id);
}

export async function getOptionsByQuestion(questionId: string) {
  return findOptionsByQuestion(questionId);
}
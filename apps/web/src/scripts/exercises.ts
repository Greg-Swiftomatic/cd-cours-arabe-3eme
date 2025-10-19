const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

export const toArabicDigits = (value: number | string) =>
  value
    .toString()
    .replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);

type ExerciseElement = HTMLElement & {
  dataset: DOMStringMap & { correct?: string };
};

const CHECKED_ICON =
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />';
const ERROR_ICON =
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856C19.403 19 20 18.403 20 17.694V6.306C20 5.597 19.403 5 18.694 5H5.306C4.597 5 4 5.597 4 6.306v11.388C4 18.403 4.597 19 5.306 19z" />';

function showFeedback(
  exercise: HTMLElement,
  { correct, message }: { correct: boolean; message: string },
) {
  const feedback = exercise.querySelector<HTMLElement>("[data-feedback]");
  if (!feedback) return;
  const icon = feedback.querySelector<SVGElement>(".feedback-icon");
  const title = feedback.querySelector<HTMLElement>(".feedback-title");
  const detail = feedback.querySelector<HTMLElement>(".feedback-message");

  feedback.classList.remove("hidden");
  feedback.classList.toggle("bg-green-100", correct);
  feedback.classList.toggle("text-green-800", correct);
  feedback.classList.toggle("bg-rose-100", !correct);
  feedback.classList.toggle("text-rose-800", !correct);

  if (icon) {
    icon.innerHTML = correct ? CHECKED_ICON : ERROR_ICON;
    icon.classList.toggle("text-green-600", correct);
    icon.classList.toggle("text-rose-600", !correct);
  }

  if (title) {
    title.textContent = correct ? "إجابة صحيحة" : "حاول مجددًا";
  }

  if (detail) {
    detail.textContent = message;
  }
}

function markCompletion(exercise: HTMLElement, completed: boolean) {
  exercise.classList.toggle("completed", completed);
  exercise.classList.toggle("border-green-400", completed);
}

function evaluateMultipleChoice(exercise: ExerciseElement) {
  const correctIndex = Number(exercise.dataset.correct ?? "-1");
  const selected = exercise.querySelector<HTMLInputElement>(
    "input[type='radio']:checked",
  );
  if (!selected) {
    return { valid: false, correct: false };
  }

  const isCorrect = Number(selected.value) === correctIndex;
  return { valid: true, correct: isCorrect };
}

function evaluateFillBlank(exercise: ExerciseElement) {
  const expected = exercise.dataset.correct?.trim() ?? "";
  const input = exercise.querySelector<HTMLInputElement>("input[type='text']");
  if (!input) return { valid: false, correct: false };

  const value = input.value.trim();
  if (!value) {
    return { valid: false, correct: false };
  }

  const isCorrect = value === expected;
  return { valid: true, correct: isCorrect };
}

function evaluateMatching(exercise: HTMLElement) {
  const selects = Array.from(
    exercise.querySelectorAll<HTMLSelectElement>("select[data-correct]"),
  );
  if (selects.length === 0) {
    return { valid: false, correct: false };
  }

  let allSelected = true;
  const allCorrect = selects.every((select) => {
    const expected = select.dataset.correct ?? "";
    const value = select.value;
    if (!value) {
      allSelected = false;
    }
    return value === expected;
  });

  return { valid: allSelected, correct: allCorrect };
}

function updateBlockProgress(block: HTMLElement) {
  const exercises = block.querySelectorAll(".exercise-item");
  const completed = block.querySelectorAll(".exercise-item.completed");
  const percentage =
    exercises.length > 0 ? (completed.length / exercises.length) * 100 : 0;

  const progressBar = block.querySelector<HTMLElement>(".progress-bar");
  const progressText = block.querySelector<HTMLElement>(".progress-text");

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }

  if (progressText) {
    progressText.textContent = `${toArabicDigits(completed.length)}/${toArabicDigits(
      exercises.length,
    )}`;
  }
}

function setupExercise(exercise: HTMLElement) {
  const button = exercise.querySelector<HTMLButtonElement>(".check-answer-btn");
  if (!button) return;

  if (button.dataset.bound === "true") return;
  button.dataset.bound = "true";

  button.addEventListener("click", () => {
    const feedbackMessageCorrect =
      button.dataset.correctFeedback ?? "ممتاز! إجابة صحيحة.";
    const feedbackMessageIncorrect =
      button.dataset.incorrectFeedback ?? "حاول مرة أخرى بعد مراجعة الدرس.";

    let result = { valid: true, correct: false };

    if (exercise.dataset.correct !== undefined) {
      const input = exercise.querySelector<HTMLInputElement>("input[type='text']");
      if (input) {
        result = evaluateFillBlank(exercise as ExerciseElement);
      } else {
        result = evaluateMultipleChoice(exercise as ExerciseElement);
      }
    } else if (exercise.querySelector("select[data-correct]")) {
      result = evaluateMatching(exercise);
    } else {
      result = { valid: false, correct: false };
    }

    if (!result.valid) {
      showFeedback(exercise, {
        correct: false,
        message: "أكمل الإجابة قبل التحقق.",
      });
      return;
    }

    showFeedback(exercise, {
      correct: result.correct,
      message: result.correct ? feedbackMessageCorrect : feedbackMessageIncorrect,
    });

    markCompletion(exercise, result.correct);

    const block = exercise.closest<HTMLElement>(".exercise-block");
    if (block) {
      updateBlockProgress(block);
    }
  });
}

function setupBlocks() {
  const blocks = document.querySelectorAll<HTMLElement>(".exercise-block");
  blocks.forEach((block) => {
    updateBlockProgress(block);
    block
      .querySelectorAll<HTMLElement>(".exercise-item")
      .forEach((exercise) => setupExercise(exercise));
  });
}

export function initializeExercises() {
  if (typeof window === "undefined") return;
  if ((window as typeof window & { __exercisesInit?: boolean }).__exercisesInit) {
    return;
  }

  const run = () => {
    setupBlocks();
    (window as typeof window & { __exercisesInit?: boolean }).__exercisesInit = true;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
}

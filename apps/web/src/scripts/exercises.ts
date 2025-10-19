// Exercise interaction logic
export function initializeExercises() {
  const exerciseBlocks = document.querySelectorAll('.exercise-block');

  exerciseBlocks.forEach((block) => {
    const exercises = block.querySelectorAll('.exercise-item');
    const progressBar = block.querySelector('.progress-bar') as HTMLElement;
    const progressText = block.querySelector('.progress-text') as HTMLElement;

    let completedCount = 0;
    const totalCount = exercises.length;

    // Update progress
    function updateProgress() {
      const percentage = (completedCount / totalCount) * 100;
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (progressText) {
        const arabicCompleted = toArabicNumerals(completedCount);
        const arabicTotal = toArabicNumerals(totalCount);
        progressText.textContent = `${arabicCompleted}/${arabicTotal}`;
      }
    }

    updateProgress();

    // Handle check answer buttons
    exercises.forEach((exercise) => {
      const checkBtn = exercise.querySelector('.check-answer-btn') as HTMLButtonElement;
      const feedbackArea = exercise.querySelector('[data-feedback]') as HTMLElement;

      if (!checkBtn || !feedbackArea) return;

      checkBtn.addEventListener('click', () => {
        const exerciseType = getExerciseType(exercise);
        let isCorrect = false;

        switch (exerciseType) {
          case 'multiple-choice':
            isCorrect = checkMultipleChoice(exercise);
            break;
          case 'fill-blank':
            isCorrect = checkFillBlank(exercise);
            break;
          case 'matching':
            isCorrect = checkMatching(exercise);
            break;
        }

        showFeedback(exercise, isCorrect, checkBtn);

        if (isCorrect && !exercise.classList.contains('completed')) {
          exercise.classList.add('completed');
          completedCount++;
          updateProgress();

          // Celebration animation
          celebrateSuccess(exercise);
        }

        checkBtn.disabled = true;
      });
    });
  });
}

function getExerciseType(exercise: Element): string {
  if (exercise.querySelector('input[type="radio"]')) return 'multiple-choice';
  if (exercise.querySelector('input[type="text"]')) return 'fill-blank';
  if (exercise.querySelector('select')) return 'matching';
  return 'unknown';
}

function checkMultipleChoice(exercise: Element): boolean {
  const correctAnswer = exercise.getAttribute('data-correct');
  const selected = exercise.querySelector('input[type="radio"]:checked') as HTMLInputElement;

  if (!selected) {
    alert('الرجاء اختيار إجابة');
    return false;
  }

  return selected.value === correctAnswer;
}

function checkFillBlank(exercise: Element): boolean {
  const correctAnswer = exercise.getAttribute('data-correct')?.trim().toLowerCase();
  const input = exercise.querySelector('input[type="text"]') as HTMLInputElement;
  const userAnswer = input.value.trim().toLowerCase();

  // Flexible matching - allow minor variations
  return userAnswer === correctAnswer ||
         userAnswer === correctAnswer?.replace(/[ًٌٍَُِّْ]/g, '') || // without tashkeel
         levenshteinDistance(userAnswer, correctAnswer || '') <= 1; // allow 1 char difference
}

function checkMatching(exercise: Element): boolean {
  const selects = exercise.querySelectorAll('select');
  let allCorrect = true;

  selects.forEach((select) => {
    const correct = select.getAttribute('data-correct');
    if (select.value !== correct) {
      allCorrect = false;
      select.classList.add('border-red-400');
    } else {
      select.classList.add('border-green-400');
    }
  });

  return allCorrect;
}

function showFeedback(exercise: Element, isCorrect: boolean, checkBtn: HTMLButtonElement) {
  const feedbackArea = exercise.querySelector('[data-feedback]') as HTMLElement;
  const feedbackIcon = feedbackArea.querySelector('.feedback-icon') as SVGElement;
  const feedbackTitle = feedbackArea.querySelector('.feedback-title') as HTMLElement;
  const feedbackMessage = feedbackArea.querySelector('.feedback-message') as HTMLElement;

  const correctFeedback = checkBtn.getAttribute('data-correct-feedback') || 'أحسنت!';
  const incorrectFeedback = checkBtn.getAttribute('data-incorrect-feedback') || 'حاول مرة أخرى';

  feedbackArea.classList.remove('hidden');

  if (isCorrect) {
    feedbackArea.className = 'feedback mt-4 p-4 rounded-lg bg-green-50 border border-green-200';
    feedbackIcon.className = 'feedback-icon h-6 w-6 flex-shrink-0 mt-0.5 text-green-600';
    feedbackIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    feedbackTitle.className = 'feedback-title font-semibold mb-1 text-green-900';
    feedbackTitle.textContent = 'صحيح! ممتاز';
    feedbackMessage.className = 'feedback-message text-sm text-green-800';
    feedbackMessage.textContent = correctFeedback;
  } else {
    feedbackArea.className = 'feedback mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200';
    feedbackIcon.className = 'feedback-icon h-6 w-6 flex-shrink-0 mt-0.5 text-amber-600';
    feedbackIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
    feedbackTitle.className = 'feedback-title font-semibold mb-1 text-amber-900';
    feedbackTitle.textContent = 'راجع إجابتك';
    feedbackMessage.className = 'feedback-message text-sm text-amber-800';
    feedbackMessage.textContent = incorrectFeedback;
  }
}

function celebrateSuccess(exercise: Element) {
  // Add confetti or celebration animation
  exercise.classList.add('animate-pulse');
  setTimeout(() => {
    exercise.classList.remove('animate-pulse');
  }, 600);
}

function toArabicNumerals(num: number): string {
  const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNums[parseInt(d)]).join('');
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeExercises);
}

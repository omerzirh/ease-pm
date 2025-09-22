import { Iteration } from '../services/gitlabService';

export const formatIterationName = (iteration: Iteration): string => {
  if (iteration.title && iteration.title.trim()) {
    return iteration.title;
  }

  try {
    if (!iteration.start_date || !iteration.due_date) {
      throw new Error('Missing date values');
    }

    const startDate = new Date(iteration.start_date);
    const dueDate = new Date(iteration.due_date);

    if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
      throw new Error('Invalid date format');
    }

    const startFormatted = startDate.toLocaleDateString('en-US');
    const dueFormatted = dueDate.toLocaleDateString('en-US');

    return `${startFormatted} - ${dueFormatted}`;
  } catch (error) {
    return `Iteration ${iteration.id}`;
  }
};

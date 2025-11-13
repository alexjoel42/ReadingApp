// src/App.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentIdForm from './components/StudentIdForm';
import {test, expect, vi } from 'vitest';
test('StudentIdForm accepts input', async () => {
  const mockSubmit = vi.fn();
  render(<StudentIdForm onStudentDataSet={mockSubmit} />);

  const input = screen.getByLabelText(/student id/i);
  await userEvent.type(input, 'test123');
  
  expect(input).toHaveValue('test123');
});

test('StudentIdForm submits data', async () => {
  const mockSubmit = vi.fn();
  render(<StudentIdForm onStudentDataSet={mockSubmit} />);

  await userEvent.type(screen.getByLabelText(/student id/i), 'test123');
  await userEvent.click(screen.getByRole('button', { 
    name: /start practice session/i 
  }));
  
  expect(mockSubmit).toHaveBeenCalledWith({
  id: 'test123',
  level: 1,
});
});
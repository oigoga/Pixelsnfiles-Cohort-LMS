import { useMessageThread } from './useMessageThread'

// Private 1:1 message thread between one student and their coach(es).
// Replaces the old one-way coach_notes text field.
export function useStudentNotes(studentId) {
  return useMessageThread('student_coach_messages', 'student_id', studentId)
}

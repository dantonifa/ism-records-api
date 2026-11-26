export type RecordStatus = "active" | "archived";

export interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  section: string;
  year: number;
  status: RecordStatus;
}

export interface Course {
  _id: string;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
}

export interface Enrollment {
  _id: string;
  status: RecordStatus;
  student: Pick<Student, "studentId" | "firstName" | "lastName" | "status"> | null;
  course: Pick<Course, "code" | "name" | "status"> | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  canManage?: boolean;
}

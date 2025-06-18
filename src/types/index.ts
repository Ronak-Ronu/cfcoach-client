import { ReactNode } from "react";

export interface AuthResponse {
  token: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
}
export interface Teacher {
  _id: string;
  name: string;
  email: string;
}


export interface Student {
  _id: string;
  name: string;
  email: string;
  codeforcesHandle: string;
  teacherId: Teacher | string;
  currentRating?: number;
  maxRating?: number;
  lastSynced?: string;
  contestHistory?: Array<{
    name: ReactNode;
    contestId: number;
    contestName: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
  }>;
  submissions?: Array<{
    submissionId: number;
    contestId: number;
    problemIndex: string;
    problemName: string;
    problemRating: number;
    creationTimeSeconds: number;
    verdict: string;
  }>;
  sendReminder?: boolean;
  reminderEmailsSent?: number;
  isSyncing?: boolean;
  profileToken?: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  codeforcesHandle: string;
}
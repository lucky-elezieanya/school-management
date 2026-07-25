import { AcademicSession, ClassType, Term } from "../lib/types";

/* ===========================================================
    CUSTOMIZATION
=========================================================== */

export interface ResultCustomization {
  testScores: boolean;

  subjectAverage: boolean;
  subjectPosition: boolean;
  subjectScore: boolean;

  cumulativeAverage: boolean;

  classAverage: boolean;
  classPosition: boolean;
  classSize: boolean;

  overallGrade: boolean;
  highestLowestScores: boolean;

  showBehaviour: boolean;
  showTeacherComment: boolean;
  showPrincipalComment: boolean;
  showPerformanceChart: boolean;
}

/* ===========================================================
    STUDENT
=========================================================== */

export interface StudentSnapshot {
  id: number;
  fullName: string;
  gender: string;

  admissionNumber?: string;

  profilePicture?: string;
}

/* ==== SCHOOL ======= */

export interface SchoolSnapshot {
  name: string;

  schoolClass: ClassType;

  session: AcademicSession;

  term: Term;
}

/* ======= SUMMARY ===== */

export interface SummarySnapshot {
  totalScore: number;

  totalObtainableScore: number;

  averageScore: number;

  classAverage?: number;

  classPosition?: string;

  classSize?: number;

  totalSubjects: number;

  highestScore?: number;

  lowestScore?: number;

  overallGrade?: string;

  overallRemark?: string;

  resumptionDate?: string;
}

/* ===== SUBJECT RESULT ===== */

export interface SubjectResult {
  subjectId: number;

  subjectName: string;

  subjectCode?: string;

  firstTest?: number;

  secondTest?: number;

  examScore?: number;

  totalScore: number;

  grade: string;

  remark: string;

  subjectAverage?: number;

  subjectPosition?: string;

  subjectScore?: number;

  firstTermTotal?: number;

  secondTermTotal?: number;

  thirdTermTotal?: number;

  cumulativeAverage?: number;
}

/* ======== ATTENDANCE =================== */

export interface AttendanceSnapshot {
  attendance: number;

  daysSchoolOpened: number;
}

/* ======== FEES ============== */

export interface FeesSnapshot {
  nextFees: number;
}

/* ======= BEHAVIOUR ================= */

export interface BehaviourItem {
  item: string;

  grade: string;
}

export interface BehaviourSnapshot {
  items: BehaviourItem[];
}

/* ========  COMMENTS ========================== */

export interface CommentSnapshot {
  text: string;

  signature?: string;
}

export interface CommentsSnapshot {
  teacher: CommentSnapshot;

  principal: CommentSnapshot;
}

/* ======== ASSETS ========== */

export interface AssetsSnapshot {
  logo?: string;

  header?: string;

  defaultLogo: string;

  defaultHeader: string;

  defaultAvatar: string;
}

/* ======== CHARTS ========== */

export interface ChartsSnapshot {
  performance: string;
}

/* ======== ROOT SNAPSHOT =============== */

export interface StudentResultSnapshot {
  id: number;
  session: AcademicSession;
  term: Term;
  student: StudentSnapshot;

  school: SchoolSnapshot;

  summary: SummarySnapshot;

  attendance: AttendanceSnapshot;

  fees: FeesSnapshot;

  behaviour: BehaviourSnapshot;

  comments: CommentsSnapshot;

  assets: AssetsSnapshot;

  charts: ChartsSnapshot;

  customization: ResultCustomization;

  subjects: SubjectResult[];
}

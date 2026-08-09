export type JwtPayload = {
  user_id: number;
  username: string;
  exp: number;
  role: "student" | "teacher" | "admin";
  full_name: string;
  iat?: number;
};

export type AcademicSession = {
  id: number;
  name: string;
  is_active: boolean;
};

export type Term = {
  id: number;
  name: string;
  is_active: boolean;
};

export type TermSession = Term & {
  session: AcademicSession;
};

export type AuthContextType = {
  user: JwtPayload | null;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  isLoggedIn: boolean;
};

export type CreateClassFormType = {
  name: string;
  arm?: number;
  description: string;
  class_teacher?: number;
};

export type ArmsType = {
  id: number;
  name: string;
  code: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type UserType = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture?: string | "/avatar.png";
  gender: string;
  middle_name: string;
  date_of_birth: string;
  full_name: string;
  role: string;
  email?: string | "";
  age: number;
};

export type StudentType = {
  id: number;
  admission_number: string;
  current_enrollment: EnrollmentType;
  behaviour_exists: boolean;
  behaviour_id: number;
  parent_first_name: string;
  parent_last_name: string;
  parent_phone: string;
  parent_email: string;
  parent_address: string;
  is_active: boolean;
  user: UserType;
};

export type TeacherSummary = {
  id: number;

  profile_picture?: string;
  qualification: string;
  address: string;
  phone_number: string;
  date_employed: string;
  user: UserType;
};

export type AssignedClass = {
  id: number;
  name: string;
  arm: ArmsType;
  description: string;
  class_teacher: TeacherSummary;
};

export type TeacherType = {
  id: number;
  qualification: string;
  address: string;
  phone_number: string;
  date_employed: string;
  assigned_classes?: AssignedClass[];
  user: UserType;
};
export type TeacherFormDataType = {
  qualification: string;
  address: string;
  phone_number: string;
  date_employed: string;
  assigned_classes?: (number | string)[];
  first_name: string;
  last_name: string;
  username: string;
  profile_picture?: File | string | null;
  gender: string;
  middle_name: string;
  date_of_birth: string;
  email: string;
  password: string;
};
  

export type ClassType = {
  id: number;
  name: string;
  arm: {
    id: number;
    name: string;
    code: string;
  };
  class_teacher: TeacherType;
  description: string;
};

export type EnrollmentType = {
  id: number;
  session: {
    id: number;
    name: string;
    is_active: boolean;
  };
  school_class: ClassType;
  is_current: boolean;

};
export type SubjectType = {
  id: number;
  name: string;
  code: string;
};

export type StudentFormDataType = {
  first_name: string;
  last_name: string;
  username: string;
  date_of_birth: string;
  admission_number: string;
  gender: string;
  profile_picture?: File | string | null;
  middle_name: string;
  parent_email: string;
  parent_phone: string;
  parent_first_name: string;
  parent_last_name: string;
  parent_address: string;
  password: string;
  current_class: string
};

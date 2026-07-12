from dataclasses import dataclass, field
from typing import List, Optional

from typing import List


@dataclass
class ChartPointDTO:

    subject: str

    student: float

    average: float

@dataclass
class BehaviourDTO:
    item: str
    grade: str


@dataclass
class SubjectResultDTO:

    id: int

    subjectName: str

    subjectCode: Optional[str]

    firstTest: float

    secondTest: float

    examScore: float

    totalScore: float

    grade: str

    remark: str

    subjectAverage: Optional[float]

    subjectPosition: Optional[str]

    subjectScore: Optional[float]

    firstTermTotal: Optional[float]

    secondTermTotal: Optional[float]

    thirdTermTotal: Optional[float]

    cumulativeAverage: Optional[float]


@dataclass
class StudentDTO:

    id: int

    name: str

    gender: str

    passport: Optional[str]

    admissionNumber: str

    className: str


@dataclass
class SchoolDTO:

    logo: Optional[str]

    header: Optional[str]

    teacherSignature: Optional[str]

    principalSignature: Optional[str]


@dataclass
class SummaryDTO:

    totalScore: float

    obtainableScore: float

    average: float

    classAverage: float

    position: Optional[str]

    classSize: int

    overallGrade: Optional[str]

    overallRemark: Optional[str]

    highestScore: float

    lowestScore: float

    totalSubjects: int

    attendance: int

    schoolOpened: int

    resumptionDate: Optional[str]

    nextFees: float


@dataclass
class CommentsDTO:

    teacherComment: str

    principalComment: str


@dataclass
class ReportDTO:

    school: SchoolDTO

    student: StudentDTO

    summary: SummaryDTO

    session: str

    term: str

    generatedDate: str

    chart: List[ChartPointDTO]

    customization: dict

    behaviours: List[BehaviourDTO] = field(default_factory=list)

    comments: CommentsDTO = None

    results: List[SubjectResultDTO] = field(default_factory=list)
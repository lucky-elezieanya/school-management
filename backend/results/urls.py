# urls.py
from rest_framework.routers import DefaultRouter
from .views_production import (AttendanceViewSet, BehaviourViewSet, ClassFeesViewset, ClassTeacherSignatureViewSet, GradingScaleViewSet, HeadTeacherSignatureViewSet, MaxScoreViewset, ResultCustomizationViewSet, ResultSummaryViewset, ResultViewSet, SchoolDaysViewSet, StudentResultSnapshotViewSet, SubjectResultStatusViewSet, TermCommentViewSet, ResumptionDateViewSet, ActivateResultPortalViewSet, ResultWorkflowViewSet, SubjectSummaryViewSet)

router = DefaultRouter()
router.register(r'results', ResultViewSet, basename='results')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'behaviour', BehaviourViewSet, basename='behaviour')
router.register(r'grading-scales', GradingScaleViewSet, basename='grading-scales')
router.register(r'term-comments', TermCommentViewSet, basename='term-comments')
router.register(r'result-summaries', ResultSummaryViewset, basename='result-summaries')
router.register(
    r"result-snapshots",
    StudentResultSnapshotViewSet,
    basename="result-snapshot",
)
router.register(r'subject-result-status', SubjectResultStatusViewSet, basename='subject-result-status')
router.register(r'maxscores', MaxScoreViewset, basename='maxscores')
router.register(r'classfees', ClassFeesViewset, basename='classfees')
router.register(r'resumption-date', ResumptionDateViewSet, basename="resumption-date")
router.register(r'activate-portal', ActivateResultPortalViewSet, basename="activate-portal")
router.register(r"workflow", ResultWorkflowViewSet, basename="workflow",)
router.register(r"subject-summaries", SubjectSummaryViewSet, basename="subject-summary",
)

router.register(r"school-days", SchoolDaysViewSet, basename="school-days")
router.register(
    "teacher-signatures",
    ClassTeacherSignatureViewSet,
    basename="teacher-signatures",
)

router.register(
    "headteacher-signatures",
    HeadTeacherSignatureViewSet,
    basename="headteacher-signatures",
)
router.register(
    "customize",
    ResultCustomizationViewSet,
    basename="result-customization",
)


urlpatterns = router.urls
from django.urls import path

from rest_framework.routers import DefaultRouter
from .views_production import (
    AcademicSessionViewSet,
    ArmsViewSet,
    ClassViewSet,
    SchoolAssetViewSet,
    StudentEnrollmentViewSet,
    StudentFileUploadView,
    StudentImportViewSet,
    TeacherViewSet,
    StudentViewSet,
    SubjectViewSet,
    ClassSubjectViewSet,
    TermViewSet,
    PromotionRuleViewSet,
    PromotionRecordViewSet,
    PromotionBatchViewSet
)

router = DefaultRouter()

router.register(r"terms", TermViewSet, basename="terms")
router.register(r'arms', ArmsViewSet)
router.register(r'sessions', AcademicSessionViewSet, basename="sessions")
router.register(r'classes', ClassViewSet, basename='classes')
router.register(r'teachers', TeacherViewSet, basename='teachers')
router.register(r'students', StudentViewSet, basename='students')
router.register(r'subjects', SubjectViewSet, basename='subjects')
router.register(r'class-subjects', ClassSubjectViewSet, basename='class-subjects')
router.register(r'school-assets', SchoolAssetViewSet)
router.register(r'enrollments', StudentEnrollmentViewSet, basename="enrollments")
router.register('promotion-rules', PromotionRuleViewSet, basename="promotion-rule")
router.register('promotion-record', PromotionRecordViewSet, basename="promotion-record")
router.register('promotion-batch', PromotionBatchViewSet, basename="promotion-batch")
router.register(r'student-imports', StudentImportViewSet, basename="student-imports")

urlpatterns = [
    path('upload/', StudentFileUploadView.as_view(), name='file-upload'),
]

urlpatterns += router.urls
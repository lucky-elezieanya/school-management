from rest_framework.routers import DefaultRouter

from .views import (
    PublicNewsViewSet,
    AdminNewsViewSet,
    NewsImageViewSet,
)

router = DefaultRouter()

# Public
router.register(
    "news",
    PublicNewsViewSet,
    basename="news",
)

# Admin
router.register(
    "admin/news",
    AdminNewsViewSet,
    basename="admin-news",
)

router.register(
    "admin/news-images",
    NewsImageViewSet,
    basename="news-images",
)

urlpatterns = router.urls
from rest_framework.routers import DefaultRouter

from .views import (
    PublicNewsViewSet,
    AdminNewsViewSet,
  
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


urlpatterns = router.urls
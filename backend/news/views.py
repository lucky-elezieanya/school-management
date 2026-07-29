from accounts.permissions import IsAdminUser
from rest_framework import permissions, viewsets

from .models import News, NewsImage
from .serializers import (
    AdminNewsSerializer,
    NewsDetailSerializer,
    NewsImageSerializer,
    NewsListSerializer,
)


class PublicNewsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return News.objects.filter(published=True).prefetch_related("images").order_by(
            "-published_at", "-created_at"
        )

    def get_serializer_class(self):
        return NewsDetailSerializer if self.action == "retrieve" else NewsListSerializer


class AdminNewsViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = News.objects.prefetch_related("images").order_by("-created_at")
    serializer_class = AdminNewsSerializer


class NewsImageViewSet(viewsets.ModelViewSet):
    serializer_class = NewsImageSerializer
    permission_classes = [IsAdminUser]
    queryset = NewsImage.objects.select_related("news").order_by("news_id", "order", "id")

    def get_queryset(self):
        queryset = super().get_queryset()
        news_id = self.request.query_params.get("news")
        return queryset.filter(news_id=news_id) if news_id else queryset

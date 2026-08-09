from accounts.permissions import IsAdminUser
from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response

from .models import News, NewsImage
from .serializers import (
    AdminNewsSerializer,
    NewsDetailSerializer,

    NewsListSerializer,
)


class PublicNewsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            News.objects.filter(status="published")
            .prefetch_related("images")
            .order_by("-published_at", "-created_at")
        )

    def get_serializer_class(self):
        return (
            NewsDetailSerializer
            if self.action == "retrieve"
            else NewsListSerializer
        )



class AdminNewsViewSet(viewsets.ModelViewSet):
    serializer_class = AdminNewsSerializer
    permission_classes = [IsAdminUser]
    queryset = News.objects.prefetch_related("images").order_by("-created_at")

    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )
    
    def _save_images(self, news, request):
        images = (
            request.FILES.getlist("images")
            or request.FILES.getlist("image")
        )

        removed_ids = request.data.getlist("removedImages")

        cover_image_id = request.data.get("coverImageId")

        raw_cover_index = request.data.get("coverIndex")

        cover_index = None

        if raw_cover_index is not None:
            try:
                cover_index = int(raw_cover_index)
            except ValueError:
                pass

        if removed_ids:
            NewsImage.objects.filter(
                news=news,
                id__in=removed_ids,
            ).delete()

        if cover_image_id:
            NewsImage.objects.filter(news=news).update(is_cover=False)

            NewsImage.objects.filter(
                news=news,
                id=cover_image_id,
            ).update(is_cover=True)

        if images:

            existing_count = news.images.count()

            if (
                cover_index is not None
                and 0 <= cover_index < len(images)
            ):
                NewsImage.objects.filter(news=news).update(
                    is_cover=False
                )

            for index, image in enumerate(images):

                NewsImage.objects.create(
                    news=news,
                    image=image,
                    order=existing_count + index,
                    is_cover=index == cover_index,
                )
      
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():

            news = serializer.save()

            self._save_images(news, request)

        serializer = self.get_serializer(news)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
        
    def update(self, request, *args, **kwargs):

        partial = kwargs.pop("partial", False)

        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
        )

        serializer.is_valid(raise_exception=True)

        with transaction.atomic():

            news = serializer.save()

            self._save_images(news, request)

        serializer = self.get_serializer(news)

        return Response(serializer.data)

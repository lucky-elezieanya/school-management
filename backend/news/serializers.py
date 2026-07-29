from django.utils import timezone
from rest_framework import serializers

from .models import News, NewsImage


class NewsImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = NewsImage
        fields = ["id", "news", "image", "caption", "order", "is_cover"]
        read_only_fields = ["id"]


class NewsBaseSerializer(serializers.ModelSerializer):
    cover_image = serializers.SerializerMethodField(read_only=True)

    def get_cover_image(self, obj):
        image = obj.cover_image
        if not image:
            return None
        request = self.context.get("request")
        url = image.image.url
        return {
            "image": request.build_absolute_uri(url) if request else url,
            "caption": image.caption,
        }


class NewsListSerializer(NewsBaseSerializer):
    class Meta:
        model = News
        fields = [
            "id", "title", "slug", "summary", "cover_image", "status",
            "published", "featured", "published_at", "created_at", "updated_at",
        ]


class NewsDetailSerializer(NewsBaseSerializer):
    images = NewsImageSerializer(many=True, read_only=True)

    class Meta:
        model = News
        fields = [
            "id", "title", "slug", "summary", "content", "cover_image",
            "featured", "status", "published", "published_at", "created_at",
            "updated_at", "images",
        ]


class AdminNewsSerializer(NewsDetailSerializer):
    class Meta(NewsDetailSerializer.Meta):
        read_only_fields = ["id", "slug", "created_at", "updated_at", "images", "cover_image"]

    def validate(self, attrs):
        if "status" in attrs:
            attrs["published"] = attrs["status"] == "published"
        elif "published" in attrs:
            attrs["status"] = "published" if attrs["published"] else "draft"
        return attrs

    def create(self, validated_data):
        if validated_data.get("published") and not validated_data.get("published_at"):
            validated_data["published_at"] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("published", instance.published) and not instance.published and not validated_data.get("published_at"):
            validated_data["published_at"] = timezone.now()
        return super().update(instance, validated_data)

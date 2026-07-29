from django.contrib import admin
from django.utils.html import format_html

from .models import News, NewsImage


class NewsImageInline(admin.TabularInline):
    model = NewsImage
    extra = 1
    ordering = ("order",)

    fields = (
        "preview",
        "image",
        "caption",
        "is_cover",
        "order",
    )

    readonly_fields = (
        "preview",
    )

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="height:70px;width:70px;object-fit:cover;border-radius:8px;border:1px solid #ddd;" />',
                obj.image.url,
            )
        return "-"

    preview.short_description = "Preview"


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "status",
        "featured",
        "published",
        "cover_preview",
        "published_at",
        "created_at",
    )

    list_filter = (
        "status",
        "featured",
        "published_at",
    )

    search_fields = (
        "title",
        "summary",
        "content",
    )

    readonly_fields = (
        "slug",
        "created_at",
        "updated_at",
        "cover_preview",
    )

    ordering = (
        "-published_at",
        "-created_at",
    )

    fieldsets = (
        (
            "News Information",
            {
                "fields": (
                    "title",
                    "slug",
                    "summary",
                    "content",
                )
            },
        ),
        (
            "Publishing",
            {
                "fields": (
                    "status",
                    "featured",
                    "published_at",
                )
            },
        ),
        (
            "Cover Image",
            {
                "fields": (
                    "cover_preview",
                )
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    inlines = [
        NewsImageInline,
    ]

    def cover_preview(self, obj):
        cover = obj.cover_image

        if cover and cover.image:
            return format_html(
                '<img src="{}" style="height:90px;width:120px;object-fit:cover;border-radius:10px;border:1px solid #ddd;" />',
                cover.image.url,
            )

        return "No Cover Image"

    cover_preview.short_description = "Cover Image"


@admin.register(NewsImage)
class NewsImageAdmin(admin.ModelAdmin):
    list_display = (
        "preview",
        "news",
        "caption",
        "is_cover",
        "order",
    )

    list_filter = (
        "is_cover",
        "news",
    )

    search_fields = (
        "news__title",
        "caption",
    )

    autocomplete_fields = (
        "news",
    )

    list_editable = (
        "is_cover",
        "order",
    )

    readonly_fields = (
        "preview",
    )

    ordering = (
        "news",
        "order",
        "id",
    )

    fields = (
        "news",
        "preview",
        "image",
        "caption",
        "is_cover",
        "order",
    )

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="height:90px;width:120px;object-fit:cover;border-radius:10px;border:1px solid #ddd;" />',
                obj.image.url,
            )

        return "-"

    preview.short_description = "Preview"
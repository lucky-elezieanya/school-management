from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


class News(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True, max_length=300)
    summary = models.TextField()
    content = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
    )
    featured = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1

            while News.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        if self.status == "published" and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def cover_image(self):
        return self.images.filter(is_cover=True).first()

    def get_absolute_url(self):
        return reverse("news-detail", kwargs={"slug": self.slug})


class NewsImage(models.Model):
    news = models.ForeignKey(
        News,
        related_name="images",
        on_delete=models.CASCADE,
    )
    image = models.ImageField(upload_to="news/")
    caption = models.CharField(max_length=255, blank=True)
    is_cover = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.news.title} Image"

    def save(self, *args, **kwargs):
        if self.is_cover:
            NewsImage.objects.filter(news=self.news).exclude(pk=self.pk).update(
                is_cover=False
            )
        super().save(*args, **kwargs)
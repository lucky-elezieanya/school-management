from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    ChangePasswordSerializer,
)

from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework_simplejwt.views import TokenObtainPairView as SimpleJWTTokenObtainPairView
from rest_framework.parsers import (
    FormParser,
    MultiPartParser,
    JSONParser,
)
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters



User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [FormParser, MultiPartParser, JSONParser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'username']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'middle_name']

    def get_queryset(self):
        role = self.request.query_params.get("role")

        if role:
            return User.objects.filter(role=role)
        return User.objects.all()

    def get_serializer_context(self):
        return {
                "request": self.request
            }

    @action(
        detail=False,
        methods=["post"],
        url_path="change-password",
    )
    def change_password(self, request):
        """
        Allow an authenticated user to change their own password.

        The user is always taken from request.user.
        No user ID is accepted from the client.
        """

        serializer = ChangePasswordSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            {
                "message": "Password changed successfully.",
            },
            status=status.HTTP_200_OK,
        )

    @action(
    detail=True,
    methods=["post"],
    url_path="give-admin-status",)
    def give_admin_status(self, request, pk=None):
        """
        Grant staff/admin status to a specific user.

        Only an existing staff user can perform this action.
        """

        # --------------------------------------------------
        # 1. Only existing super users users can grant staff status
        # --------------------------------------------------
        if not request.user.is_superuser:
            return Response(
                {
                    "message": "You do not have permission to give admin status."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # --------------------------------------------------
        # 2. Get the target user
        # --------------------------------------------------
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {
                    "message": "User not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------
        # 3. Already staff
        # --------------------------------------------------
        if user.is_staff:
            return Response(
                {
                    "message": "This user already has admin status.",
                    "is_staff": True,
                },
                status=status.HTTP_200_OK,
            )

        # --------------------------------------------------
        # 4. Grant staff status
        # --------------------------------------------------
        user.is_staff = True
        user.save(update_fields=["is_staff"])

        return Response(
            {
                "message": "Admin status granted successfully.",
                "is_staff": True,
            },
            status=status.HTTP_200_OK,
        )
        
    @action(
    detail=True,
    methods=["post"],
    url_path="remove-admin-status",
        )
    def remove_admin_status(self, request, pk=None):
        """
        Remove Django staff/admin status from a specific user.

        Only an existing staff user can perform this action.
        A staff user cannot remove their own staff status.
        """

        # --------------------------------------------------
        # 1. Only existing superusers can perform this action
        # --------------------------------------------------
        if not request.user.is_superuser:
            return Response(
                {
                    "message": "You do not have permission to remove admin status."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # --------------------------------------------------
        # 2. Get the target user
        # --------------------------------------------------
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {
                    "message": "User not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # --------------------------------------------------
        # 3. Prevent removing your own staff status
        # --------------------------------------------------
        if user.pk == request.user.pk:
            return Response(
                {
                    "message": "You cannot remove your own admin status."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --------------------------------------------------
        # 4. Already not staff
        # --------------------------------------------------
        if not user.is_staff:
            return Response(
                {
                    "message": "This user does not have admin status.",
                    "is_staff": False,
                },
                status=status.HTTP_200_OK,
            )

        # --------------------------------------------------
        # 5. Remove staff status
        # --------------------------------------------------
        user.is_staff = False
        user.save(update_fields=["is_staff"])

        return Response(
            {
                "message": "Admin status removed successfully.",
                "is_staff": False,
            },
            status=status.HTTP_200_OK,
        )



class CustomTokenObtainPairView(SimpleJWTTokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

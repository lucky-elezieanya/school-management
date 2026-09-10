from rest_framework import serializers
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer  

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "middle_name",
            "last_name",
            "full_name",
            "password",
            "role",
            "gender",
            "date_of_birth",
            "age",
            "profile_picture",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = ["id"]

        
    # CREATE USER
    # =====================================

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        role = validated_data.get("role", "student")

        # create user
        user = User.objects.create_user(**validated_data)

        # set password
        if password:
            user.set_password(password)

        # ✅ ADMIN ROLE LOGIC
        if role == "admin":
            user.is_staff = True
            user.is_superuser = True
        else:
            user.is_staff = False
            user.is_superuser = False

        user.save()
        return user


    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        role = validated_data.get("role", instance.role)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        # ✅ KEEP ADMIN RIGHTS IN SYNC
        if role == "admin":
            instance.is_staff = True
            instance.is_superuser = True
        else:
            instance.is_staff = False
            instance.is_superuser = False

        instance.save()
        return instance
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
# Custom serializer to include additional user info in the token payload 

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['full_name'] = user.full_name
        token['user_id'] = user.id
        token['role'] = user.role
        token['username'] = user.username
        token["first_name"] = user.first_name
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        return token
   
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
    )

    def validate(self, attrs):
        user = self.context["request"].user

        current_password = attrs["current_password"]
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        # ------------------------------------------------------
        # Verify current password
        # ------------------------------------------------------

        if not user.check_password(current_password):
            raise serializers.ValidationError({
                "current_password":
                    "Your current password is incorrect."
            })

        # ------------------------------------------------------
        # Confirm new password
        # ------------------------------------------------------

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password":
                    "The new passwords do not match."
            })

        # ------------------------------------------------------
        # Prevent same password
        # ------------------------------------------------------

        if user.check_password(new_password):
            raise serializers.ValidationError({
                "new_password":
                    "Your new password must be different from your current password."
            })

        # ------------------------------------------------------
        # Django password validation
        # ------------------------------------------------------

        from django.contrib.auth.password_validation import (
            validate_password,
        )

        validate_password(
            new_password,
            user,
        )

        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        return user


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
        ]
        read_only_fields = ["id"]

    # def get_profile_picture(self, obj):
    #     if not obj.profile_picture:
    #         return None

    #     try:
    #         request = self.context.get("request")

    #         if request:
    #             return request.build_absolute_uri(obj.profile_picture.url)

    #         return obj.profile_picture.url
    #     except Exception:
    #         return None
        
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
       
        return token
   

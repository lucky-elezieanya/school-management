import os
import traceback

import pandas as pd
from django.db import transaction
from django.utils.dateparse import parse_date

from academics.models import Student, Arms, Class
from academics.serializers import StudentCreateSerializer


REQUIRED_COLUMNS = [
    "first_name",
    "last_name",
    "middle_name",
    "username",
    "password",
    "current_class",
    "arm",
    "gender",
    "admission_number",
    "date_of_birth",
    "parent_first_name",
    "parent_last_name",
    "parent_email",
    "parent_phone",
    "parent_address",
]

VALID_GENDERS = ["male", "female"]


def import_students(file_path, progress_callback=None):
    """
    Imports students from a CSV/Excel file.

    Args:
        file_path (str): Absolute path to uploaded file.
        progress_callback (callable): Optional callback for Celery progress.

    Returns:
        dict
    """

    created_students = []
    skipped_students = []

    try:

        # ===========================================
        # READ FILE
        # ===========================================
        filename = file_path.lower()

        if filename.endswith(".csv"):
            df = pd.read_csv(file_path)

        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(file_path)

        else:
            raise ValueError("Unsupported file format.")

        df.columns = df.columns.str.strip()
        df = df.fillna("")

        # ===========================================
        # VALIDATE COLUMNS
        # ===========================================
        missing_columns = [
            col
            for col in REQUIRED_COLUMNS
            if col not in df.columns
        ]

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {', '.join(missing_columns)}"
            )

        total_rows = len(df)

        # ===========================================
        # LOOP
        # ===========================================
        for index, row in df.iterrows():

            excel_row = index + 2

            if progress_callback:
                progress_callback(
                    current=index + 1,
                    total=total_rows,
                    message=f"Importing student {index + 1} of {total_rows}",
                )

            try:

                cleaned_row = {}

                for key, value in row.items():
                    cleaned_row[key] = (
                        str(value).strip()
                        if pd.notnull(value)
                        else ""
                    )

                username = cleaned_row["username"].strip()
                gender = cleaned_row["gender"].lower().strip()

                first_name = cleaned_row["first_name"].strip()
                middle_name = cleaned_row["middle_name"].strip()
                last_name = cleaned_row["last_name"].strip()

                password = cleaned_row["password"].strip() or "1234"

                admission_number = cleaned_row[
                    "admission_number"
                ].strip()

                if not username:
                    skipped_students.append({
                        "row": excel_row,
                        "error": "Username is required",
                    })
                    continue

                if Student.objects.filter(
                    admission_number=admission_number
                ).exists():

                    skipped_students.append({
                        "row": excel_row,
                        "username": username,
                        "error": f"Student with admission number {admission_number} already exists",
                    })
                    continue

                if gender not in VALID_GENDERS:

                    skipped_students.append({
                        "row": excel_row,
                        "username": username,
                        "error": "Invalid gender",
                    })
                    continue

                dob = parse_date(cleaned_row["date_of_birth"])

                if not dob:

                    skipped_students.append({
                        "row": excel_row,
                        "username": username,
                        "error": "Invalid date format. Use YYYY-MM-DD",
                    })
                    continue

                class_name = cleaned_row["current_class"].strip().upper()
                arm_name = cleaned_row["arm"].strip().upper()

                if not class_name:

                    skipped_students.append({
                        "row": excel_row,
                        "username": username,
                        "error": "Current class is required",
                    })
                    continue

                if not arm_name:

                    skipped_students.append({
                        "row": excel_row,
                        "username": username,
                        "error": "Arm is required",
                    })
                    continue

                school_arm, _ = Arms.objects.get_or_create(
                    name=arm_name,
                    defaults={
                        "code": f"ARM {arm_name}"
                    }
                )

                school_class, _ = Class.objects.get_or_create(
                    name=class_name,
                    arm=school_arm,
                )

                serializer_data = {
                    "first_name": first_name,
                    "middle_name": middle_name,
                    "last_name": last_name,
                    "username": username,
                    "password": password,
                    "gender": gender,
                    "date_of_birth": dob,
                    "class_id": school_class.id,
                    "admission_number": admission_number,
                    "parent_first_name": cleaned_row["parent_first_name"],
                    "parent_last_name": cleaned_row["parent_last_name"],
                    "parent_email": cleaned_row["parent_email"],
                    "parent_phone": cleaned_row["parent_phone"],
                    "parent_address": cleaned_row["parent_address"],
                }

                with transaction.atomic():

                    serializer = StudentCreateSerializer(
                        data=serializer_data
                    )

                    if serializer.is_valid():

                        serializer.save()

                        created_students.append({
                            "row": excel_row,
                            "username": username,
                            "default_password": password,
                        })

                    else:

                        skipped_students.append({
                            "row": excel_row,
                            "username": username,
                            "error": serializer.errors,
                        })

            except Exception as e:

                print(traceback.format_exc())

                skipped_students.append({
                    "row": excel_row,
                    "username": cleaned_row.get(
                        "username",
                        "unknown",
                    ),
                    "error": str(e),
                })

        if progress_callback:
            progress_callback(
                current=total_rows,
                total=total_rows,
                message="Student import completed.",
            )

        return {
            "created_count": len(created_students),
            "skipped_count": len(skipped_students),
            "created_students": created_students,
            "skipped_students": skipped_students,
        }

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
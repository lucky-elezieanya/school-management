from rest_framework import serializers

class BehaviourSerializer(serializers.Serializer):

    item = serializers.CharField()

    grade = serializers.CharField()
    
class StudentSerializer(serializers.Serializer):

    id = serializers.IntegerField()

    name = serializers.CharField()

    gender = serializers.CharField()

    passport = serializers.CharField(
        allow_null=True
    )

    admissionNumber = serializers.CharField()

    className = serializers.CharField()
    
class SchoolSerializer(serializers.Serializer):

    logo = serializers.CharField(
        allow_null=True
    )

    header = serializers.CharField(
        allow_null=True
    )

    teacherSignature = serializers.CharField(
        allow_null=True
    )

    principalSignature = serializers.CharField(
        allow_null=True
    )
    
class SummarySerializer(serializers.Serializer):

    totalScore = serializers.FloatField()

    obtainableScore = serializers.FloatField()

    average = serializers.FloatField()

    classAverage = serializers.FloatField()

    position = serializers.CharField(
        allow_null=True
    )

    classSize = serializers.IntegerField()

    overallGrade = serializers.CharField(
        allow_null=True
    )

    overallRemark = serializers.CharField(
        allow_null=True
    )

    highestScore = serializers.FloatField()

    lowestScore = serializers.FloatField()

    totalSubjects = serializers.IntegerField()

    attendance = serializers.IntegerField()

    schoolOpened = serializers.IntegerField()

    resumptionDate = serializers.DateField(
        allow_null=True
    )

    nextFees = serializers.FloatField()
    
class SubjectResultSerializer(serializers.Serializer):

    id = serializers.IntegerField()

    subjectName = serializers.CharField()

    subjectCode = serializers.CharField(
        allow_null=True
    )

    firstTest = serializers.FloatField()

    secondTest = serializers.FloatField()

    examScore = serializers.FloatField()

    totalScore = serializers.FloatField()

    grade = serializers.CharField()

    remark = serializers.CharField()

    subjectAverage = serializers.FloatField(
        allow_null=True
    )

    subjectPosition = serializers.CharField(
        allow_null=True
    )

    subjectScore = serializers.FloatField(
        allow_null=True
    )

    firstTermTotal = serializers.FloatField(
        allow_null=True
    )

    secondTermTotal = serializers.FloatField(
        allow_null=True
    )

    thirdTermTotal = serializers.FloatField(
        allow_null=True
    )

    cumulativeAverage = serializers.FloatField(
        allow_null=True
    )
    
class CommentsSerializer(serializers.Serializer):

    teacherComment = serializers.CharField()

    principalComment = serializers.CharField()
    
class ChartPointSerializer(serializers.Serializer):

    subject = serializers.CharField()

    student = serializers.FloatField()

    average = serializers.FloatField()
    
class ReportSerializer(serializers.Serializer):

    school = SchoolSerializer()

    student = StudentSerializer()

    summary = SummarySerializer()

    session = serializers.CharField()

    term = serializers.CharField()

    generatedDate = serializers.CharField()

    chart = ChartPointSerializer(
        many=True
    )
    customization = serializers.DictField()

    behaviours = BehaviourSerializer(
        many=True
    )
    comments = CommentsSerializer()

    results = SubjectResultSerializer(
        many=True
    )
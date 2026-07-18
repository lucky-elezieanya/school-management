from decimal import Decimal


def format_position(position):
    """
    Converts an integer position into its ordinal string.

    Example:
        1 -> 1st
        2 -> 2nd
        3 -> 3rd
        4 -> 4th
        11 -> 11th
        None -> None
    """

    if position is None:
        return None

    n = int(position)

    if 11 <= (n % 100) <= 13:
        suffix = "th"
    else:
        suffix = {
            1: "st",
            2: "nd",
            3: "rd",
        }.get(n % 10, "th")

    return f"{n}{suffix}"


def calculate_cumulative_average(scores):
    """
    Calculates cumulative average from available term scores.

    Ignores None values.

    Example:
        [80, None, 90]
        -> 85.0
    """

    values = [
        Decimal(str(score))
        for score in scores
        if score is not None
    ]

    if not values:
        return None

    return round(
        sum(values) / len(values),
        2,
    )


def calculate_overall_grade(
    average_score,
    grading_scales,
):
    """
    Returns:

        (
            grade,
            remark,
        )

    grading_scales should already be loaded
    into memory by SnapshotContext.
    """

    if average_score is None:
        return None, None

    for grade in grading_scales:

        if (
            grade.lower_limit
            <= average_score
            <= grade.upper_limit
        ):

            return (
                grade.grade,
                grade.remark,
            )

    return None, None


def calculate_class_statistics(
    summaries,
):
    """
    summaries -> iterable(ResultSummary)

    Returns:

    {
        "highest": ...,
        "lowest": ...
    }
    """

    averages = [
        s.average_score
        for s in summaries
        if s.average_score is not None
    ]

    if not averages:

        return {
            "highest": None,
            "lowest": None,
        }

    return {

        "highest": max(averages),

        "lowest": min(averages),

    }
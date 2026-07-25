from html import escape
import math


def generate_chart(results):
    """
    Returns an SVG chart.

    results = [
        {
            "subjectCode": "ENG",
            "totalScore": 75,
            "subjectAverage": 64,
        }
    ]
    """

    if not results:
        return ""

    subjects = [r["subjectCode"] for r in results]
    scores = [float(r["totalScore"]) for r in results]
    averages = [
        float(r.get("subjectAverage") or 0)
        for r in results
    ]

    # ----------------------------------------
    # Layout
    # ----------------------------------------

    left = 60
    right = 20
    top = 10
    bottom = 28

    chart_height = 95

    bar_width = 14
    gap_between_bars = 4
    group_spacing = 14

    group_width = (
        bar_width * 2
        + gap_between_bars
        + group_spacing
    )

    chart_width = max(
        420,
        len(subjects) * group_width + 80,
    )

    width = left + chart_width + right
    height = top + chart_height + bottom

    # ----------------------------------------
    # Y Axis Scale
    # ----------------------------------------

    highest = max(max(scores), max(averages))

    if highest <= 100:
        max_score = 120
    else:
        max_score = math.ceil((highest + 10) / 10) * 10

    step = 20

    def y(value):
        return (
            top
            + chart_height
            - (value / max_score) * chart_height
        )

    svg = []

    svg.append(
        f"""
        <svg
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            width="100%"
            height="100%"
            viewBox="0 0 {width} {height}"
            preserveAspectRatio="xMidYMid meet"
            shape-rendering="geometricPrecision"
            text-rendering="geometricPrecision">

            <title>Student Performance Chart</title>
        """
    )

    # ----------------------------------------
    # Background
    # ----------------------------------------

    svg.append(
        f"""
        <rect
            x="0"
            y="0"
            width="{width}"
            height="{height}"
            fill="white"/>
        """
    )

    # ----------------------------------------
    # Grid Lines
    # ----------------------------------------

    for value in range(0, int(max_score) + step, step):

        yy = y(value)

        svg.append(
            f"""
            <line
                x1="{left}"
                y1="{yy}"
                x2="{left + chart_width}"
                y2="{yy}"
                stroke="#d8d8d8"
                stroke-width="0.5"/>
            """
        )

        svg.append(
            f"""
            <text
                x="{left - 8}"
                y="{yy + 3}"
                font-size="8"
                text-anchor="end"
                fill="#444">
                {value}
            </text>
            """
        )

    # ----------------------------------------
    # Vertical Grid
    # ----------------------------------------

    start_x = left + 10

    for i in range(len(subjects)):

        gx = start_x + i * group_width
        center = gx + bar_width

        svg.append(
            f"""
            <line
                x1="{center}"
                y1="{top}"
                x2="{center}"
                y2="{top + chart_height}"
                stroke="#efefef"
                stroke-width="0.3"/>
            """
        )

    # ----------------------------------------
    # Border
    # ----------------------------------------

    svg.append(
        f"""
        <rect
            x="{left}"
            y="{top}"
            width="{chart_width}"
            height="{chart_height}"
            fill="none"
            stroke="black"
            stroke-width="0.3"/>
        """
    )

    # ----------------------------------------
    # Bars
    # ----------------------------------------

    for i, subject in enumerate(subjects):

        gx = start_x + i * group_width

        student_height = (
            scores[i] / max_score
        ) * chart_height

        average_height = (
            averages[i] / max_score
        ) * chart_height

        # Student Bar

        svg.append(
            f"""
            <rect
                x="{gx}"
                y="{y(scores[i])}"
                width="{bar_width}"
                height="{student_height}"
                rx="2"
                fill="#2563eb"/>
            """
        )

        # Average Bar

        svg.append(
            f"""
            <rect
                x="{gx + bar_width + gap_between_bars}"
                y="{y(averages[i])}"
                width="{bar_width}"
                height="{average_height}"
                rx="2"
                fill="#7c3aed"/>
            """
        )

        # Subject Label

        center = gx + bar_width

        svg.append(
            f"""
            <text
                x="{center + 7}"
                y="{top + chart_height + 11}"
                font-size="7"
                text-anchor="end"
                transform="rotate(-40 {center + 7},{top + chart_height + 11})"
                fill="#444">
                {escape(subject)}
            </text>
            """
        )

    # ----------------------------------------
    # Y Axis Title
    # ----------------------------------------

    svg.append(
        f"""
        <text
            transform="rotate(-90)"
            x="-{top + chart_height / 2}"
            y="18"
            font-size="9"
            text-anchor="middle"
            fill="#444">
            Subject Scores
        </text>
        """
    )

    # ----------------------------------------
    # Legend
    # ----------------------------------------

    legend_width = 95
    legend_height = 28

    legend_x = left + chart_width - legend_width - 6
    legend_y = top + 4

    svg.append(
        f"""
        <rect
            x="{legend_x}"
            y="{legend_y}"
            width="{legend_width}"
            height="{legend_height}"
            rx="2"
            ry="2"
            fill="white"
            fill-opacity="0.9"
            stroke="#d0d0d0"
            stroke-width="0.3"/>

        <rect
            x="{legend_x + 6}"
            y="{legend_y + 6}"
            width="8"
            height="8"
            fill="#2563eb"/>

        <text
            x="{legend_x + 20}"
            y="{legend_y + 13}"
            font-size="8"
            fill="#222">
            Student
        </text>

        <rect
            x="{legend_x + 6}"
            y="{legend_y + 17}"
            width="8"
            height="8"
            fill="#7c3aed"/>

        <text
            x="{legend_x + 20}"
            y="{legend_y + 24}"
            font-size="8"
            fill="#222">
            Average
        </text>
        """
    )

    svg.append("</svg>")

    return "".join(svg)
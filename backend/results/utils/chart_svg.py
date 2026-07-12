import math


def generate_chart(results):
    """
    Returns an SVG chart.

    results = [
        {
            "subject_code": "ENG",
            "total_score": 75,
            "subject_average": 64,
        }
    ]
    """

    if not results:
        return ""

    subjects = [r["subject_code"] for r in results]
    scores = [float(r["total_score"]) for r in results]
    averages = [
        float(r.get("subject_average") or 0)
        for r in results
    ]

    # ----------------------------------------
    # Layout
    # ----------------------------------------

    left = 60
    right = 25
    top = 15
    bottom = 40

    chart_height = 180

    bar_width = 16
    gap_between_bars = 4
    group_spacing = 14

    group_width = (
        bar_width * 2
        + gap_between_bars
        + group_spacing
    )

    chart_width = max(
        500,
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
        width="{width}"
        height="{height}"
        viewBox="0 0 {width} {height}"
        preserveAspectRatio="xMidYMid meet">
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
        stroke-width="1"/>
        """
        )

        svg.append(
            f"""
            <text
            x="{left - 8}"
            y="{yy + 4}"
            font-size="10"
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
            stroke-width="1"/>
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
        stroke-width="1.2"/>
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

        avg_height = (
            averages[i] / max_score
        ) * chart_height

        # Student

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

        # Average

        svg.append(
            f"""
            <rect
            x="{gx + bar_width + gap_between_bars}"
            y="{y(averages[i])}"
            width="{bar_width}"
            height="{avg_height}"
            rx="2"
            fill="#7c3aed"/>
            """
        )

        # Subject Labels

        center = gx + bar_width

        svg.append(
            f"""
            <text
            x="{center + 8}"
            y="{top + chart_height + 14}"
            font-size="10"
            text-anchor="end"
            transform="rotate(-40 {center + 8},{top + chart_height + 14})"
            fill="#444">
            {subject}
            </text>
            """
        )

    # ----------------------------------------
    # Y Axis Label
    # ----------------------------------------

    svg.append(
        f"""
        <text
        transform="rotate(-90)"
        x="-{top + chart_height / 2}"
        y="18"
        font-size="11"
        text-anchor="middle"
        fill="#444">
        Subject Scores
        </text>
        """
    )
    # ----------------------------------------
    # Legend (drawn last so it sits above bars)
    # ----------------------------------------

    legend_width = 120
    legend_height = 34

    legend_x = left + chart_width - legend_width - 8
    legend_y = top + 6

    svg.append(
        f"""
        <rect
            x="{legend_x}"
            y="{legend_y}"
            width="{legend_width}"
            height="{legend_height}"
            rx="3"
            ry="3"
            fill="white"
            fill-opacity="0.88"
            stroke="#d0d0d0"
            stroke-width="0.5"/>

        <rect
            x="{legend_x + 8}"
            y="{legend_y + 7}"
            width="10"
            height="10"
            fill="#2563eb"/>

        <text
            x="{legend_x + 24}"
            y="{legend_y + 16}"
            font-size="10"
            fill="#222">
            Student
        </text>

        <rect
            x="{legend_x + 8}"
            y="{legend_y + 21}"
            width="10"
            height="10"
            fill="#7c3aed"/>

        <text
            x="{legend_x + 24}"
            y="{legend_y + 30}"
            font-size="10"
            fill="#222">
            Average
        </text>
        """
    )
    svg.append("</svg>")

    return "".join(svg)
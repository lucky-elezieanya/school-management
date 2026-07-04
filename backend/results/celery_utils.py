from celery import Task


class ProgressTask(Task):
    """
    Base task that supports progress updates.
    """

    def update_progress(
        self,
        current,
        total,
        message="Processing...",
    ):
        self.update_state(
            state="PROGRESS",
            meta={
                "current": current,
                "total": total,
                "percent": int(
                    (current / total) * 100
                )
                if total else 0,
                "message": message,
            },
        )
class ProgressTask:
    """
    Base class for reporting progress during long-running operations.

    Subclasses may override `update_state()` to persist or broadcast
    progress information.
    """

    def update_state(self, **kwargs):
        """
        Override this method in subclasses.
        """
        pass

    def update_progress(
        self,
        current: int,
        total: int,
        message: str = "Processing...",
    ):
        percent = int((current / total) * 100) if total else 0

        self.update_state(
            state="PROGRESS",
            meta={
                "current": current,
                "total": total,
                "percent": percent,
                "message": message,
            },
        )
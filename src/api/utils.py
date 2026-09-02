"""API utility functions and batch processing pipeline."""

import asyncio
from typing import List, Dict, Any, Callable, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class BatchProcessor:
    """Handle batch transaction processing with progress tracking."""

    def __init__(self, batch_size: int = 100, callback: Optional[Callable] = None):
        """
        Initialize batch processor.

        Args:
            batch_size: Number of items to process per batch
            callback: Optional callback function for progress updates
        """
        self.batch_size = batch_size
        self.callback = callback
        self.processed = 0
        self.total = 0
        self.start_time = None
        self.errors = []

    async def process_async(
        self,
        items: List[Any],
        process_func: Callable,
        max_concurrent: int = 5,
    ) -> Dict[str, Any]:
        """
        Process items asynchronously with concurrency control.

        Args:
            items: List of items to process
            process_func: Async function to apply to each item
            max_concurrent: Maximum concurrent operations

        Returns:
            Processing results with timing and error information
        """
        self.total = len(items)
        self.start_time = datetime.utcnow()
        self.processed = 0
        self.errors = []

        results = []
        semaphore = asyncio.Semaphore(max_concurrent)

        async def process_with_semaphore(item):
            async with semaphore:
                try:
                    result = await process_func(item)
                    self.processed += 1
                    if self.callback:
                        self.callback(self.processed, self.total)
                    return result
                except Exception as e:
                    self.errors.append({"item": item, "error": str(e)})
                    logger.error(f"Error processing item {item}: {e}")
                    return None

        tasks = [process_with_semaphore(item) for item in items]
        results = await asyncio.gather(*tasks)

        elapsed = (datetime.utcnow() - self.start_time).total_seconds()

        return {
            "total_processed": self.processed,
            "total_items": self.total,
            "errors": len(self.errors),
            "elapsed_seconds": elapsed,
            "items_per_second": self.processed / elapsed if elapsed > 0 else 0,
            "results": [r for r in results if r is not None],
            "error_details": self.errors if self.errors else None,
        }


class ErrorHandler:
    """Centralized error handling and logging."""

    @staticmethod
    def log_error(error_type: str, message: str, context: Dict = None):
        """Log an error with context."""
        context_str = f" | Context: {context}" if context else ""
        logger.error(f"[{error_type}] {message}{context_str}")

    @staticmethod
    def format_api_error(status_code: int, message: str, detail: str = None) -> Dict:
        """Format error response for API."""
        return {
            "status": "error",
            "status_code": status_code,
            "message": message,
            "detail": detail or message,
            "timestamp": datetime.utcnow().isoformat(),
        }

    @staticmethod
    def validate_input(data: Dict, required_fields: List[str]) -> tuple[bool, Optional[str]]:
        """Validate required fields in input data."""
        missing = [f for f in required_fields if f not in data or data[f] is None]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"
        return True, None


class MetricsAggregator:
    """Aggregate metrics across multiple transactions."""

    def __init__(self):
        self.predictions = []
        self.timings = []

    def add_prediction(self, prediction: Dict):
        """Add a prediction to aggregation."""
        self.predictions.append(prediction)

    def add_timing(self, operation: str, duration_ms: float):
        """Add timing information."""
        self.timings.append({"operation": operation, "duration_ms": duration_ms})

    def get_summary(self) -> Dict:
        """Get aggregated metrics."""
        if not self.predictions:
            return {}

        fraud_count = sum(1 for p in self.predictions if p.get("is_fraud_classical"))
        avg_confidence = sum(p.get("confidence_classical", 0) for p in self.predictions) / len(self.predictions)

        return {
            "total_predictions": len(self.predictions),
            "fraud_detected": fraud_count,
            "fraud_rate": fraud_count / len(self.predictions) * 100 if self.predictions else 0,
            "avg_confidence": round(avg_confidence, 4),
            "avg_inference_time_ms": sum(t["duration_ms"] for t in self.timings) / len(self.timings) if self.timings else 0,
        }


def paginate_results(items: List[Any], page: int = 1, page_size: int = 20) -> Dict:
    """Paginate results for list endpoints."""
    total = len(items)
    offset = (page - 1) * page_size
    end = offset + page_size

    return {
        "items": items[offset:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "has_next": end < total,
        "has_previous": page > 1,
    }


def format_timestamp(dt: datetime) -> str:
    """Format datetime for API responses."""
    return dt.isoformat() + "Z" if dt else None

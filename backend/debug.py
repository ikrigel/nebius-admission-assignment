"""Debug utilities for backend logging and monitoring."""

import logging
import time
import functools
import json
from typing import Any, Callable
from datetime import datetime

# Color codes for terminal output
class Colors:
    """ANSI color codes for terminal output."""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class DebugLogger:
    """Enhanced logging with formatted output."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.timers = {}

    def log_request(self, method: str, path: str, **kwargs) -> None:
        """Log incoming request."""
        self.logger.info(
            f"{Colors.CYAN}→ {method} {path}{Colors.RESET}",
            extra={'method': method, 'path': path, **kwargs}
        )

    def log_response(self, status: int, duration_ms: float, **kwargs) -> None:
        """Log outgoing response."""
        color = Colors.GREEN if 200 <= status < 300 else Colors.YELLOW if 300 <= status < 400 else Colors.RED
        self.logger.info(
            f"{color}← {status} ({duration_ms:.1f}ms){Colors.RESET}",
            extra={'status': status, 'duration_ms': duration_ms, **kwargs}
        )

    def log_error(self, message: str, error: Exception = None, **kwargs) -> None:
        """Log error with traceback."""
        self.logger.error(
            f"{Colors.RED}❌ {message}{Colors.RESET}",
            exc_info=error,
            extra=kwargs
        )

    def log_success(self, message: str, **kwargs) -> None:
        """Log success message."""
        self.logger.info(
            f"{Colors.GREEN}✅ {message}{Colors.RESET}",
            extra=kwargs
        )

    def log_debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        self.logger.debug(
            f"{Colors.BLUE}🔷 {message}{Colors.RESET}",
            extra=kwargs
        )

    def log_data(self, label: str, data: Any, level: int = logging.DEBUG) -> None:
        """Log structured data as JSON."""
        try:
            json_str = json.dumps(data, indent=2, default=str)
            self.logger.log(level, f"{Colors.CYAN}📊 {label}:{Colors.RESET}\n{json_str}")
        except (TypeError, ValueError):
            self.logger.log(level, f"{Colors.CYAN}📊 {label}: {data}{Colors.RESET}")

    def start_timer(self, key: str) -> None:
        """Start a named timer."""
        self.timers[key] = time.time()
        self.logger.debug(f"{Colors.BLUE}⏱️  Starting: {key}{Colors.RESET}")

    def end_timer(self, key: str, log_level: int = logging.INFO) -> float:
        """End a named timer and return duration in ms."""
        if key not in self.timers:
            self.logger.warning(f"⏱️  Timer '{key}' not found")
            return 0.0

        duration_ms = (time.time() - self.timers[key]) * 1000
        del self.timers[key]
        self.logger.log(
            log_level,
            f"{Colors.GREEN}✓ {key}: {duration_ms:.1f}ms{Colors.RESET}"
        )
        return duration_ms

    def log_api_call(self, provider: str, model: str, tokens_used: int = 0, **kwargs) -> None:
        """Log API call details."""
        self.logger.info(
            f"{Colors.CYAN}📡 API Call: {provider} ({model}){Colors.RESET}",
            extra={'provider': provider, 'model': model, 'tokens': tokens_used, **kwargs}
        )


def debug_timer(logger: DebugLogger, name: str = None):
    """Decorator to time function execution."""
    def decorator(func: Callable) -> Callable:
        timer_name = name or f"{func.__module__}.{func.__name__}"

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger.start_timer(timer_name)
            try:
                result = await func(*args, **kwargs)
                logger.end_timer(timer_name, log_level=logging.DEBUG)
                return result
            except Exception as e:
                logger.log_error(f"Error in {timer_name}", error=e)
                raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger.start_timer(timer_name)
            try:
                result = func(*args, **kwargs)
                logger.end_timer(timer_name, log_level=logging.DEBUG)
                return result
            except Exception as e:
                logger.log_error(f"Error in {timer_name}", error=e)
                raise

        # Return appropriate wrapper
        if hasattr(func, '__await__') or hasattr(func, '_is_coroutine'):
            return async_wrapper
        return sync_wrapper

    return decorator


# Global debug logger instance
debug = DebugLogger(__name__)


def setup_debug_logging(level: int = logging.DEBUG) -> None:
    """Configure debug logging with enhanced formatting."""
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        f'%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)

    # Suppress verbose third-party logs
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

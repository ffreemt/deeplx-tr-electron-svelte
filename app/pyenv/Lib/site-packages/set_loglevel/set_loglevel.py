"""Set loglevel."""
# pylint: disable=invalid-name, duplicate-code, line-too-long, broad-except
import dotenv
import environs
from logzero import logger


def set_loglevel(
    level: int = 20,
    force: bool = False,
) -> int:
    """Return an integer based on env LOGLEVEL.

    Args:
        level: set loglevel if env LOGLEVEL is not set.
        force: bool, use level if set.
        if force is not set, env LOGLEVEL takes precedence.
        set env LOGLEVEL to 10/debug/DEBUG to turn on debug
    Returns:
        an integer for using in logzero.loglevel()
        if env LOGLEVEL is not set, use level.

    >>> loglevel(force=True)
    20
    >>> import os; os.environ['logleve'] = 'debug'
    >>> loglevel()
    10
    """
    try:
        level = int(level)
    except Exception:
        level = 20

    if force:
        return level

    # check .env for LOGLEVEL='debug' etc
    try:
        dotenv.load_dotenv()
    except Exception as e:
        logger.error(e)
        raise

    try:
        _ = environs.Env().log_level("LOGLEVEL")
    except (environs.EnvError, environs.EnvValidationError):
        _ = None
    except Exception:
        _ = None

    _ = _ or level
    return _

"""Convert rowdata (json in rg-grid) to docx."""
import os
import sys

from loguru import logger
from set_loglevel import set_loglevel

# if LOGURU_LEVEL is set use it
# otherwise set according to set_loglevel, default loglevel "INFO"/20
if os.environ.get("LOGURU_LEVEL") is None:
    logger.remove()
    logger.add(sys.stderr, level=set_loglevel())


def rowdata2file():
    """Define rowdata2file."""
    logger.debug(" entry ")

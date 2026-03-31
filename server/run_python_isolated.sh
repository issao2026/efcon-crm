#!/bin/bash
# Completely isolated Python execution
unset PYTHONHOME PYTHONPATH LD_LIBRARY_PATH LD_PRELOAD
unset VIRTUAL_ENV CONDA_PREFIX
export PATH=/usr/bin:/bin:/usr/local/bin
exec /usr/bin/python3.11 "$@"

# !@file asgi.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

"""
ASGI config for dlprofwebserver project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/asgi/
"""

import os
import logging

from django.core.asgi import get_asgi_application
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dlprofwebserver.settings')


def build_app(database, bind_address):
    logging.basicConfig(format='[dlprofviewer-%(asctime)s] %(message)s',
                        datefmt='%I:%M:%S %p %Z',
                        level=logging.INFO)
    settings.DATABASE = database
    settings.BIND_ADDRESS = bind_address
    return get_asgi_application()

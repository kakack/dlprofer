import logging
import socket

from django.apps import AppConfig
from django.conf import settings


class DlprofConfig(AppConfig):
    name = 'dlprof'

    def ready(self):
        bind_all_address = '0.0.0.' + '0'
        if settings.BIND_ADDRESS.split(':', 1)[0] == bind_all_address:
            logging.info('dlprofviewer running at http://' +
                         socket.gethostname() + ':' +
                         settings.BIND_ADDRESS.rsplit(':', 1)[-1])
        else:
            logging.info('dlprofviewer running at http://' +
                         settings.BIND_ADDRESS)

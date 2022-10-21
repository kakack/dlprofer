#! /usr/bin/python
# -*- coding: utf-8 -*-

import os
from setuptools import setup, find_packages

setup(
    name='brdlprof',
    version="1.0.0",
    packages=find_packages(),
    package_dir = {
        'dlprofviewer': 'dlprofviewer',
        'dlprof': 'dlprofviewer/dlprof',
        'dlproftool': 'dlprofviewer/dlproftool',
        'dlprofwebserver': 'dlprofviewer/dlprofwebserver',
        'brdlprof': 'brdlprof'
    },
    package_data = {
         '': ['include/dlprof/api/dlprof_core.h'],
    },
    author="Kaka Chen",
    author_email="kakachen@biren.com",
    maintainer="Kaka Chen",
    maintainer_email="kakachen@biren.com",
    license="BSD 3-Clause License",
    description='BIREN Profiler',
    classifiers=[
            'Topic :: Scientific/Engineering',
            'Topic :: Scientific/Engineering :: Artificial Intelligence',
            'Topic :: Utilities',
            'Programming Language :: Python :: 3',
            'Programming Language :: Python :: 3.9',
            'Environment :: Console',
            'Natural Language :: English',
            'Operating System :: OS Independent',
    ],
    keywords='profiling, deep learning, ' \
             'machine learning, supervised learning, ' \
             'unsupervised learning, reinforcement learning, ',
    platforms=["Linux"],
    include_package_data=True,
    install_requires=[
        'torch>=1.2.0',
        'cxxfilt>=0.2.0',
        'tqdm>=4.35.0',
        'numpy>=1.17.2',
        'gunicorn',
        'setuptools',
        'django==3.2.6',
        'whitenoise',
        'uvicorn',
        'nvidia-pyindex',
    ],
    entry_points={
        'console_scripts': [
                'dlprofviewer =  dlprofviewer.__main__:main',
                'dlprof = brdlprof.__main__:main',
                'chrome_convert = dlprofviewer.dlproftool.chrome_convert:main',
        ],
    },
)

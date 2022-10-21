#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
#
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

import sqlite3
from gunicorn.app.wsgiapp import run
import os
import sys
import argparse
import pathlib
import pkg_resources
import ctypes

sys.path.append(r'./')
sys.path.append("./dlproftool")

import dlprofviewer
# from dlproftool import *

def main():
    version_sting = 'DLProf Viewer '

    version = '1.0.0'

    version_sting = version_sting + str(version)

    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--version',
        action='version',
        version=version_sting
    )
    # parser.add_argument('database',
    #     default='./dlproftool/dlprof_dldb.sqlite',
    #     help='Specify path to DLProf database.')
    parser.add_argument(
        '-b',
        '--bind',
        metavar='ADDRESS',
        help='Specify alternate bind address. Use \'0.0.0.0\' to serve to the entire local network. [default: localhost]',
        default='localhost')
    parser.add_argument('-p',
                        '--port',
                        help='Specify alternate port. [default: 8000]',
                        default='8000')
    parser.add_argument('-l',
                        '--log',
                        help='logpath',
                        default='./log')
    args = parser.parse_args()

    # os.system('python3 dlproftool/chrome_convert.py {}'.format(args.log))


    dlprofwebserver_path = pkg_resources.resource_filename(
        'dlprofviewer', 'dlprofwebserver')
    sys.path.append(dlprofwebserver_path)

    dlprof_path = pkg_resources.resource_filename(
        'dlprofviewer', 'dlprof')
    sys.path.append(dlprof_path)

    dlproftool_path = pkg_resources.resource_filename(
        'dlprofviewer', 'dlproftool')
    sys.path.append(dlproftool_path)
    database_path = os.path.join(dlproftool_path, "dlprof_dldb.sqlite")

    dlprofviewer_path = pkg_resources.resource_filename(
        'dlprofviewer', '')
    sys.path.append(dlprofviewer_path)

    if pathlib.Path(database_path).is_file() == False:
        raise FileNotFoundError(
            f'Unable to find dlprof database at: {database_path}')

    if not is_dlprof_db(database_path):
        msg = f'The file specified "{database_path}" is not a DLProf database. '
        msg += f'If no dlprof database exists, there was an error running DLProf. '
        msg += f'Look at the DLProf output for errors.'
        raise ValueError(msg)

    os.system('python3 {}/sqlite.py {}'.format(dlproftool_path, args.log))

    # args.database = str(pathlib.Path(args.database).resolve())
    database_path = str(pathlib.Path(database_path).resolve())

    sys.argv = [
        'gunicorn',
        f'dlprofwebserver.asgi:build_app(database="{database_path}", bind_address="{args.bind}:{args.port}")',
        '--log-level', 'warning', '-k', 'uvicorn.workers.UvicornH11Worker',
        '--chdir', f'{dlprofwebserver_path}', '-b', f'{args.bind}:{args.port}'
    ]
    run()


def is_dlprof_db(database):
    rows = do_query(database, 'read_only_system_config')
    return len(rows) == 1 and len(rows[0]) == 1 and rows[0][0] == 1


def do_query(database, table):
    conn = None
    cursor = None
    rows = None

    try:
        conn = sqlite3.connect(database)
        c = conn.cursor()

        sql = 'SELECT Count(*) FROM sqlite_master WHERE type="table" AND name="'
        sql += table
        sql += '";'

        c.execute(sql)
        rows = c.fetchall()

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    return rows

if __name__ == '__main__':
    main()

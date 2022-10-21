# !@file sql.py
# 
#  Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

import string
import os
import errno
import sqlite3

from django.conf import settings

class Sql(object):
    __request_values = None

    @staticmethod
    def get_dlprof_coredb_filename():
        return settings.DATABASE
        
    def do_query(self, request, sql_query, sql_args):
        """ Common helper method to get database result set
        :return: result set for non datatable (eg, panel or html table)
        """

        Sql.__request_values = request
        conn = None
        cursor = None
        try:
            conn = self.__create_connection     # connection object is not thread-safe
            cursor = conn.cursor()              # cursor object is also not thread-safe
            cursor.execute(sql_query, sql_args)
            db_rows = cursor.fetchall()
            return db_rows

        except sqlite3.Error as error:
            print("Sqlite3 error:", error)
            print("Here is the problem query: <" + sql_query + ">")
            print("Using args: ", sql_args)
            raise error

        except Exception as error:
            print("Exception while processing sql query: error=", error)
            print("Here is the problem query: <" + sql_query + ">")
            print("Using args: ", sql_args)
            raise error

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    def get_result(self):

        payload = []

        db_rows = self.do_query(self._request, self._sql_query, self._sql_args)
        columns = self.get_columns()
        for db_row in db_rows:
            row = {}

            for idx in range(len(columns)):
                row[columns[idx]] = db_row[idx]

            payload.append(row)

        return payload

    def get_one_result(self):

        db_rows = self.do_query(self._request, self._sql_query, self._sql_args)
        if len(db_rows) != 1:
            raise AttributeError(self.__class__.__name__ + ': Expecting one row (got ' + str(len(db_rows)) + ')')

        db_row = db_rows[0]
        row = {}
        columns = self.get_columns()
        for idx in range(len(columns)):
            row[columns[idx]] = db_row[idx]

        return row

    @property
    def __create_connection(self):
        """ create a database connection to the SQLite database
            connection object is not thread-safe
        :return: Connection object or None
        """

        fqp_db_file = Sql.get_dlprof_coredb_filename()

        if 'debug' in Sql.__request_values:
            print('About to open database <' + fqp_db_file + '>')

        if fqp_db_file is None or not os.path.isfile(fqp_db_file):
            raise FileNotFoundError(
                errno.ENOENT, os.strerror(errno.ENOENT), fqp_db_file)

        try:
            conn = sqlite3.connect('file:' + fqp_db_file + '?mode=ro', uri=True)

        except sqlite3.Error as error:
            print(error)
            raise error

        return conn

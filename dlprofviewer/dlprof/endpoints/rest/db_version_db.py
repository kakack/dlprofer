# !@file db_version_db.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from dlprof.endpoints.sql import Sql

class DbVersionDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        columns = ','.join(self.get_columns())

        self._request = request

        self._sql_query = "SELECT "
        self._sql_query += columns
        self._sql_query += " FROM view_db_version "

        self._sql_args = []

        self.get_result = self.get_one_result

    def get_columns(self):
        return [
            'current_version',
            'original_version'
        ]

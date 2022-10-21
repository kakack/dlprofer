# !@file longest_iter_duration_db.py
# 
#  Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from dlprof.endpoints.sql import Sql

class LongestIterDurationDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        aggr_id = request['aggregation']
        domain_name = request['domain']
        columns = ','.join(self.get_columns())

        self._request = request
        self._sql_query = "SELECT " + columns + " FROM view_iterations_all via, view_performance_summary ps  "  # nosec
        self._sql_query += "WHERE "
        self._sql_query += "        via.aggr_id = ps.aggr_id "
        self._sql_query += "    AND ps.aggr_id=? "
        self._sql_query += "    AND ps.domain_name = ? "
        self._sql_query += "    AND via.iter_value BETWEEN ps.iter_start AND ps.iter_stop "
        self._sql_query += "ORDER BY via.duration desc "
        self._sql_query += "LIMIT 1 "
        self._sql_args = [ str(aggr_id), domain_name ]

        self.get_result = self.get_one_result

    def get_columns(self):
        return [ 'iter_value', 'duration' ]

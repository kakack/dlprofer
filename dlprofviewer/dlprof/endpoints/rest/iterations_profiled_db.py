# !@file iterations_profiled_db.py
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

class IterationsProfiledDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        aggr_id = request['aggregation']
        domain_name = request['domain']
        columns = ','.join(self.get_columns())

        self._request = request
        self._sql_query = "SELECT "
        self._sql_query += columns
        self._sql_query += " FROM view_iterations_profiled WHERE aggr_id=? AND domain_name=? "
        self._sql_args = [ str(aggr_id), domain_name ]

    def get_columns(self):
        return [
            'iter_value',
            'tc_duration',
            'non_tc_duration',
            'memory_duration',
            'dataloader_duration',
            'io_duration',
            'cpu_duration',
            'other_duration']

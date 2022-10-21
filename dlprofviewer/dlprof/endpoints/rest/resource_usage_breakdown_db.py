# !@file resource_usage_breakdown_db.py
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

class ResourceUsageBreakdownDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        aggr_id = request['aggregation']
        domain_name = request['domain']
        columns = ','.join(self.get_columns())

        self._request = request
        self._sql_query = "SELECT " + columns + " FROM view_resource_usage_breakdown WHERE aggr_id=? AND domain_name=?"  # nosec
        self._sql_args = [ str(aggr_id), domain_name ]

        self.get_result = self.get_one_result

    def get_columns(self):
        return [
            'tc_duration_pct',
            'non_tc_duration_pct',
            'memory_duration_pct',
            'dataloader_duration_pct',
            'io_duration_pct',
            'cpu_duration_pct',
            'other_duration_pct']



# !@file aggregations_db.py
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

class AggregationsDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        columns = ','.join(self.get_columns())

        self._request = request
        self._sql_query = "SELECT " + columns + " FROM view_aggregations ORDER BY aggr_start" #nosec
        self._sql_args = []
        

    def get_columns(self):
        return [ 
                'aggr_id', 
                'iter_start', 
                'iter_stop', 
                'iter_aggregated', 
                'key_node_name', 
                'user_name', 
                'host_name', 
                'aggr_start', 
                'aggr_end' ]

# !@file expert_systems_db.py
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

class ExpertSystemsDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        aggr_id = request['aggregation']
        columns = ','.join(self.get_columns())

        self._request = request
        self._sql_query = "SELECT " + columns + " FROM view_expert_systems WHERE aggr_id=? "  # nosec
        self._sql_args = [ str(aggr_id) ]

    def get_columns(self):
        return [
            'problem',
            'recommendation',
            'javascript_function',
            'javascript_args']

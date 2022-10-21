# !@file top_ten_gpu_ops_db.py
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

class TopTenGpuOpsDB(Sql):
    _request = None
    _sql_query = None


    def __init__(self, request):
        aggr_id = request['aggregation']
        domain_name = request['domain']
        columns = ','.join(self.get_columns())

        self._request = request
        self._sql_query = "SELECT " + columns + " FROM view_op_nodes WHERE aggr_id=? AND domain_name=? ORDER BY gpu_time desc LIMIT 10 "  # nosec
        self._sql_args = [ str(aggr_id), domain_name ]


    def get_result(self):

        payload = []

        db_rows = self.do_query(self._request, self._sql_query, self._sql_args)
        columns = self.get_columns()
        for db_row in db_rows:
            row = {}

            for idx in range(len(columns)):
                row[columns[idx]] = db_row[idx]

            payload.append(row)


        response = {}
        response['iTotalRecords'] = len(db_rows)
        response['iTotalDisplayRecords'] = len(db_rows)
        response['topTenDataProp'] = payload

        return response


    def get_columns(self):
        return [
            'gpu_time',
            'op_node_name',
            'direction',
            'op_node_type',
            'num_calls',
            'tc_eligible',
            'using_tc']

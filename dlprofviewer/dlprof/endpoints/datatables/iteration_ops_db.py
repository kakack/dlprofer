# !@file iteration_ops_db.py
# 
#  Copyright (c) 2020-2021, NVIDIA CORPORATION.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from .datatables_db import DatatablesDB

class IterationOpsDB(DatatablesDB):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        super().__init__(request)

        aggr_id = request['aggregation']
        domain_name = request['domain']
        iter_value = request['iterValue']

        from_clause = " FROM view_iteration_ops "
        where_clause = " WHERE aggr_id=? AND domain_name=? AND iter_value=? "

        self._sql_count = "SELECT COUNT(*) "
        self._sql_count += from_clause
        self._sql_count += where_clause

        self._sql_rows = "SELECT  "
        self._sql_rows += self.get_column_list()
        self._sql_rows += " "
        self._sql_rows += from_clause
        self._sql_rows += where_clause

        self._sql_args = [ str(aggr_id), domain_name, str(iter_value) ]

    #overrides(DatatablesDB)
    def get_columns(self):
        return [
            'op_node_id',
            'op_node_name',
            'direction',
            'op_node_type',
            'total_count',
            'tc_count',
            'total_gpu_time',
            'tc_gpu_time',
            'data_type',
            'stack_trace',
        ]

    #overrides(DatatablesDB)
    def get_property_key(self):
        return 'iterationOpsProp'

    #overrides(DatatablesDB)
    def get_search_constraint(self):
        constraint = ' AND ('
        constraint += "op_node_name LIKE ? "
        constraint += "OR direction LIKE ? "
        constraint += "OR op_node_type LIKE ? "
        constraint += "OR total_count LIKE ? "
        constraint += "OR tc_count LIKE ? "
        constraint += "OR total_gpu_time LIKE ? "
        constraint += "OR tc_gpu_time LIKE ? "
        constraint += "OR data_type LIKE ? "
        constraint += "OR stack_trace LIKE ? "
        constraint += ') '

        return constraint

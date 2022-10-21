# !@file kernel_summaries_db.py
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

class OpTypeSummaryDB(DatatablesDB):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        super().__init__(request)

        aggr_id = request['aggregation']
        domain_name = request['domain']
        columns = ','.join(self.get_columns())

        from_clause  = " FROM view_op_type_summary "
        where_clause = " WHERE aggr_id=? AND domain_name=? "

        self._sql_count = "SELECT COUNT(*) "
        self._sql_count += from_clause
        self._sql_count += where_clause

        self._sql_rows = "SELECT " + columns + " "
        self._sql_rows += from_clause
        self._sql_rows += where_clause

        self._sql_args = [ str(aggr_id), domain_name ]

    #overrides(DatatablesDB)
    def get_columns(self):
        return [
            'op_node_type',
            'num_nodes',
            'num_calls',
            'cpu_time_sum',
            'cpu_time_avg',
            'cpu_time_min',
            'cpu_time_max',
            'gpu_time_sum',
            'gpu_time_avg',
            'gpu_time_min',
            'gpu_time_max',
            'cpu_overhead_sum',
            'cpu_overhead_avg',
            'cpu_overhead_min',
            'cpu_overhead_max',
            'gpu_idle_sum',
            'gpu_idle_avg',
            'gpu_idle_min',
            'gpu_idle_max',
        ]

    #overrides(DatatablesDB)
    def get_property_key(self):
        return 'opTypeSummaryProp'

    #overrides(DatatablesDB)
    def get_search_constraint(self):
        constraint = ' AND ('
        constraint += "   op_node_type LIKE ? "
        constraint += "OR num_nodes LIKE ? "
        constraint += "OR num_calls LIKE ? "
        constraint += "OR cpu_time_sum LIKE ? "
        constraint += "OR cpu_time_avg LIKE ? "
        constraint += "OR cpu_time_min LIKE ? "
        constraint += "OR cpu_time_max LIKE ? "
        constraint += "OR gpu_time_sum LIKE ? "
        constraint += "OR gpu_time_avg LIKE ? "
        constraint += "OR gpu_time_min LIKE ? "
        constraint += "OR gpu_time_max LIKE ? "
        constraint += "OR cpu_overhead_sum LIKE ? "
        constraint += "OR cpu_overhead_avg LIKE ? "
        constraint += "OR cpu_overhead_min LIKE ? "
        constraint += "OR cpu_overhead_max LIKE ? "
        constraint += "OR gpu_idle_sum LIKE ? "
        constraint += "OR gpu_idle_avg LIKE ? "
        constraint += "OR gpu_idle_min LIKE ? "
        constraint += "OR gpu_idle_max LIKE ? "
        constraint += ') '

        return constraint

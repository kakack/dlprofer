# !@file iteration_summary_db.py
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

class IterationSummaryDB(DatatablesDB):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        super().__init__(request)

        aggr_id = request['aggregation']
        domain_name = request['domain']

        from_clause = " FROM view_iterations_profiled "
        where_clause = " WHERE aggr_id=? AND domain_name=? "

        self._sql_count = "SELECT COUNT(*) "
        self._sql_count += from_clause
        self._sql_count += where_clause

        self._sql_rows = "SELECT iter_value, start_time, duration, total_kernel_count, using_tc_kernel_count, "
        self._sql_rows += " (tc_duration + non_tc_duration) as average_gpu_total, "
        self._sql_rows += " tc_duration as average_gpu_time_using_tc "
        self._sql_rows += from_clause
        self._sql_rows += where_clause

        self._sql_args = [ str(aggr_id), domain_name ]

    #overrides(DatatablesDB)
    def get_columns(self):
        return [
            'iter_value',
            'start_time',
            'duration',
            'total_kernel_count',
            'using_tc_kernel_count',
            'average_gpu_total',
            'average_gpu_time_using_tc',
        ]

    #overrides(DatatablesDB)
    def get_property_key(self):
        return 'iterationSummaryProp'

    #overrides(DatatablesDB)
    def get_search_constraint(self):
        constraint = ' AND ('
        constraint += "iter_value LIKE ? "
        constraint += "OR start_time LIKE ? "
        constraint += "OR duration LIKE ? "
        constraint += "OR total_kernel_count LIKE ? "
        constraint += "OR using_tc_kernel_count LIKE ? "
        constraint += "OR average_gpu_time_using_tc LIKE ? "
        constraint += "OR average_gpu_time_not_using_tc LIKE ? "
        constraint += "OR average_gpu_time_other LIKE ? "
        constraint += ') '

        return constraint

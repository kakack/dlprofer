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

class KernelSummariesDB(DatatablesDB):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        super().__init__(request)

        aggr_id = request['aggregation']
        domain_name = request['domain']
        op_id = request['opID']
        columns = ','.join(self.get_columns())

        from_clause  = " FROM view_kernel_summaries "
        where_clause = " WHERE aggr_id=? AND domain_name=? AND op_node_id=?"

        self._sql_count = "SELECT COUNT(*) "
        self._sql_count += from_clause
        self._sql_count += where_clause

        self._sql_rows = "SELECT " + columns + " "
        self._sql_rows += from_clause
        self._sql_rows += where_clause

        self._sql_args = [ str(aggr_id), domain_name, str(op_id) ]

    #overrides(DatatablesDB)
    def get_columns(self):
        return [
            'kernel_name',
            'uses_tc',
            'calls',
            'gpu_time',
            'avg',
            'min',
            'max'
            ]

    #overrides(DatatablesDB)
    def get_property_key(self):
        return 'kernelSummariesProp'

    #overrides(DatatablesDB)
    def get_search_constraint(self):
        constraint = ' AND ('
        constraint += "op_node_id LIKE ? "
        constraint += "OR kernel_name LIKE ? "
        constraint += "OR calls LIKE ? "
        constraint += "OR gpu_time LIKE ? "
        constraint += "OR avg LIKE ? "
        constraint += "OR min LIKE ? "
        constraint += "OR max LIKE ? "
        constraint += ') '

        return constraint

# !@file iteration_kernels_db.py
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

class IterationKernelsDB(DatatablesDB):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        super().__init__(request)

        aggr_id = request['aggregation']
        domain_name = request['domain']
        iter_value = request['iterValue']
        columns = ','.join(self.get_columns())

        from_clause = " FROM view_iteration_kernels "
        where_clause = " WHERE aggr_id=? AND domain_name=? AND iter_value=? "

        self._sql_count = "SELECT COUNT(*) "
        self._sql_count += from_clause
        self._sql_count += where_clause

        self._sql_rows = "SELECT " + columns + " "
        self._sql_rows += from_clause
        self._sql_rows += where_clause

        self._sql_args = [ str(aggr_id), domain_name, str(iter_value) ]

    #overrides(DatatablesDB)
    def get_columns(self):
        return [
            'op_node_name',
            'kernel_name',
            'device_id',
            'kernel_timestamp',
            'kernel_duration',
            'uses_tc',
            'grid',
            'block',
        ]

    #overrides(DatatablesDB)
    def get_property_key(self):
        return 'iterationKernelsProp'

    #overrides(DatatablesDB)
    def get_search_constraint(self):
        constraint = ' AND ('
        constraint += "op_node_name LIKE ? "
        constraint += "OR kernel_name LIKE ? "
        constraint += "OR kernel_timestamp LIKE ? "
        constraint += "OR kernel_duration LIKE ? "
        constraint += "OR grid LIKE ? "
        constraint += "OR block LIKE ? "
        constraint += ') '

        return constraint

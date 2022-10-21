# !@file ops_db.py
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

class OpsDB(DatatablesDB):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        super().__init__(request)

        aggr_id = request['aggregation']
        domain_name = request['domain']
        show_only_bad_ops = request['showOnlyBadOps'] == 'true'

        where_clause = ""

        if show_only_bad_ops:
            """ This will build one of two constraints:
                1) AND (is_bad_data_type = 1)
                2)        (<--- empty string)
            """

            show_bad_data_type_ops = request['showBadDataTypeOps'] == 'true'
            bad_data_type_sql = "is_bad_data_type = 1" if show_bad_data_type_ops else ""

            where_clause = "AND (" if show_bad_data_type_ops else ""
            where_clause += bad_data_type_sql if show_bad_data_type_ops else ""
            where_clause += ")" if show_bad_data_type_ops else ""

        from_clause = " FROM view_op_nodes WHERE aggr_id=? AND domain_name=? "

        self._sql_count = "SELECT COUNT(*) "
        self._sql_count += from_clause
        self._sql_count += where_clause

        self._sql_rows = "SELECT "
        self._sql_rows += self.get_column_list()
        self._sql_rows += " "
        self._sql_rows += from_clause
        self._sql_rows += where_clause

        self._sql_args = [ str(aggr_id), domain_name ]

    #overrides(DatatablesDB)
    def get_columns(self):
        return [
            'gpu_time',
            'cpu_time',
            'op_node_id',
            'op_node_name',
            'direction',
            'op_node_type',
            'num_calls',
            'tc_eligible',
            'using_tc',
            'kernel_calls',
            'data_type',
            'stack_trace'
            ]

    #overrides(DatatablesDB)
    def get_property_key(self):
        return 'opsProp'

    #overrides(DatatablesDB)
    def get_search_constraint(self):
        constraint = ' AND ('
        constraint += "gpu_time LIKE ? "
        constraint += "OR cpu_time LIKE ? "
        constraint += "OR op_node_id LIKE ? "
        constraint += "OR op_node_name LIKE ? "
        constraint += "OR direction LIKE ? "
        constraint += "OR op_node_type LIKE ? "
        constraint += "OR num_calls LIKE ? "
        constraint += "OR kernel_calls LIKE ? "
        constraint += "OR data_type LIKE ? "
        constraint += ') '

        return constraint

# !@file group_ops_db.py
# 
#  Copyright (c) 2021, NVIDIA CORPORATION & AFFILIATES.  All rights reserved.
# 
#  NVIDIA CORPORATION and its licensors retain all intellectual property
#  and proprietary rights in and to this software, related documentation
#  and any modifications thereto.  Any use, reproduction, disclosure or
#  distribution of this software and related documentation without an express
#  license agreement from NVIDIA CORPORATION is strictly prohibited.
#

from dlprof.endpoints.sql import Sql

class GroupOpsDB(Sql):
    _sql_rows = None
    _sql_count = None

    def __init__(self, request):
        aggr_id = request['aggregation']
        domain_name = request['domain']
        columns = ','.join(self.get_columns())

        from_clause  = " FROM view_group_ops "
        where_clause = " WHERE aggr_id=? AND domain_name=? "
        order_by = " ORDER BY row_full_name "

        self._request = request
        self._sql_query = "SELECT "
        self._sql_query += columns
        self._sql_query += from_clause
        self._sql_query += where_clause
        self._sql_query += order_by
        self._sql_args = [ str(aggr_id), domain_name ]


    def get_columns(self):
        return [
            'row_type',
            'row_full_id',
            'row_full_name',
            'row_trimmed_name',
            'level',
            'num_op_instances',
            'num_supported_leaf_ops',
            'num_tc_leaf_ops',
            'cpu_time_sum',
            'gpu_time_sum',
            'cpu_overhead_sum',
            'gpu_idle_sum',
        ]

    def convert_db_to_json(self, result_set):

        db_to_json_map = {}
        treeTable = []
        for idx, db_row in enumerate(result_set):
            tt_parent = self.get_parent_index(db_to_json_map, db_row, idx)

            treetable_row = {
                "tt_key": idx+1, 
                "tt_parent": tt_parent,
                "row_type": db_row['row_type'],
                "row_full_id": db_row['row_full_id'],
                "row_full_name": db_row['row_full_name'], 
                "row_trimmed_name": db_row['row_trimmed_name'] if db_row['row_type'] == 2 else db_row['row_trimmed_name'] + '/', 
                "level": db_row['level'],
                "num_op_instances": db_row['num_op_instances'],
                "num_supported_leaf_ops": db_row['num_supported_leaf_ops'],
                "num_tc_leaf_ops": db_row['num_tc_leaf_ops'],
                "cpu_time_sum": db_row['cpu_time_sum'],
                "gpu_time_sum": db_row['gpu_time_sum'],
                "cpu_overhead_sum": db_row['cpu_overhead_sum'],
                "gpu_idle_sum": db_row['gpu_idle_sum'],
            }

            treeTable.append(treetable_row)

        return treeTable

    def get_parent_index(self, db_to_json_map, db_row, idx):
        """
        Purpose of this function is to track parent indices for each level.
        
        Dive down one level: 
          Each time a level increases by a value of one, a new parent index 
          is cached in the map for all subsequent children at that level 
          (see idx 2, 6, and 8)
        
        Rise up one level: Each time a level decreases by a value of one, all the 
          parents are removed from the map for that level (and greater) so that next
          time through and new parent will be set 
           
           see how 'level 3' index 11 and 12 point to 'level 2' index 10 (not 7), 
           and how 'level 3' index 14 and 15 point to 'level 2' index 13 (not 10 or 7)
        
        Example:

        Full                                trimmed         level   idx parent
        ======================================================================
                                                            0       1   0       <--- Root node
        ConstantFolding/                    ConstantFolding 1       2   1
        Mean/                               Mean            1       3   1
        Mean_1/                             Mean_1          1       4   1
        Momentum/                           Momentum        1       5   1
        Momentum/Momentum                   Momentum        2       6   5
        Momentum/update_dense_1/            update_dense_1  2       7   5
        Momentum/update_dense_1/bias        bias            3       8   7
        Momentum/update_dense_1/kernel      kernel          3       9   7
        Momentum/update_dense_2/            update_dense_2  2       10  5
        Momentum/update_dense_2/bias        bias            3       11  10
        Momentum/update_dense_2/kernel      kernel          3       12  10
        Momentum/update_dense_3/            update_dense_3  2       13  5
        Momentum/update_dense_3/bias        bias            3       14  13
        Momentum/update_dense_3/kernel      kernel          3       15  13
        """

        level = db_row['level']

        if level not in db_to_json_map:
            db_to_json_map[level] = idx
        else:
            self.poof_keys(db_to_json_map, level)

        return db_to_json_map[level]

    def poof_keys(self, db_to_json_map, level):
        keys_to_poof = []

        for key in db_to_json_map:
            if key > level:
                keys_to_poof.append(key)

        for key in keys_to_poof:
            db_to_json_map.pop(key, None)